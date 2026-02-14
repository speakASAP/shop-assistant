import { Controller, Get, Res } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Response } from 'express';
import { readFileSync } from 'fs';
import { join } from 'path';
import { LoggingService } from '../logging/logging.service';

/**
 * Legal pages with runtime substitution from .env (company, contact).
 * Serves privacy.html, cookies.html, terms.html with {{VAR}} placeholders replaced.
 */
@Controller()
export class LegalController {
  private readonly publicPath: string;

  constructor(
    private readonly config: ConfigService,
    private readonly logging: LoggingService,
  ) {
    this.publicPath = join(__dirname, '..', 'public');
  }

  private getReplacements(): Record<string, string> {
    return {
      COMPANY_LEGAL_NAME: this.config.get<string>('COMPANY_LEGAL_NAME') || 'Alfares s.r.o.',
      COMPANY_ICO: this.config.get<string>('COMPANY_ICO') || '27138038',
      COMPANY_DIC: this.config.get<string>('COMPANY_DIC') || 'CZ27138038',
      COMPANY_ADDRESS: this.config.get<string>('COMPANY_ADDRESS') ||
        'Cetechovice 70, Cetechovice, 768 02, Czech Republic',
      COMPANY_PHONE: this.config.get<string>('COMPANY_PHONE') || '+420 774 287 541',
      LEGAL_EMAIL: this.config.get<string>('LEGAL_EMAIL') || 'ssfskype@gmail.com',
      PRIVACY_EMAIL: this.config.get<string>('PRIVACY_EMAIL') || 'ssfskype@gmail.com',
      DPO_EMAIL: this.config.get<string>('DPO_EMAIL') || 'ssfskype@gmail.com',
      LEGAL_JURISDICTION: this.config.get<string>('LEGAL_JURISDICTION') || 'Czech Republic',
    };
  }

  private substitute(template: string): string {
    const reps = this.getReplacements();
    return Object.entries(reps).reduce(
      (acc, [key, val]) => acc.replace(new RegExp(`{{${key}}}`, 'g'), val),
      template,
    );
  }

  private serve(res: Response, filename: string): void {
    try {
      const path = join(this.publicPath, filename);
      const html = readFileSync(path, 'utf-8');
      const rendered = this.substitute(html);
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.send(rendered);
      this.logging.info('Legal page served', {
        context: 'LegalController',
        filename,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logging.error('Legal page serve failed', {
        context: 'LegalController',
        filename,
        error: msg,
      });
      res.status(404).send('Not found');
    }
  }

  @Get('privacy.html')
  privacy(@Res() res: Response): void {
    this.serve(res, 'privacy.html');
  }

  @Get('cookies.html')
  cookies(@Res() res: Response): void {
    this.serve(res, 'cookies.html');
  }

  @Get('terms.html')
  terms(@Res() res: Response): void {
    this.serve(res, 'terms.html');
  }
}
