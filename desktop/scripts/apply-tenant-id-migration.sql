-- Script SQL para adicionar coluna tenant_id à tabela users
-- Execute este script diretamente no banco de produção se a migração não for aplicada automaticamente

-- Adicionar coluna tenant_id à tabela users (se não existir)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public'
        AND table_name = 'users' 
        AND column_name = 'tenant_id'
    ) THEN
        ALTER TABLE "users" ADD COLUMN "tenant_id" TEXT;
        RAISE NOTICE 'Coluna tenant_id adicionada à tabela users';
    ELSE
        RAISE NOTICE 'Coluna tenant_id já existe na tabela users';
    END IF;
END $$;

-- Adicionar índice se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE schemaname = 'public'
        AND indexname = 'users_tenant_id_idx'
    ) THEN
        CREATE INDEX "users_tenant_id_idx" ON "users"("tenant_id");
        RAISE NOTICE 'Índice users_tenant_id_idx criado';
    ELSE
        RAISE NOTICE 'Índice users_tenant_id_idx já existe';
    END IF;
END $$;

-- Adicionar foreign key se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE constraint_schema = 'public'
        AND constraint_name = 'users_tenant_id_fkey'
    ) THEN
        ALTER TABLE "users" 
        ADD CONSTRAINT "users_tenant_id_fkey" 
        FOREIGN KEY ("tenant_id") 
        REFERENCES "tenants"("id") 
        ON DELETE CASCADE 
        ON UPDATE CASCADE;
        RAISE NOTICE 'Foreign key users_tenant_id_fkey criada';
    ELSE
        RAISE NOTICE 'Foreign key users_tenant_id_fkey já existe';
    END IF;
END $$;

-- Adicionar unique constraint se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_indexes 
        WHERE schemaname = 'public'
        AND indexname = 'users_tenant_id_username_key'
    ) THEN
        CREATE UNIQUE INDEX "users_tenant_id_username_key" 
        ON "users"("tenant_id", "username");
        RAISE NOTICE 'Unique index users_tenant_id_username_key criado';
    ELSE
        RAISE NOTICE 'Unique index users_tenant_id_username_key já existe';
    END IF;
END $$;

SELECT 'Migração aplicada com sucesso!' as resultado;
