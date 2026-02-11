-- Migration: Adicionar tracking detalhado de mensagens WhatsApp por categoria

-- Adicionar campos de categoria ao MessageUsage
ALTER TABLE "message_usage" 
ADD COLUMN IF NOT EXISTS "messages_service" INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS "messages_utility" INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS "messages_marketing" INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS "messages_auth" INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS "total_cost_brl" DECIMAL(10, 4) DEFAULT 0;

-- Criar tabela WhatsAppMessage para rastreamento detalhado
CREATE TABLE IF NOT EXISTS "whatsapp_messages" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "to_phone" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "cost_usd" DECIMAL(10, 6) DEFAULT 0,
    "cost_brl" DECIMAL(10, 4) DEFAULT 0,
    "message_type" TEXT,
    "template_name" TEXT,
    "within_24h_window" BOOLEAN DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "whatsapp_messages_pkey" PRIMARY KEY ("id")
);

-- Criar índices
CREATE INDEX IF NOT EXISTS "whatsapp_messages_tenant_id_idx" ON "whatsapp_messages"("tenant_id");
CREATE INDEX IF NOT EXISTS "whatsapp_messages_tenant_id_created_at_idx" ON "whatsapp_messages"("tenant_id", "created_at");
CREATE INDEX IF NOT EXISTS "whatsapp_messages_tenant_id_category_idx" ON "whatsapp_messages"("tenant_id", "category");
CREATE INDEX IF NOT EXISTS "whatsapp_messages_tenant_id_category_created_at_idx" ON "whatsapp_messages"("tenant_id", "category", "created_at");

-- Adicionar foreign key
ALTER TABLE "whatsapp_messages" ADD CONSTRAINT "whatsapp_messages_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Comentários para documentação
COMMENT ON COLUMN "message_usage"."messages_service" IS 'Mensagens de Serviço (gratuitas dentro de 24h)';
COMMENT ON COLUMN "message_usage"."messages_utility" IS 'Mensagens de Utilidade ($0.0085 USD)';
COMMENT ON COLUMN "message_usage"."messages_marketing" IS 'Mensagens de Marketing ($0.0782 USD)';
COMMENT ON COLUMN "message_usage"."messages_auth" IS 'Mensagens de Autenticação ($0.0085 USD)';
COMMENT ON COLUMN "message_usage"."total_cost_brl" IS 'Custo total em BRL do mês';
COMMENT ON COLUMN "whatsapp_messages"."category" IS 'SERVICE, UTILITY, MARKETING, AUTHENTICATION';
COMMENT ON COLUMN "whatsapp_messages"."within_24h_window" IS 'Se estava dentro da janela de 24h (gratuito)';
