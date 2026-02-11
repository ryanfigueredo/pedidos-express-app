/**
 * Script para criar o tenant inicial (Tamboril Burguer)
 * Execute: npx tsx scripts/create-initial-tenant.ts
 */

import { PrismaClient } from '@prisma/client'
import crypto from 'crypto'

const prisma = new PrismaClient()

async function createInitialTenant() {
  try {
    console.log('🔄 Criando tenant inicial...')

    // Verificar se já existe
    const existing = await prisma.tenant.findUnique({
      where: { slug: 'tamboril-burguer' },
    })

    if (existing) {
      console.log('✅ Tenant "Tamboril Burguer" já existe!')
      console.log(`   ID: ${existing.id}`)
      console.log(`   API Key: ${existing.api_key}`)
      return
    }

    // Criar tenant
    const tenant = await prisma.tenant.create({
      data: {
        name: 'Tamboril Burguer',
        slug: 'tamboril-burguer',
        api_key: 'tamboril-burguer-api-key-2024-secure', // Manter a mesma para compatibilidade
        is_active: true,
      },
    })

    console.log('✅ Tenant criado com sucesso!')
    console.log(`   ID: ${tenant.id}`)
    console.log(`   Nome: ${tenant.name}`)
    console.log(`   Slug: ${tenant.slug}`)
    console.log(`   API Key: ${tenant.api_key}`)

    // Atualizar usuários existentes para usar este tenant (tenant_id é nullable em User)
    const updatedUsers = await prisma.user.updateMany({
      where: { tenant_id: null },
      data: { tenant_id: tenant.id },
    })

    console.log(`👤 ${updatedUsers.count} usuários existentes atualizados para usar este tenant`)

    console.log('\n✅ Setup completo!')
  } catch (error) {
    console.error('❌ Erro ao criar tenant:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

createInitialTenant()
