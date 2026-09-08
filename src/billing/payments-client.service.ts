import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { LoggingService } from '../logging/logging.service';
export interface CreatePaymentPayload { orderId: string; applicationId: string; amount: number; currency: string; paymentMethod: string; callbackUrl: string; customer: { email: string; name?: string; phone?: string }; description?: string; metadata?: Record<string, unknown>; successUrl?: string; cancelUrl?: string; }
export interface PaymentCreateResult { paymentId: string; status: string; redirectUrl?: string; expiresAt?: string; }
@Injectable()
export class PaymentsClientService {
  private readonly baseUrl = (process.env.PAYMENTS_SERVICE_URL || process.env.PAYMENT_SERVICE_URL || '').replace(/\/$/, '');
  private readonly serviceToken = (process.env.SHOP_ASSISTANT_TO_PAYMENTS_TOKEN || '').trim();
  private readonly timeout = Number(process.env.PAYMENTS_SERVICE_TIMEOUT || process.env.HTTP_TIMEOUT || 10000);
  private readonly enableCreate = String(process.env.SHOP_ASSISTANT_BILLING_ENABLE_PAYMENT_CREATE || '').toLowerCase() === 'true';
  constructor(private readonly http: HttpService, private readonly logging: LoggingService) {}
  isConfiguredForCreate(): boolean { return Boolean(this.baseUrl && this.serviceToken && this.enableCreate); }
  configurationStatus() { return { hasPaymentsServiceUrl: Boolean(this.baseUrl), hasPaymentsServiceToken: Boolean(this.serviceToken), paymentCreateEnabled: this.enableCreate }; }
  async createPayment(payload: CreatePaymentPayload, idempotencyKey: string): Promise<PaymentCreateResult> {
    if (!this.baseUrl) throw new ServiceUnavailableException('PAYMENTS_SERVICE_URL is not configured');
    if (!this.serviceToken) {
      this.logging.error('SHOP_ASSISTANT_TO_PAYMENTS_TOKEN missing; refusing unauthenticated payments call', { context: 'PaymentsClientService.createPayment' });
      throw new ServiceUnavailableException('SHOP_ASSISTANT_TO_PAYMENTS_TOKEN (Auth-minted RS256) is required for payments-microservice calls');
    }
    if (!this.enableCreate) throw new ServiceUnavailableException('Billing payment creation is not configured');
    try {
      const response = await firstValueFrom(this.http.post(`${this.baseUrl}/payments/create`, payload, { timeout: this.timeout, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${this.serviceToken}`, 'Idempotency-Key': idempotencyKey } }));
      const data = response.data?.data;
      if (!data?.paymentId) throw new Error('payments-microservice returned no paymentId');
      return data;
    } catch (error) {
      if (error instanceof ServiceUnavailableException) throw error;
      const status = error && typeof error === 'object' && 'response' in error ? (error as { response?: { status?: number } }).response?.status : undefined;
      const message = error instanceof Error ? error.message : String(error);
      this.logging.error('Shop Assistant payment creation failed', { context: 'PaymentsClientService.createPayment', status, error: message, orderId: payload.orderId });
      throw new ServiceUnavailableException('Payment creation failed');
    }
  }
}
