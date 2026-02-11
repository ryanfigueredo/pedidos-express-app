/**
 * Script para atualizar o número de WhatsApp do Tamboril Burguer
 * Número de teste: +55 21 99904-4219
 * 
 * Execute: npx tsx scripts/update-tamboril-whatsapp.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function updateTamborilWhatsApp() {
  try {
    console.log('🔄 Atualizando número de WhatsApp do Tamboril Burguer...\n')

    // Número fornecido: +55 21 99904-4219
    // Formato para banco: 5521999044219 (apenas números)
    const whatsappPhone = '5521999044219'

    // Buscar tenant Tamboril Burguer
    const tenant = await prisma.tenant.findUnique({
      where: { slug: 'tamboril-burguer' },
    })

    if (!tenant) {
      console.error('❌ Tenant "Tamboril Burguer" não encontrado!')
      console.log('   Execute primeiro: npx tsx scripts/setup-initial-data.ts')
      return
    }

    console.log(`📦 Tenant encontrado: ${tenant.name} (ID: ${tenant.id})`)
    console.log(`   Número atual: ${tenant.whatsapp_phone || 'Não configurado'}\n`)

    // Atualizar número de WhatsApp
    const updated = await prisma.tenant.update({
      where: { id: tenant.id },
      data: {
        whatsapp_phone: whatsappPhone,
        bot_configured: true,
        bot_last_heartbeat: new Date(),
      },
    })

    console.log('✅ Número de WhatsApp atualizado com sucesso!')
    console.log(`   Novo número: ${updated.whatsapp_phone}`)
    console.log(`   Bot configurado: ${updated.bot_configured ? 'Sim' : 'Não'}\n`)

    console.log('═══════════════════════════════════════')
    console.log('✅ Configuração atualizada!')
    console.log('═══════════════════════════════════════\n')

    console.log('📋 PRÓXIMOS PASSOS:')
    console.log('   1. Configure o DynamoDB com as credenciais Meta')
    console.log('   2. Certifique-se de que o bot está rodando')
    console.log('   3. Verifique o webhook no Meta Business\n')

  } catch (error) {
    console.error('❌ Erro ao atualizar número de WhatsApp:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

updateTamborilWhatsApp()
