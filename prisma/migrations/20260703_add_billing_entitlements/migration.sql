-- SA-G8-B2: Shop Assistant billing checkout and entitlement persistence.
CREATE TABLE "BillingCheckout" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "planCode" VARCHAR(64) NOT NULL,
    "orderId" VARCHAR(128) NOT NULL,
    "paymentId" VARCHAR(255),
    "status" VARCHAR(32) NOT NULL DEFAULT 'pending',
    "providerStatus" VARCHAR(64),
    "amountCents" INTEGER NOT NULL,
    "currency" VARCHAR(8) NOT NULL,
    "paymentMethod" VARCHAR(64),
    "redirectUrl" TEXT,
    "expiresAt" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "BillingCheckout_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "UserEntitlement" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "planCode" VARCHAR(64) NOT NULL,
    "status" VARCHAR(32) NOT NULL DEFAULT 'active',
    "source" VARCHAR(64) NOT NULL,
    "checkoutId" VARCHAR(255),
    "startsAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "UserEntitlement_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "BillingCheckout_orderId_key" ON "BillingCheckout"("orderId");
CREATE UNIQUE INDEX "BillingCheckout_paymentId_key" ON "BillingCheckout"("paymentId");
CREATE INDEX "BillingCheckout_userId_idx" ON "BillingCheckout"("userId");
CREATE INDEX "BillingCheckout_status_idx" ON "BillingCheckout"("status");
CREATE INDEX "BillingCheckout_planCode_idx" ON "BillingCheckout"("planCode");
CREATE INDEX "UserEntitlement_userId_idx" ON "UserEntitlement"("userId");
CREATE INDEX "UserEntitlement_status_idx" ON "UserEntitlement"("status");
CREATE INDEX "UserEntitlement_expiresAt_idx" ON "UserEntitlement"("expiresAt");
CREATE INDEX "UserEntitlement_checkoutId_idx" ON "UserEntitlement"("checkoutId");
