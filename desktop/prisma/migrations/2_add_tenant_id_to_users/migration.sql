-- Adicionar coluna tenant_id à tabela users (se não existir)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'tenant_id'
    ) THEN
        ALTER TABLE "users" ADD COLUMN "tenant_id" TEXT;
        
        -- Adicionar índice se não existir
        IF NOT EXISTS (
            SELECT 1 FROM pg_indexes WHERE indexname = 'users_tenant_id_idx'
        ) THEN
            CREATE INDEX "users_tenant_id_idx" ON "users"("tenant_id");
        END IF;
        
        -- Adicionar foreign key se não existir
        IF NOT EXISTS (
            SELECT 1 
            FROM information_schema.table_constraints 
            WHERE constraint_name = 'users_tenant_id_fkey'
        ) THEN
            ALTER TABLE "users" 
            ADD CONSTRAINT "users_tenant_id_fkey" 
            FOREIGN KEY ("tenant_id") 
            REFERENCES "tenants"("id") 
            ON DELETE CASCADE 
            ON UPDATE CASCADE;
        END IF;
        
        -- Adicionar unique constraint se não existir
        IF NOT EXISTS (
            SELECT 1 
            FROM pg_indexes 
            WHERE indexname = 'users_tenant_id_username_key'
        ) THEN
            CREATE UNIQUE INDEX "users_tenant_id_username_key" 
            ON "users"("tenant_id", "username");
        END IF;
    END IF;
END $$;
