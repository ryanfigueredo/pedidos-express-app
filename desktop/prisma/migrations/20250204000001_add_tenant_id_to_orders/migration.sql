-- Adicionar coluna tenant_id à tabela orders (se não existir)
-- Necessário quando o banco foi criado antes dessa coluna

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public'
        AND table_name = 'orders' 
        AND column_name = 'tenant_id'
    ) THEN
        -- Adicionar como nullable primeiro (para permitir backfill)
        ALTER TABLE "orders" ADD COLUMN "tenant_id" TEXT;
        
        -- Preencher com o primeiro tenant existente (para pedidos antigos)
        UPDATE "orders" o
        SET tenant_id = (SELECT t.id FROM "tenants" t LIMIT 1)
        WHERE o.tenant_id IS NULL;
        
        -- Tornar NOT NULL somente se não houver NULLs restantes
        IF NOT EXISTS (SELECT 1 FROM "orders" WHERE tenant_id IS NULL) THEN
            ALTER TABLE "orders" ALTER COLUMN "tenant_id" SET NOT NULL;
        END IF;
        
        -- Criar índice
        IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'orders_tenant_id_idx') THEN
            CREATE INDEX "orders_tenant_id_idx" ON "orders"("tenant_id");
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'orders_tenant_id_created_at_idx') THEN
            CREATE INDEX "orders_tenant_id_created_at_idx" ON "orders"("tenant_id", "created_at");
        END IF;
        
        -- Foreign key
        IF NOT EXISTS (
            SELECT 1 FROM pg_constraint WHERE conname = 'orders_tenant_id_fkey'
        ) THEN
            ALTER TABLE "orders" 
            ADD CONSTRAINT "orders_tenant_id_fkey" 
            FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") 
            ON DELETE CASCADE ON UPDATE CASCADE;
        END IF;
    END IF;
END $$;
