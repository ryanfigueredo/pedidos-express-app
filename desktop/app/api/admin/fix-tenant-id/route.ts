import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * Rota para aplicar a migração tenant_id diretamente via SQL
 * Esta rota executa o SQL diretamente no banco de dados
 */
export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Aplicando migração tenant_id diretamente no banco...')

    // SQL para adicionar coluna tenant_id (idempotente)
    const addColumnSQL = `
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
          END IF;
      END $$;
    `

    // SQL para adicionar índice
    const addIndexSQL = `
      DO $$ 
      BEGIN
          IF NOT EXISTS (
              SELECT 1 FROM pg_indexes 
              WHERE schemaname = 'public'
              AND indexname = 'users_tenant_id_idx'
          ) THEN
              CREATE INDEX "users_tenant_id_idx" ON "users"("tenant_id");
          END IF;
      END $$;
    `

    // SQL para adicionar foreign key (apenas se tabela tenants existir)
    const addForeignKeySQL = `
      DO $$ 
      BEGIN
          -- Verificar se tabela tenants existe
          IF EXISTS (
              SELECT 1 
              FROM information_schema.tables 
              WHERE table_schema = 'public'
              AND table_name = 'tenants'
          ) THEN
              -- Verificar se constraint já existe
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
              END IF;
          END IF;
      END $$;
    `

    // SQL para adicionar unique constraint
    const addUniqueIndexSQL = `
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
          END IF;
      END $$;
    `

    // Executar todas as queries
    await prisma.$executeRawUnsafe(addColumnSQL)
    console.log('✅ Coluna tenant_id verificada/criada')

    await prisma.$executeRawUnsafe(addIndexSQL)
    console.log('✅ Índice users_tenant_id_idx verificado/criado')

    await prisma.$executeRawUnsafe(addForeignKeySQL)
    console.log('✅ Foreign key users_tenant_id_fkey verificada/criada')

    await prisma.$executeRawUnsafe(addUniqueIndexSQL)
    console.log('✅ Unique index users_tenant_id_username_key verificado/criado')

    // Verificar se a coluna existe agora
    const checkColumn = await prisma.$queryRawUnsafe<Array<{ column_name: string }>>(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_schema = 'public'
      AND table_name = 'users' 
      AND column_name = 'tenant_id'
    `)

    if (checkColumn.length === 0) {
      throw new Error('Coluna tenant_id não foi criada')
    }

    return NextResponse.json({
      success: true,
      message: 'Migração tenant_id aplicada com sucesso!',
      columnExists: checkColumn.length > 0,
    })
  } catch (error: any) {
    console.error('❌ Erro ao aplicar migração:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Erro ao aplicar migração',
        details: error.stack,
      },
      { status: 500 }
    )
  }
}
