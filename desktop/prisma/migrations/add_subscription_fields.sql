-- Migration: Adicionar campos de assinatura ao modelo Tenant
-- Execute este SQL manualmente no banco de dados ou via Prisma migrate

ALTER TABLE "tenants" 
ADD COLUMN IF NOT EXISTS "subscription_payment_date" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "subscription_expires_at" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "asaas_subscription_id" TEXT,
ADD COLUMN IF NOT EXISTS "asaas_customer_id" TEXT,
ADD COLUMN IF NOT EXISTS "subscription_status" TEXT DEFAULT 'active';

-- Comentários para documentação
COMMENT ON COLUMN "tenants"."subscription_payment_date" IS 'Data do último pagamento da assinatura';
COMMENT ON COLUMN "tenants"."subscription_expires_at" IS 'Data de vencimento da assinatura';
COMMENT ON COLUMN "tenants"."asaas_subscription_id" IS 'ID da assinatura no sistema Asaas';
COMMENT ON COLUMN "tenants"."asaas_customer_id" IS 'ID do cliente no sistema Asaas';
COMMENT ON COLUMN "tenants"."subscription_status" IS 'Status da assinatura: active, expired, cancelled, pending';
