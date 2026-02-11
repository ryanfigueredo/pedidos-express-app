-- AlterTable
ALTER TABLE "tenants" 
ADD COLUMN IF NOT EXISTS "subscription_payment_date" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "subscription_expires_at" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "asaas_subscription_id" TEXT,
ADD COLUMN IF NOT EXISTS "asaas_customer_id" TEXT,
ADD COLUMN IF NOT EXISTS "subscription_status" TEXT DEFAULT 'active';
