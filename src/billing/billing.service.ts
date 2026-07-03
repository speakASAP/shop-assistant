import { BadRequestException, ForbiddenException, Injectable, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { LoggingService } from '../logging/logging.service';
import { AuthUser } from '../auth/auth.interface';
import { BILLING_PLANS, BillingPlan, getBillingPlan, SHOP_ASSISTANT_APPLICATION_ID } from './plans';
import { PaymentsClientService } from './payments-client.service';
const ACTIVE_PAYMENT_STATUSES = new Set(['completed', 'paid', 'succeeded', 'success']);
const FAILED_PAYMENT_STATUSES = new Set(['failed', 'cancelled', 'canceled', 'expired', 'refunded']);
@Injectable()
export class BillingService {
  private readonly publicBaseUrl = (process.env.SHOP_ASSISTANT_PUBLIC_BASE_URL || process.env.PUBLIC_BASE_URL || '').replace(/\/$/, '');
  private readonly callbackToken = process.env.SHOP_ASSISTANT_BILLING_CALLBACK_TOKEN || process.env.PAYMENT_WEBHOOK_API_KEY || '';
  constructor(private readonly prisma: PrismaService, private readonly payments: PaymentsClientService, private readonly logging: LoggingService) {}
  listPlans() { return { applicationId: SHOP_ASSISTANT_APPLICATION_ID, plans: BILLING_PLANS, paymentConfiguration: this.payments.configurationStatus() }; }
  async getEntitlement(userId: string) {
    const now = new Date();
    const entitlement = await this.prisma.userEntitlement.findFirst({ where: { userId, status: 'active', OR: [{ expiresAt: null }, { expiresAt: { gt: now } }] }, orderBy: { createdAt: 'desc' } });
    const recentCheckout = await this.prisma.billingCheckout.findFirst({ where: { userId }, orderBy: { createdAt: 'desc' }, select: { id: true, orderId: true, paymentId: true, planCode: true, status: true, providerStatus: true, redirectUrl: true, createdAt: true, updatedAt: true } });
    return { hasActiveEntitlement: Boolean(entitlement), entitlement, recentCheckout, plans: BILLING_PLANS };
  }
  async createCheckout(user: AuthUser, input: { planCode?: string; paymentMethod?: string }) {
    const plan = getBillingPlan(String(input.planCode || ''));
    if (!plan) throw new BadRequestException('Unknown billing plan');
    const paymentMethod = String(input.paymentMethod || plan.allowedPaymentMethods[0] || 'card').trim();
    if (!plan.allowedPaymentMethods.includes(paymentMethod)) throw new BadRequestException('Payment method is not allowed for this plan');
    const orderId = `sa-${Date.now()}-${randomUUID().slice(0, 8)}`;
    if (!this.payments.isConfiguredForCreate()) return { paymentConfigured: false, paymentConfiguration: this.payments.configurationStatus(), checkout: this.checkoutPreview(orderId, plan, paymentMethod), message: 'Billing contract is installed, but payment creation is disabled until runtime payment configuration is supplied.' };
    const callbackUrl = this.buildUrl('/api/billing/payments/callback');
    const successUrl = this.buildUrl('/dashboard.html?billing=success');
    const cancelUrl = this.buildUrl('/dashboard.html?billing=cancel');
    if (!callbackUrl || !successUrl || !cancelUrl) throw new ServiceUnavailableException('Shop Assistant public URL is not configured for billing');
    const checkout = await this.prisma.billingCheckout.create({ data: { userId: user.id, planCode: plan.code, orderId, status: 'pending', amountCents: plan.amountCents, currency: plan.currency, paymentMethod, metadata: { applicationId: SHOP_ASSISTANT_APPLICATION_ID, billingPeriod: plan.billingPeriod, source: 'shop-assistant-dashboard' } as Prisma.InputJsonValue } });
    const payment = await this.payments.createPayment({ orderId, applicationId: SHOP_ASSISTANT_APPLICATION_ID, amount: plan.amountCents / 100, currency: plan.currency, paymentMethod, callbackUrl, successUrl, cancelUrl, customer: { email: user.email, name: [user.firstName, user.lastName].filter(Boolean).join(' ') || undefined, phone: user.phone }, description: `${plan.name} subscription`, metadata: { userId: user.id, checkoutId: checkout.id, planCode: plan.code, service: SHOP_ASSISTANT_APPLICATION_ID } }, checkout.id);
    const updated = await this.prisma.billingCheckout.update({ where: { id: checkout.id }, data: { paymentId: payment.paymentId, status: 'payment_created', providerStatus: payment.status, redirectUrl: payment.redirectUrl, expiresAt: payment.expiresAt ? new Date(payment.expiresAt) : undefined } });
    return { paymentConfigured: true, checkout: updated, redirectUrl: payment.redirectUrl };
  }
  async handlePaymentCallback(headers: Record<string, string | string[] | undefined>, body: any) {
    this.assertCallbackAuthorized(headers);
    const paymentId = String(body?.paymentId || '').trim();
    const orderId = String(body?.orderId || '').trim();
    const status = String(body?.status || '').trim().toLowerCase();
    const event = String(body?.event || '').trim().toLowerCase();
    if (!paymentId && !orderId) throw new BadRequestException('paymentId or orderId is required');
    if (!status) throw new BadRequestException('status is required');
    const checkout = await this.prisma.billingCheckout.findFirst({ where: paymentId ? { paymentId } : { orderId } });
    if (!checkout) throw new NotFoundException('Checkout not found for payment callback');
    const nextStatus = ACTIVE_PAYMENT_STATUSES.has(status) ? 'completed' : FAILED_PAYMENT_STATUSES.has(status) ? status : 'processing';
    const existingMetadata = typeof checkout.metadata === 'object' && checkout.metadata && !Array.isArray(checkout.metadata) ? checkout.metadata as Record<string, unknown> : {};
    const updated = await this.prisma.billingCheckout.update({ where: { id: checkout.id }, data: { paymentId: checkout.paymentId || paymentId || undefined, status: nextStatus, providerStatus: status, metadata: { ...existingMetadata, lastPaymentEvent: event || undefined, lastPaymentCallbackAt: new Date().toISOString() } as Prisma.InputJsonValue } });
    let entitlement = null;
    if (ACTIVE_PAYMENT_STATUSES.has(status)) entitlement = await this.activateEntitlement(updated.userId, updated.planCode, updated.id, status);
    this.logging.info('Shop Assistant billing callback processed', { context: 'BillingService.handlePaymentCallback', checkoutId: updated.id, orderId: updated.orderId, paymentId: updated.paymentId, status, nextStatus });
    return { success: true, checkout: updated, entitlementActivated: Boolean(entitlement), entitlement };
  }
  async listAdminBilling(limit = 50) { const take = Math.max(1, Math.min(100, limit)); const [checkouts, entitlements] = await Promise.all([this.prisma.billingCheckout.findMany({ orderBy: { createdAt: 'desc' }, take }), this.prisma.userEntitlement.findMany({ orderBy: { updatedAt: 'desc' }, take })]); return { checkouts, entitlements, plans: BILLING_PLANS }; }
  private checkoutPreview(orderId: string, plan: BillingPlan, paymentMethod: string) { return { orderId, planCode: plan.code, amountCents: plan.amountCents, currency: plan.currency, paymentMethod, applicationId: SHOP_ASSISTANT_APPLICATION_ID }; }
  private buildUrl(path: string): string { if (!this.publicBaseUrl) return ''; return `${this.publicBaseUrl}${path.startsWith('/') ? path : `/${path}`}`; }
  private assertCallbackAuthorized(headers: Record<string, string | string[] | undefined>) { if (!this.callbackToken) throw new ForbiddenException('Billing callback token is not configured'); const supplied = headers['x-shop-assistant-billing-token'] || headers['x-api-key']; const value = Array.isArray(supplied) ? supplied[0] : supplied; if (!value || value !== this.callbackToken) throw new ForbiddenException('Billing callback is not authorized'); }
  private async activateEntitlement(userId: string, planCode: string, checkoutId: string, providerStatus: string) { const now = new Date(); const expiresAt = new Date(now); expiresAt.setMonth(expiresAt.getMonth() + 1); const existing = await this.prisma.userEntitlement.findFirst({ where: { userId, checkoutId, status: 'active' } }); if (existing) return existing; return this.prisma.userEntitlement.create({ data: { userId, planCode, status: 'active', source: 'payments-microservice', checkoutId, startsAt: now, expiresAt, metadata: { providerStatus } as Prisma.InputJsonValue } }); }
}
