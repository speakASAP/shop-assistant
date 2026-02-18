/**
 * Auth Controller
 * Proxies register and login to auth-microservice so the frontend can get JWT
 * without CORS and without exposing auth-microservice URL.
 */

import { Controller, Post, Body, BadRequestException } from '@nestjs/common';
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
  async login(@Body() body: { email: string; password: string }) {
    if (!this.authServiceUrl) {
      this.logging.warn('AUTH_SERVICE_URL not set, cannot login', { context: 'AuthController.login' });
      throw new BadRequestException('Authentication service not configured');
    }
    if (!body?.email || !body?.password) {
      throw new BadRequestException('Email and password are required');
    }
    const url = `${this.authServiceUrl}/auth/login`;
    this.logging.info('Proxying login to auth-microservice', { email: body.email, context: 'AuthController.login' });
    try {
      const res = await firstValueFrom(
        this.httpService.post(url, body, {
          headers: { 'Content-Type': 'application/json' },
          timeout: Number(process.env.AUTH_SERVICE_TIMEOUT) || 10000,
        }),
      );
      return res.data;
    } catch (e: unknown) {
      const status = e && typeof e === 'object' && 'response' in e ? (e as { response?: { status?: number } }).response?.status : undefined;
      const message = e && typeof e === 'object' && 'response' in e ? (e as { response?: { data?: { message?: string } } }).response?.data?.message : undefined;
      this.logging.error('Login proxy failed', { status, context: 'AuthController.login' });
      if (status === 401) throw new BadRequestException(message || 'Invalid credentials');
      throw new BadRequestException(message || 'Login failed');
    }
  }
}
