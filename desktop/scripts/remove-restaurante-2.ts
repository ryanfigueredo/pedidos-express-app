/**
 * Script para remover o "Restaurante 2" e seus dados relacionados
 * 
 * Execute: npx tsx scripts/remove-restaurante-2.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function removeRestaurante2() {
  try {
    console.log('🔄 Removendo Restaurante 2 e dados relacionados...\n')

    // Buscar o tenant Restaurante 2
    const tenant = await prisma.tenant.findUnique({
      where: { slug: 'restaurante-2' },
      include: {
        users: true,
        orders: true,
      },
    })

    if (!tenant) {
      console.log('⚠️  Tenant "Restaurante 2" não encontrado. Nada para remover.')
      return
    }

    console.log(`📦 Tenant encontrado: ${tenant.name} (ID: ${tenant.id})`)
    console.log(`   Usuários: ${tenant.users.length}`)
    console.log(`   Pedidos: ${tenant.orders.length}\n`)

    // Deletar usuários do tenant
    if (tenant.users.length > 0) {
      console.log('👤 Removendo usuários...')
      await prisma.user.deleteMany({
        where: { tenant_id: tenant.id },
      })
      console.log(`✅ ${tenant.users.length} usuário(s) removido(s)\n`)
    }

    // Deletar pedidos do tenant
    if (tenant.orders.length > 0) {
      console.log('📋 Removendo pedidos...')
      await prisma.order.deleteMany({
        where: { tenant_id: tenant.id },
      })
      console.log(`✅ ${tenant.orders.length} pedido(s) removido(s)\n`)
    }

    // Deletar o tenant
    console.log('🗑️  Removendo tenant...')
    await prisma.tenant.delete({
      where: { id: tenant.id },
    })
    console.log('✅ Tenant "Restaurante 2" removido com sucesso!\n')

    console.log('═══════════════════════════════════════')
    console.log('✅ Limpeza completa!')
    console.log('═══════════════════════════════════════\n')

  } catch (error) {
    console.error('❌ Erro ao remover Restaurante 2:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

removeRestaurante2()
