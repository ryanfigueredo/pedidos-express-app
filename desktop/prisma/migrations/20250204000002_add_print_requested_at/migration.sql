-- Adicionar coluna print_requested_at à tabela orders (opcional, para fluxo de impressão)
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "print_requested_at" TIMESTAMP(3);
