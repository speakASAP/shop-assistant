/**
 * Auth Controller
 * Proxies register and login to auth-microservice so the frontend can get JWT
 * without CORS and without exposing auth-microservice URL.
 */

import { Controller, Post, Body, BadRequestException, Req } from '@nestjs/common';
import { Request } from 'express';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { LoggingService } from '../logging/logging.service';

@Controller('auth')
export class AuthController {
  private readonly authServiceUrl: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly logging: LoggingService,
  ) {
    this.authServiceUrl = (process.env.AUTH_SERVICE_URL || '').replace(/\/$/, '');
  }

  @Post('register')
  async register(
    @Body()
    body: {
      email: string;
      password: string;
      firstName?: string;
      lastName?: string;
      phone?: string;
    },
  ) {
    if (!this.authServiceUrl) {
      this.logging.warn('AUTH_SERVICE_URL not set, cannot register', { context: 'AuthController.register' });
      throw new BadRequestException('Authentication service not configured');
    }
    if (!body?.email || !body?.password) {
      throw new BadRequestException('Email and password are required');
    }
    const url = `${this.authServiceUrl}/auth/register`;
    this.logging.info('Proxying register to auth-microservice', { email: body.email, context: 'AuthController.register' });
    try {
      const res = await firstValueFrom(
        this.httpService.post(url, body, {
          headers: { 'Content-Type': 'application/json' },
          timeout: Number(process.env.AUTH_SERVICE_TIMEOUT) || 10000,
        }),
      );
      return res.data;
    } catch (e: unknown) {
      const status = e && typeof e === 'object' && 'response' in e ? (e as { response?: { status?: number; data?: { message?: string } } }).response?.status : undefined;
      const message = e && typeof e === 'object' && 'response' in e ? (e as { response?: { data?: { message?: string } } }).response?.data?.message : undefined;
      this.logging.error('Register proxy failed', { status, message, context: 'AuthController.register' });
      if (status === 409) throw new BadRequestException(message || 'User with this email already exists');
      if (status === 400) throw new BadRequestException(message || 'Invalid request');
      throw new BadRequestException(message || 'Registration failed');
    }
  }

  @Post('login')
  async login(@Req() req: Request, @Body() body: { email?: string; password?: string }) {
    const email = typeof body?.email === 'string' ? body.email.trim() : '';
    const passwordRaw = typeof body?.password === 'string' ? body.password : '';
    const password = passwordRaw.replace(/^["']|["']$/g, '').trim();
    this.logging.info('LOGIN_REQUEST_RECEIVED', {
      path: req.path,
      url: req.url,
      method: req.method,
      hasEmail: !!email,
      passwordLength: password.length,
      context: 'AuthController.login',
    });
    if (!this.authServiceUrl) {
      this.logging.warn('LOGIN_FAIL_POINT: AUTH_SERVICE_URL not set', { context: 'AuthController.login' });
      throw new BadRequestException('Authentication service not configured');
    }
    if (!email || !password) {
      this.logging.warn('LOGIN_FAIL_POINT: missing email or password', { context: 'AuthController.login' });
      throw new BadRequestException('Email and password are required');
    }
    const payload = { email, password };
    const url = `${this.authServiceUrl}/auth/login`;
    this.logging.info('LOGIN_PROXY_START', { authServiceUrl: this.authServiceUrl, targetPath: '/auth/login', email, context: 'AuthController.login' });
    try {
      const res = await firstValueFrom(
        this.httpService.post(url, payload, {
          headers: { 'Content-Type': 'application/json' },
          timeout: Number(process.env.AUTH_SERVICE_TIMEOUT) || 10000,
        }),
      );
      this.logging.info('LOGIN_PROXY_SUCCESS', { status: res.status, email, context: 'AuthController.login' });
      return res.data;
    } catch (e: unknown) {
      const resp = e && typeof e === 'object' && 'response' in e ? (e as { response?: { status?: number; data?: unknown }; code?: string; message?: string }).response : undefined;
      const status = resp?.status;
      const data = resp?.data as { message?: string } | undefined;
      const message = data?.message;
      const errMsg = (e && typeof e === 'object' && 'message' in e) ? (e as { message?: string }).message : undefined;
      const errCode = (e && typeof e === 'object' && 'code' in e) ? (e as { code?: string }).code : undefined;
      this.logging.error('LOGIN_PROXY_FAILED', { status, message, data, email, context: 'AuthController.login' });
      console.error('[shop-assistant] LOGIN_PROXY_FAILED', { status, message, errCode, errMsg });
      if (status === 401) throw new BadRequestException(message || 'Invalid credentials');
      throw new BadRequestException(message || errMsg || 'Login failed');
    }
  }
}
