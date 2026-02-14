import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';
import { LoggingService } from '../logging/logging.service';

interface LeadContactMethod {
  type: string;
  value: string;
}

interface SubmitLeadPayload {
  sourceService: string;
  sourceUrl?: string;
  sourceLabel?: string;
  message: string;
  contactMethods: LeadContactMethod[];
  metadata?: Record<string, unknown>;
}

/** Payload for ai-microservice POST /api/process-submission (same shape as statex). */
interface AiSubmissionPayload {
  user_id: string;
  session_id?: string;
  submission_type: 'text' | 'voice' | 'file' | 'mixed';
  text_content?: string;
  voice_file_url?: string | null;
  file_urls?: string[];
  requirements?: string;
  contact_info: Record<string, unknown>;
}

@Injectable()
export class LeadsService {
  private readonly leadsServiceUrl: string;
  private readonly aiServiceUrl: string;
  private readonly aiTimeout: number;

  constructor(
    private readonly config: ConfigService,
    private readonly httpService: HttpService,
    private readonly logging: LoggingService,
  ) {
    this.leadsServiceUrl =
      this.config.get<string>('LEADS_SERVICE_URL') ||
      (process.env.DOMAIN ? `https://leads.${process.env.DOMAIN}` : 'http://leads-microservice:3371');
    this.aiServiceUrl = this.config.get<string>('AI_SERVICE_URL') || process.env.AI_SERVICE_URL || '';
    this.aiTimeout = Number(this.config.get<string>('AI_SERVICE_TIMEOUT')) || Number(process.env.AI_SERVICE_TIMEOUT) || 30000;
  }

  /**
   * Proxy lead submission to leads-microservice.
   */
  async submitLead(payload: SubmitLeadPayload): Promise<{ leadId: string; status: string; confirmationSent: boolean }> {
    const url = `${this.leadsServiceUrl.replace(/\/$/, '')}/api/leads/submit`;
    this.logging.info('Proxying lead to leads-microservice', {
      context: 'LeadsService',
      sourceService: payload.sourceService,
      contactMethodsCount: payload.contactMethods?.length || 0,
    });

    try {
      const response = await lastValueFrom(
        this.httpService.post(url, payload, {
          headers: {
            'Content-Type': 'application/json',
            'X-Service-Name': 'shop-assistant',
          },
          timeout: 15000,
        }),
      );
      return response.data;
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || String(err);
      const status = err?.response?.status;
      this.logging.error('Lead submission failed', {
        context: 'LeadsService',
        error: msg,
        status,
        sourceService: payload.sourceService,
      });
      throw new Error(`Failed to submit lead: ${msg}`);
    }
  }

  /**
   * Send lead data to ai-microservice for analysis (same flow as statex submission-service).
   * Does not throw; logs errors so main flow (save + leads-microservice) still succeeds.
   */
  async submitToAi(
    requestId: string,
    payload: SubmitLeadPayload,
  ): Promise<{ aiSubmissionId?: string; status?: string }> {
    if (!this.aiServiceUrl) {
      this.logging.warn('AI_SERVICE_URL not set, skipping AI analysis', { context: 'LeadsService', requestId });
      return {};
    }
    const hasVoice = (payload.metadata as { hasVoiceRecording?: boolean })?.hasVoiceRecording === true;
    const filesCount = (payload.metadata as { filesCount?: number })?.filesCount ?? 0;
    const submissionType: AiSubmissionPayload['submission_type'] =
      hasVoice || filesCount > 0 ? 'mixed' : 'text';
    const primaryContact = payload.contactMethods?.[0];
    const email = primaryContact?.type === 'email' ? primaryContact.value : '';
    const name = (payload.metadata as { name?: string })?.name ?? 'Unknown';
    const aiPayload: AiSubmissionPayload = {
      user_id: `shop-assistant-${requestId}`,
      session_id: requestId,
      submission_type: submissionType,
      text_content: payload.message || 'No message',
      voice_file_url: hasVoice ? undefined : null,
      file_urls: filesCount > 0 ? [] : undefined,
      requirements: `Contact form from shop-assistant (${payload.sourceLabel || 'contact-form'})`,
      contact_info: {
        name,
        email: email || 'unknown@shop-assistant',
        phone: payload.contactMethods?.find((c) => c.type === 'phone')?.value ?? null,
        source: 'shop-assistant',
        form_type: 'contact',
        timestamp: new Date().toISOString(),
      },
    };
    const url = `${this.aiServiceUrl.replace(/\/$/, '')}/api/process-submission`;
    this.logging.info('Sending lead to ai-microservice for analysis', {
      context: 'LeadsService',
      requestId,
      submissionType,
    });
    try {
      const response = await lastValueFrom(
        this.httpService.post(url, aiPayload, {
          headers: { 'Content-Type': 'application/json', 'X-Service-Name': 'shop-assistant' },
          timeout: this.aiTimeout,
        }),
      );
      const aiSubmissionId = response.data?.submission_id;
      const status = response.data?.status;
      this.logging.info('AI submission accepted', {
        context: 'LeadsService',
        requestId,
        aiSubmissionId,
        status,
      });
      return { aiSubmissionId, status };
    } catch (err) {
      const msg = err?.response?.data?.detail || err?.response?.data?.message || err?.message || String(err);
      this.logging.error('AI submission failed (lead still saved and sent to leads-microservice)', {
        context: 'LeadsService',
        requestId,
        error: msg,
      });
      return {};
    }
  }
}
