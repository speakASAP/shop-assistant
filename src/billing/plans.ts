export interface BillingPlan {
  code: string;
  name: string;
  amountCents: number;
  currency: string;
  billingPeriod: 'month';
  searchLimitMonthly: number;
  savedSearchLimit: number;
  profileLimit: number;
  allowedPaymentMethods: string[];
}
export const SHOP_ASSISTANT_APPLICATION_ID = 'shop-assistant';
export const BILLING_PLANS: BillingPlan[] = [
  { code: 'shop-assistant-pro-monthly', name: 'Shop Assistant Pro', amountCents: 1900, currency: 'EUR', billingPeriod: 'month', searchLimitMonthly: 200, savedSearchLimit: 50, profileLimit: 10, allowedPaymentMethods: ['card', 'stripe', 'invoice'] },
  { code: 'shop-assistant-business-monthly', name: 'Shop Assistant Business', amountCents: 5900, currency: 'EUR', billingPeriod: 'month', searchLimitMonthly: 1000, savedSearchLimit: 250, profileLimit: 50, allowedPaymentMethods: ['card', 'stripe', 'invoice'] },
];
export function getBillingPlan(code: string): BillingPlan | undefined { return BILLING_PLANS.find((plan) => plan.code === code); }
