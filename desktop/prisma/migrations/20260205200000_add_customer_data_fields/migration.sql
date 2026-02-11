-- Migration: Adicionar campos de dados do cliente ao Tenant
-- Para uso com integração Asaas (CPF/CNPJ obrigatório)

ALTER TABLE "tenants" 
ADD COLUMN IF NOT EXISTS "customer_cpf_cnpj" TEXT,
ADD COLUMN IF NOT EXISTS "customer_phone" TEXT,
ADD COLUMN IF NOT EXISTS "customer_postal_code" TEXT,
ADD COLUMN IF NOT EXISTS "customer_address" TEXT,
ADD COLUMN IF NOT EXISTS "customer_address_number" TEXT,
ADD COLUMN IF NOT EXISTS "customer_address_complement" TEXT,
ADD COLUMN IF NOT EXISTS "customer_province" TEXT,
ADD COLUMN IF NOT EXISTS "customer_city" TEXT,
ADD COLUMN IF NOT EXISTS "customer_state" TEXT;

-- Comentários para documentação
COMMENT ON COLUMN "tenants"."customer_cpf_cnpj" IS 'CPF ou CNPJ do cliente (obrigatório para pagamentos Asaas)';
COMMENT ON COLUMN "tenants"."customer_phone" IS 'Telefone do cliente (formato: 5521999999999)';
COMMENT ON COLUMN "tenants"."customer_postal_code" IS 'CEP do cliente';
COMMENT ON COLUMN "tenants"."customer_address" IS 'Endereço completo do cliente';
COMMENT ON COLUMN "tenants"."customer_address_number" IS 'Número do endereço';
COMMENT ON COLUMN "tenants"."customer_address_complement" IS 'Complemento do endereço';
COMMENT ON COLUMN "tenants"."customer_province" IS 'Bairro';
COMMENT ON COLUMN "tenants"."customer_city" IS 'Cidade';
COMMENT ON COLUMN "tenants"."customer_state" IS 'Estado (UF)';
