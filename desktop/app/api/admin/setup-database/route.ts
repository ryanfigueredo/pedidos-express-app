import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'

/**
 * Rota para configurar o banco de dados completo
 * Cria todas as tabelas e dados iniciais necessários
 */
export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Configurando banco de dados completo...')

    // 1. Verificar/criar tabela tenants
    console.log('📦 Verificando tabela tenants...')
    const tenantsTableExists = await prisma.$queryRawUnsafe<Array<{ table_name: string }>>(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'tenants'
      LIMIT 1
    `)

    if (tenantsTableExists.length === 0) {
      console.log('⚠️  Tabela tenants não existe, criando...')
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "tenants" (
          "id" TEXT NOT NULL,
          "name" TEXT NOT NULL,
          "slug" TEXT NOT NULL,
          "api_key" TEXT NOT NULL,
          "whatsapp_phone" TEXT,
          "is_active" BOOLEAN NOT NULL DEFAULT true,
          "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updated_at" TIMESTAMP(3) NOT NULL,
          CONSTRAINT "tenants_pkey" PRIMARY KEY ("id")
        )
      `)
      await prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "tenants_slug_key" ON "tenants"("slug")`)
      await prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "tenants_api_key_key" ON "tenants"("api_key")`)
      console.log('✅ Tabela tenants criada')
    } else {
      console.log('✅ Tabela tenants já existe')
    }

    // 2. Verificar/criar tabela users
    console.log('📦 Verificando tabela users...')
    const usersTableExists = await prisma.$queryRawUnsafe<Array<{ table_name: string }>>(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'users'
      LIMIT 1
    `)

    if (usersTableExists.length === 0) {
      console.log('⚠️  Tabela users não existe, criando...')
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "users" (
          "id" TEXT NOT NULL,
          "username" TEXT NOT NULL,
          "password" TEXT NOT NULL,
          "name" TEXT NOT NULL,
          "role" TEXT NOT NULL,
          "tenant_id" TEXT,
          "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updated_at" TIMESTAMP(3) NOT NULL,
          CONSTRAINT "users_pkey" PRIMARY KEY ("id")
        )
      `)
      await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "users_tenant_id_idx" ON "users"("tenant_id")`)
      console.log('✅ Tabela users criada')
    } else {
      console.log('✅ Tabela users já existe')
      
      // Verificar se coluna tenant_id existe
      const tenantIdColumn = await prisma.$queryRawUnsafe<Array<{ column_name: string }>>(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_schema = 'public'
        AND table_name = 'users' 
        AND column_name = 'tenant_id'
        LIMIT 1
      `)
      
      if (tenantIdColumn.length === 0) {
        console.log('⚠️  Adicionando coluna tenant_id...')
        await prisma.$executeRawUnsafe(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "tenant_id" TEXT`)
        await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "users_tenant_id_idx" ON "users"("tenant_id")`)
        console.log('✅ Coluna tenant_id adicionada')
      }
    }

    // 2.5. Verificar/criar tabela orders
    console.log('📦 Verificando tabela orders...')
    const ordersTableExists = await prisma.$queryRawUnsafe<Array<{ table_name: string }>>(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'orders'
      LIMIT 1
    `)

    if (ordersTableExists.length === 0) {
      console.log('⚠️  Tabela orders não existe, criando...')
      
      // Criar enum OrderStatus
      await prisma.$executeRawUnsafe(`
        DO $$ BEGIN
          CREATE TYPE "OrderStatus" AS ENUM ('pending', 'printed', 'finished', 'out_for_delivery');
        EXCEPTION
          WHEN duplicate_object THEN null;
        END $$;
      `)
      
      // Criar tabela orders
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "orders" (
          "id" TEXT NOT NULL,
          "tenant_id" TEXT NOT NULL,
          "customer_name" TEXT NOT NULL,
          "customer_phone" TEXT NOT NULL,
          "items" JSONB NOT NULL,
          "total_price" DECIMAL(10,2) NOT NULL,
          "status" "OrderStatus" NOT NULL DEFAULT 'pending',
          "payment_method" TEXT,
          "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "order_number" INTEGER,
          "daily_sequence" INTEGER,
          "display_id" TEXT,
          "customer_total_orders" INTEGER,
          "order_type" TEXT,
          "estimated_time" INTEGER,
          "delivery_address" TEXT,
          CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
        )
      `)
      
      await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "orders_tenant_id_idx" ON "orders"("tenant_id")`)
      await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "orders_tenant_id_created_at_idx" ON "orders"("tenant_id", "created_at")`)
      
      // Adicionar foreign key se tabela tenants existir
      const tenantsExists = await prisma.$queryRawUnsafe<Array<{ table_name: string }>>(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'tenants'
        LIMIT 1
      `)
      
      if (tenantsExists.length > 0) {
        await prisma.$executeRawUnsafe(`
          DO $$ BEGIN
            ALTER TABLE "orders" 
            ADD CONSTRAINT "orders_tenant_id_fkey" 
            FOREIGN KEY ("tenant_id") 
            REFERENCES "tenants"("id") 
            ON DELETE CASCADE 
            ON UPDATE CASCADE;
          EXCEPTION
            WHEN duplicate_object THEN null;
          END $$;
        `)
      }
      
      console.log('✅ Tabela orders criada')
    } else {
      console.log('✅ Tabela orders já existe')
    }

    // 3. Criar tenant Tamboril Burguer
    console.log('📦 Criando tenant Tamboril Burguer...')
    const existingTenant = await prisma.$queryRawUnsafe<Array<{ id: string }>>(`
      SELECT id FROM tenants WHERE slug = 'tamboril-burguer' LIMIT 1
    `)

    let tenantId: string
    if (existingTenant.length > 0) {
      tenantId = existingTenant[0].id
      console.log('✅ Tenant já existe:', tenantId)
    } else {
      const newTenantId = crypto.randomUUID()
      await prisma.$executeRawUnsafe(`
        INSERT INTO tenants (id, name, slug, api_key, is_active, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
        ON CONFLICT (slug) DO NOTHING
      `, newTenantId, 'Tamboril Burguer', 'tamboril-burguer', 'tamboril-burguer-api-key-2024-secure', true)
      
      const created = await prisma.$queryRawUnsafe<Array<{ id: string }>>(`
        SELECT id FROM tenants WHERE slug = 'tamboril-burguer' LIMIT 1
      `)
      tenantId = created[0]?.id || newTenantId
      console.log('✅ Tenant criado:', tenantId)
    }

    // 4. Criar usuário admin@tamboril.com
    console.log('👤 Criando usuário admin@tamboril.com...')
    const hashedPassword = await bcrypt.hash('123456', 10)
    
    const existingUser = await prisma.$queryRawUnsafe<Array<{ id: string }>>(`
      SELECT id FROM users WHERE username = 'admin@tamboril.com' AND tenant_id = $1 LIMIT 1
    `, tenantId)

    if (existingUser.length > 0) {
      console.log('⚠️  Usuário já existe, atualizando senha...')
      await prisma.$executeRawUnsafe(`
        UPDATE users 
        SET password = $1, updated_at = NOW()
        WHERE id = $2
      `, hashedPassword, existingUser[0].id)
      console.log('✅ Senha atualizada')
    } else {
      const userId = crypto.randomUUID()
      await prisma.$executeRawUnsafe(`
        INSERT INTO users (id, username, password, name, role, tenant_id, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
      `, userId, 'admin@tamboril.com', hashedPassword, 'Admin Tamboril', 'admin', tenantId)
      console.log('✅ Usuário criado:', userId)
    }

    // 5. Verificar login
    console.log('🧪 Testando login...')
    const testUser = await prisma.$queryRawUnsafe<Array<{
      id: string
      username: string
      password: string
      name: string
      role: string
      tenant_id: string | null
    }>>(`
      SELECT id, username, password, name, role, tenant_id
      FROM users 
      WHERE username = 'admin@tamboril.com' AND tenant_id = $1
      LIMIT 1
    `, tenantId)

    if (testUser.length === 0) {
      throw new Error('Usuário não foi criado corretamente')
    }

    const passwordValid = await bcrypt.compare('123456', testUser[0].password)
    if (!passwordValid) {
      throw new Error('Senha não confere após criação')
    }

    return NextResponse.json({
      success: true,
      message: 'Banco de dados configurado com sucesso!',
      tenant: {
        id: tenantId,
        slug: 'tamboril-burguer',
      },
      user: {
        id: testUser[0].id,
        username: testUser[0].username,
        name: testUser[0].name,
        role: testUser[0].role,
      },
    })
  } catch (error: any) {
    console.error('❌ Erro ao configurar banco:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Erro ao configurar banco de dados',
        details: error.stack,
      },
      { status: 500 }
    )
  }
}
