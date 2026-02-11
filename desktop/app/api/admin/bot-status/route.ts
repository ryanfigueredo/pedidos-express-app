import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth-session'

export async function GET(request: NextRequest) {
  try {
    // Verificar se é super admin
    const session = await getSession()
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Não autenticado' },
        { status: 401 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { id: session.id },
    })

    if (user?.tenant_id) {
      return NextResponse.json(
        { success: false, error: 'Acesso negado. Apenas super admin.' },
        { status: 403 }
      )
    }

    // Buscar todos os tenants
    const tenants = await prisma.tenant.findMany({
      where: { is_active: true },
    })

    // Para cada tenant, verificar status do bot e estatísticas
    const botStatuses = await Promise.all(
      tenants.map(async (tenant) => {
        // Verificar pedidos de hoje
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const tomorrow = new Date(today)
        tomorrow.setDate(tomorrow.getDate() + 1)

        const ordersToday = await prisma.order.count({
          where: {
            tenant_id: tenant.id,
            created_at: {
              gte: today,
              lt: tomorrow,
            },
          },
        })

        // Verificar pedidos do mês
        const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
        const ordersMonth = await prisma.order.count({
          where: {
            tenant_id: tenant.id,
            created_at: {
              gte: firstDayOfMonth,
            },
          },
        })

        // Verificar último pedido (como proxy para status do bot)
        const lastOrder = await prisma.order.findFirst({
          where: { tenant_id: tenant.id },
          orderBy: { created_at: 'desc' },
          select: { created_at: true },
        })

        // Bot considerado online se teve pedido nas últimas 2 horas
        const isOnline = lastOrder 
          ? (Date.now() - lastOrder.created_at.getTime()) < 2 * 60 * 60 * 1000
          : false

        return {
          tenant_id: tenant.id,
          tenant_name: tenant.name,
          is_online: isOnline,
          last_heartbeat: lastOrder?.created_at.toISOString(),
          total_orders_today: ordersToday,
          total_orders_month: ordersMonth,
        }
      })
    )

    return NextResponse.json({
      success: true,
      bots: botStatuses,
    })
  } catch (error) {
    console.error('Erro ao buscar status dos bots:', error)
    return NextResponse.json(
      { success: false, error: 'Erro ao buscar status' },
      { status: 500 }
    )
  }
}
