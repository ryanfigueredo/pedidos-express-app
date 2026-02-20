/**
 * Script para criar dados iniciais:
 * - 1 Tenant (Tamboril Burguer)
 * - Usuário master (ryan@dmtn.com.br)
 * - Usuário para Tamboril Burguer
 * 
 * Execute: npx tsx scripts/setup-initial-data.ts
 */

import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'

const prisma = new PrismaClient()

async function generateApiKey(): Promise<string> {
  return crypto.randomBytes(32).toString('hex')
}

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10)
}

async function setupInitialData() {
  try {
    console.log('🔄 Configurando dados iniciais...\n')

    // 1. Criar Tenant 1: Tamboril Burguer
    console.log('📦 Criando tenant: Tamboril Burguer...')
    const tenant1 = await prisma.tenant.upsert({
      where: { slug: 'tamboril-burguer' },
      update: {},
      create: {
        name: 'Tamboril Burguer',
        slug: 'tamboril-burguer',
        api_key: 'tamboril-burguer-api-key-2024-secure',
        is_active: true,
      },
    })
    console.log(`✅ Tenant criado: ${tenant1.name} (ID: ${tenant1.id})`)
    console.log(`   API Key: ${tenant1.api_key}\n`)

    // 2. Criar Usuário Master (super admin)
    console.log('👤 Criando usuário master...')
    const existingMaster = await prisma.user.findFirst({
      where: {
        username: 'ryan@dmtn.com.br',
        tenant_id: null,
      },
    })
    
    let masterUser
    if (existingMaster) {
      masterUser = existingMaster
      console.log('✅ Usuário master já existe')
    } else {
      const masterPassword = await hashPassword('123456')
      masterUser = await prisma.user.create({
        data: {
          username: 'ryan@dmtn.com.br',
          password: masterPassword,
          name: 'Ryan (Master)',
          role: 'super_admin',
          tenant_id: null, // Super admin não tem tenant
        },
      })
      console.log(`✅ Usuário master criado: ${masterUser.username}`)
    }
    console.log(`✅ Usuário master criado: ${masterUser.username}`)
    console.log(`   Senha: 123456\n`)

    // 4. Criar Usuário para Tamboril Burguer
    console.log('👤 Criando usuário para Tamboril Burguer...')
    const user1Password = await hashPassword('123456')
    const user1 = await prisma.user.upsert({
      where: {
        tenant_id_username: {
          tenant_id: tenant1.id,
          username: 'admin@tamboril.com'
        }
      },
      update: {},
      create: {
        tenant_id: tenant1.id,
        username: 'admin@tamboril.com',
        password: user1Password,
        name: 'Admin Tamboril',
        role: 'admin',
      },
    })
    console.log(`✅ Usuário criado: ${user1.username}`)
    console.log(`   Senha: 123456\n`)

    console.log('═══════════════════════════════════════')
    console.log('✅ Setup completo!')
    console.log('═══════════════════════════════════════\n')
    
    console.log('📋 RESUMO:\n')
    console.log('👑 MASTER (Super Admin):')
    console.log('   Email: ryan@dmtn.com.br')
    console.log('   Senha: 123456')
    console.log('   Acesso: /admin (Dashboard Master)\n')
    
    console.log('🍔 TAMBORIL BURGUER:')
    console.log(`   Tenant ID: ${tenant1.id}`)
    console.log(`   Slug: ${tenant1.slug}`)
    console.log(`   API Key: ${tenant1.api_key}`)
    console.log('   Usuário: admin@tamboril.com')
    console.log('   Senha: 123456\n')

    // 5. Tenant Barbeiro + usuário gui@barber.com.br (login no app)
    console.log('✂️ Criando tenant Barbeiro e usuário gui@barber.com.br...')
    const barberApiKey = await generateApiKey()
    const tenantBarber = await prisma.tenant.upsert({
      where: { slug: 'barbearia-demo' },
      update: { business_type: 'BARBEIRO' },
      create: {
        name: 'Barbearia Demo',
        slug: 'barbearia-demo',
        api_key: barberApiKey,
        is_active: true,
        business_type: 'BARBEIRO',
      },
    })
    console.log(`✅ Tenant barbeiro: ${tenantBarber.name} (${tenantBarber.slug})`)
    const barberUserPassword = await hashPassword('123456')
    const barberUser = await prisma.user.upsert({
      where: {
        tenant_id_username: {
          tenant_id: tenantBarber.id,
          username: 'gui@barber.com.br',
        },
      },
      update: { password: barberUserPassword, name: 'Gui Barbeiro' },
      create: {
        tenant_id: tenantBarber.id,
        username: 'gui@barber.com.br',
        password: barberUserPassword,
        name: 'Gui Barbeiro',
        role: 'admin',
      },
    })
    console.log(`✅ Usuário barbeiro: ${barberUser.username}`)
    console.log('   Senha: 123456')
    console.log('   (Login no app: gui@barber.com.br / 123456)\n')
    console.log('✂️ BARBEIRO (App + WhatsApp):')
    console.log(`   Tenant ID: ${tenantBarber.id}`)
    console.log(`   Slug: ${tenantBarber.slug}`)
    console.log(`   API Key: ${tenantBarber.api_key}`)
    console.log('   Usuário: gui@barber.com.br')
    console.log('   Senha: 123456\n')

  } catch (error) {
    console.error('❌ Erro ao configurar dados:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

setupInitialData()
