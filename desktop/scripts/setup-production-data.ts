/**
 * Script para popular dados iniciais em produção
 * Execute após as migrações: npx tsx scripts/setup-production-data.ts
 */

import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function setupProductionData() {
  try {
    console.log('🔄 Configurando dados iniciais de produção...\n')

    // 1. Criar tenant Tamboril Burguer
    let tenant = await prisma.tenant.findUnique({
      where: { slug: 'tamboril-burguer' },
    })

    if (!tenant) {
      tenant = await prisma.tenant.create({
        data: {
          name: 'Tamboril Burguer',
          slug: 'tamboril-burguer',
          api_key: 'tamboril-burguer-api-key-2024-secure',
          is_active: true,
        },
      })
      console.log('✅ Tenant "Tamboril Burguer" criado!')
      console.log(`   ID: ${tenant.id}`)
      console.log(`   API Key: ${tenant.api_key}\n`)
    } else {
      console.log('✅ Tenant "Tamboril Burguer" já existe!')
      console.log(`   ID: ${tenant.id}\n`)
    }

    // 2. Criar usuário admin do Tamboril Burguer
    const adminUsername = 'admin@tamboril.com'
    let adminUser = await prisma.user.findFirst({
      where: {
        username: adminUsername,
        tenant_id: tenant.id,
      },
    })

    if (!adminUser) {
      const hashedPassword = await bcrypt.hash('123456', 10)
      adminUser = await prisma.user.create({
        data: {
          tenant_id: tenant.id,
          username: adminUsername,
          password: hashedPassword,
          name: 'Admin Tamboril',
          role: 'admin',
        },
      })
      console.log('✅ Usuário admin criado!')
      console.log(`   Username: ${adminUser.username}`)
      console.log(`   Senha: 123456\n`)
    } else {
      console.log('✅ Usuário admin já existe!')
      console.log(`   Username: ${adminUser.username}\n`)
    }

    // 3. Criar usuário master (super admin)
    const masterUsername = 'ryan@dmtn.com.br'
    let masterUser = await prisma.user.findFirst({
      where: {
        username: masterUsername,
        tenant_id: null, // Super admin não tem tenant
      },
    })

    if (!masterUser) {
      const hashedPassword = await bcrypt.hash('123456', 10)
      masterUser = await prisma.user.create({
        data: {
          tenant_id: null, // Super admin
          username: masterUsername,
          password: hashedPassword,
          name: 'Ryan Master',
          role: 'admin',
        },
      })
      console.log('✅ Usuário master criado!')
      console.log(`   Username: ${masterUser.username}`)
      console.log(`   Senha: 123456\n`)
    } else {
      console.log('✅ Usuário master já existe!')
      console.log(`   Username: ${masterUser.username}\n`)
    }

    console.log('✅ Setup de produção completo!')
  } catch (error) {
    console.error('❌ Erro ao configurar dados:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

setupProductionData()
