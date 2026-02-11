-- Migration: Adicionar suporte a múltiplos tipos de negócios e agendamentos
-- Data: 2026-02-05

-- Criar enum BusinessType se não existir
DO $$ BEGIN
    CREATE TYPE "BusinessType" AS ENUM ('RESTAURANTE', 'DENTISTA');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Adicionar business_type e show_prices_on_bot na tabela tenants
ALTER TABLE "tenants" 
ADD COLUMN IF NOT EXISTS "business_type" "BusinessType" NOT NULL DEFAULT 'RESTAURANTE',
ADD COLUMN IF NOT EXISTS "show_prices_on_bot" BOOLEAN NOT NULL DEFAULT true;

-- Adicionar campos de agendamento na tabela orders
ALTER TABLE "orders"
ADD COLUMN IF NOT EXISTS "appointment_date" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "appointment_type" TEXT,
ADD COLUMN IF NOT EXISTS "doctor_notes" TEXT,
ADD COLUMN IF NOT EXISTS "patient_notes" TEXT;

-- Criar índice para busca por data de agendamento (útil para dentistas)
CREATE INDEX IF NOT EXISTS "orders_appointment_date_idx" ON "orders"("tenant_id", "appointment_date");

-- Comentários para documentação
COMMENT ON COLUMN "tenants"."business_type" IS 'Tipo de negócio: RESTAURANTE ou DENTISTA';
COMMENT ON COLUMN "tenants"."show_prices_on_bot" IS 'Se deve exibir preços no bot WhatsApp (false para dentistas que preferem não mostrar valores)';
COMMENT ON COLUMN "orders"."appointment_date" IS 'Data e hora do agendamento (para dentistas)';
COMMENT ON COLUMN "orders"."appointment_type" IS 'Tipo de agendamento: consulta, limpeza, canal, extracao, retorno, etc';
COMMENT ON COLUMN "orders"."doctor_notes" IS 'Observações do dentista sobre o agendamento';
COMMENT ON COLUMN "orders"."patient_notes" IS 'Observações do paciente sobre o agendamento';
