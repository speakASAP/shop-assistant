import {
  Controller,
  Post,
  Body,
  Req,
  UseInterceptors,
  UploadedFiles,
  BadRequestException,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { Request } from 'express';
import { LeadsService } from './leads.service';
import { LoggingService } from '../logging/logging.service';
import { PrismaService } from '../prisma/prisma.service';

// Max 30 items per request (leads-microservice constraint)
const MAX_FILES = 10;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB per file

const uploadDir = join(process.cwd(), 'data', 'uploads');
if (!existsSync(uploadDir)) {
  mkdirSync(uploadDir, { recursive: true });
}

const multerOptions = {
  limits: { fileSize: MAX_FILE_SIZE },
  storage: diskStorage({
    destination: uploadDir,
    filename: (req, file, cb) => {
      const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      const ext = extname(file.originalname) || '.bin';
      cb(null, `lead-${uniqueSuffix}${ext}`);
    },
  }),
};

interface ContactMethodDto {
  type: string;
  value: string;
}

interface MulterFile {
  fieldname: string;
  originalname: string;
  mimetype: string;
  size: number;
  path: string;
}

@Controller('leads')
export class LeadsController {
  constructor(
    private readonly leadsService: LeadsService,
    private readonly logging: LoggingService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Submit lead via JSON (simple text + contact).
   */
  @Post('submit')
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'voice_file', maxCount: 1 },
        { name: 'files', maxCount: MAX_FILES },
      ],
      multerOptions,
    ),
  )
  async submitLead(
    @Body() body: Record<string, unknown>,
    @UploadedFiles()
    files: { voice_file?: MulterFile[]; files?: MulterFile[] },
    @Req() req: Request,
  ) {
    const message = (body.message as string) || '';
    const name = (body.name as string) || '';
    const contactMethodsRaw = body.contactMethods;

    let contactMethods: ContactMethodDto[] = [];
    if (Array.isArray(contactMethodsRaw)) {
      contactMethods = contactMethodsRaw
        .filter((c: unknown) => c && typeof c === 'object' && 'type' in c && 'value' in c)
        .map((c: { type: string; value: string }) => ({ type: c.type, value: String(c.value).trim() }))
        .filter((c) => c.value);
    } else if (typeof contactMethodsRaw === 'string') {
      try {
        const parsed = JSON.parse(contactMethodsRaw) as ContactMethodDto[];
        if (Array.isArray(parsed)) {
          contactMethods = parsed
            .filter((c) => c?.type && c?.value)
            .map((c) => ({ type: c.type, value: String(c.value).trim() }))
            .filter((c) => c.value);
        }
      } catch {
        // fallback: parse from form fields contact_type_1, contact_value_1, ...
        const cm: ContactMethodDto[] = [];
        for (let i = 1; i <= 5; i++) {
          const t = body[`contact_type_${i}`] as string;
          const v = body[`contact_value_${i}`] as string;
          if (t && v && String(v).trim()) cm.push({ type: t, value: String(v).trim() });
        }
        contactMethods = cm;
      }
    }

    // Support form fields: contact_type, contact_value (single primary contact)
    if (contactMethods.length === 0) {
      const t = (body.contact_type as string) || 'email';
      const v = (body.contact_value as string) || '';
      if (v && String(v).trim()) contactMethods = [{ type: t, value: String(v).trim() }];
    }

    if (contactMethods.length === 0) {
      throw new BadRequestException('At least one contact method (email, phone, telegram, whatsapp) is required');
    }

    let finalMessage = message;
    const voiceFiles = files?.voice_file || [];
    const docFiles = files?.files || [];
    if (voiceFiles.length > 0) {
      finalMessage += `\n\n[Voice recording included]`;
    }
    if (docFiles.length > 0) {
      finalMessage += `\n\n[${docFiles.length} file(s) attached]`;
    }

    const sourceUrl = (req.headers['x-forwarded-proto'] === 'https' ? 'https' : 'http') + '://' +
      (req.headers['x-forwarded-host'] || req.headers.host || '') + (req.url || '');

    const payload = {
      sourceService: 'shop-assistant',
      sourceUrl,
      sourceLabel: 'contact-form',
      message: finalMessage.trim(),
      contactMethods,
      metadata: {
        name: name || undefined,
        page: sourceUrl,
        locale: 'en',
        pageType: 'contact',
        hasVoiceRecording: voiceFiles.length > 0,
        filesCount: docFiles.length,
      },
    };

    // 1) Save on server first (same as statex: all requests saved locally)
    const leadRequest = await this.prisma.leadRequest.create({
      data: {
        sourceService: payload.sourceService,
        sourceUrl: payload.sourceUrl,
        sourceLabel: payload.sourceLabel,
        message: payload.message,
        contactMethods: payload.contactMethods as object,
        metadata: payload.metadata as object,
      },
    });
    const requestId = leadRequest.id;
    this.logging.info('Lead request saved on server', { context: 'LeadsController', requestId });

    // 2) Send to leads-microservice (CRM/notifications)
    const result = await this.leadsService.submitLead(payload);
    this.logging.info('Lead submitted to leads-microservice', { context: 'LeadsController', leadId: result.leadId });

    // 3) Send to ai-microservice for analysis (same as statex)
    const aiResult = await this.leadsService.submitToAi(requestId, payload);

    // 4) Update saved request with leadId and aiSubmissionId
    await this.prisma.leadRequest.update({
      where: { id: requestId },
      data: {
        leadId: result.leadId,
        aiSubmissionId: aiResult.aiSubmissionId ?? undefined,
      },
    });

    return {
      ...result,
      requestId,
      aiSubmissionId: aiResult.aiSubmissionId,
    };
  }
}
