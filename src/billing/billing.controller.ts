import { Body, Controller, Get, Headers, Post, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { BillingService } from './billing.service';
@Controller('billing')
export class BillingController {
  constructor(private readonly billing: BillingService) {}
  @Get('plans') async plans() { return this.billing.listPlans(); }
  @Get('entitlement') @UseGuards(JwtAuthGuard) async entitlement(@Req() req: any) { return this.billing.getEntitlement(req.user.id as string); }
  @Post('checkouts') @UseGuards(JwtAuthGuard) async createCheckout(@Req() req: any, @Body() body: { planCode?: string; paymentMethod?: string }) { return this.billing.createCheckout(req.user, body || {}); }
  @Post('payments/callback') async paymentCallback(@Headers() headers: Record<string, string | string[] | undefined>, @Body() body: any) { return this.billing.handlePaymentCallback(headers, body); }
}
@Controller('admin/billing')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('global:superadmin', 'app:shop-assistant:admin')
export class BillingAdminController {
  constructor(private readonly billing: BillingService) {}
  @Get() async list(@Query('limit') limit?: string) { return this.billing.listAdminBilling(parseInt(String(limit), 10) || 50); }
}
