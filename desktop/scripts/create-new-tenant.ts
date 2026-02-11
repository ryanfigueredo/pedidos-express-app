/**
 * Script para criar um novo restaurante (tenant) e usuário admin
 * 
 * Uso:
 *   npx tsx scripts/create-new-tenant.ts
 * 
 * O script vai pedir as informações necessárias interativamente
 */

import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import * as readline from 'readline'

const prisma = new PrismaClient()

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
})

function question(query: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(query, resolve)
  })
}

async function createNewTenant() {
  try {
    console.log('═══════════════════════════════════════')
    console.log('  CRIAR NOVO RESTAURANTE')
    console.log('═══════════════════════════════════════\n')

    // 1. Coletar informações do tenant
    const name = await question('Nome do restaurante: ')
    if (!name.trim()) {
      console.error('❌ Nome é obrigatório!')
      process.exit(1)
    }

    const slug = await question('Slug (identificador único, ex: pizzaria-do-joao): ')
    if (!slug.trim()) {
      console.error('❌ Slug é obrigatório!')
      process.exit(1)
    }

    // Verificar se slug já existe
    const existing = await prisma.tenant.findUnique({
      where: { slug: slug.trim() },
    })

    if (existing) {
      console.error(`❌ Slug "${slug}" já existe! Escolha outro.`)
      process.exit(1)
    }

    // 2. Criar tenant
    console.log('\n📦 Criando tenant...')
    const apiKey = crypto.randomBytes(32).toString('hex')
    const tenant = await prisma.tenant.create({
      data: {
        name: name.trim(),
        slug: slug.trim(),
        api_key: apiKey,
        is_active: true,
      },
    })

    console.log(`✅ Tenant criado!`)
    console.log(`   ID: ${tenant.id}`)
    console.log(`   Nome: ${tenant.name}`)
    console.log(`   Slug: ${tenant.slug}`)
    console.log(`   API Key: ${tenant.api_key}\n`)

    // 3. Criar usuário admin
    const createUser = await question('Criar usuário admin? (s/n): ')
    if (createUser.toLowerCase() === 's' || createUser.toLowerCase() === 'sim') {
      const username = await question('Email do admin (ex: admin@pizzaria.com): ')
      if (!username.trim()) {
        console.error('❌ Email é obrigatório!')
        process.exit(1)
      }

      // Verificar se username já existe para este tenant
      const existingUser = await prisma.user.findUnique({
        where: {
          tenant_id_username: {
            tenant_id: tenant.id,
            username: username.trim(),
          },
        },
      })

      if (existingUser) {
        console.error(`❌ Usuário "${username}" já existe para este tenant!`)
        process.exit(1)
      }

      const password = await question('Senha inicial: ')
      if (!password.trim()) {
        console.error('❌ Senha é obrigatória!')
        process.exit(1)
      }

      const userName = await question('Nome do usuário (ex: João Admin): ') || username.trim()

      console.log('\n👤 Criando usuário...')
      const hashedPassword = await bcrypt.hash(password.trim(), 10)
      const user = await prisma.user.create({
        data: {
          tenant_id: tenant.id,
          username: username.trim(),
          password: hashedPassword,
          name: userName.trim(),
          role: 'admin',
        },
      })

      console.log(`✅ Usuário criado!`)
      console.log(`   Username: ${user.username}`)
      console.log(`   Senha: ${password.trim()}\n`)
    }

    // 4. Resumo final
    console.log('═══════════════════════════════════════')
    console.log('✅ RESTAURANTE CRIADO COM SUCESSO!')
    console.log('═══════════════════════════════════════\n')

    console.log('📋 INFORMAÇÕES DO RESTAURANTE:\n')
    console.log(`   Nome: ${tenant.name}`)
    console.log(`   Slug: ${tenant.slug}`)
    console.log(`   Tenant ID: ${tenant.id}`)
    console.log(`   API Key: ${tenant.api_key}\n`)

    console.log('🔧 CONFIGURAÇÃO DO BOT WHATSAPP:\n')
    console.log('   No Railway/Render, adicione as variáveis:')
    console.log(`   TENANT_ID=${tenant.slug}`)
    console.log(`   TENANT_API_KEY=${tenant.api_key}\n`)

    console.log('📱 CONFIGURAÇÃO DO APP-ADMIN:\n')
    console.log('   No app.json, configure:')
    console.log(`   "tenantId": "${tenant.slug}"`)
    console.log(`   "apiKey": "${tenant.api_key}"\n`)

    console.log('⚠️  IMPORTANTE:')
    console.log('   - Salve essas informações em local seguro!')
    console.log('   - Reinicie o bot após configurar as variáveis\n')

  } catch (error) {
    console.error('❌ Erro ao criar restaurante:', error)
    throw error
  } finally {
    await prisma.$disconnect()
    rl.close()
  }
}

createNewTenant()
