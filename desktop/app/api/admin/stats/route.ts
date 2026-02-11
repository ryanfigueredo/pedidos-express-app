import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth-session'
import { validateApiKey } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticação: pode ser por API_KEY, por sessão ou por Basic Auth
    const session = await getSession()
    const authValidation = await validateApiKey(request)
    
    let tenantId: string | null = null
    let isSuperAdmin = false

    // Verificar Basic Auth (para apps mobile)
    const authHeader = request.headers.get('authorization')
    let userFromAuth: any = null
    
    if (authHeader && authHeader.startsWith('Basic ')) {
      try {
        const base64Credentials = authHeader.split(' ')[1]
        const credentials = Buffer.from(base64Credentials, 'base64').toString('utf-8')
        const [username, password] = credentials.split(':')
        
        if (username && password) {
          const { verifyCredentials } = await import('@/lib/auth-session')
          userFromAuth = await verifyCredentials(username, password)
        }
      } catch (error) {
        // Ignorar erro de parsing
      }
    }

    if (session) {
      // Autenticação por sessão (web)
      const user = await prisma.user.findUnique({
        where: { id: session.id },
      })

      if (!user) {
        return NextResponse.json(
          { success: false, error: 'Usuário não encontrado' },
          { status: 404 }
        )
      }

      tenantId = user.tenant_id
      isSuperAdmin = !tenantId
    } else if (userFromAuth) {
      // Autenticação por Basic Auth (app mobile com login)
      const user = await prisma.user.findUnique({
        where: { id: userFromAuth.id },
      })

      if (!user) {
        return NextResponse.json(
          { success: false, error: 'Usuário não encontrado' },
          { status: 404 }
        )
      }

      tenantId = user.tenant_id
      isSuperAdmin = !tenantId
    } else if (authValidation.isValid && authValidation.tenant) {
      tenantId = authValidation.tenant.id
      isSuperAdmin = false
    } else {
      // Fallback: tentar X-Tenant-Id (slug ou UUID) como no app de pedidos
      const tenantIdHeader = request.headers.get('x-tenant-id') || request.headers.get('X-Tenant-Id')
      if (tenantIdHeader) {
        const { getTenantBySlug } = await import('@/lib/tenant')
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(tenantIdHeader)
        if (isUuid) {
          tenantId = tenantIdHeader
        } else {
          const tenant = await getTenantBySlug(tenantIdHeader)
          if (tenant) {
            tenantId = tenant.id
            isSuperAdmin = false
          }
        }
      }
      if (!tenantId) {
        return NextResponse.json(
          { success: false, error: 'Não autenticado' },
          { status: 401 }
        )
      }
    }

    // Data atual e início da semana (segunda-feira)
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const dayOfWeek = now.getDay()
    const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1
    const weekStart = new Date(today)
    weekStart.setDate(today.getDate() - daysFromMonday)
    weekStart.setHours(0, 0, 0, 0)

    // Data de 7 dias atrás para comparação
    const lastWeekStart = new Date(weekStart)
    lastWeekStart.setDate(weekStart.getDate() - 7)
    const lastWeekEnd = new Date(weekStart)

    // Verificar se tabela orders existe e tratar erros
    let ordersTableExists = false
    try {
      const tableCheck = await prisma.$queryRawUnsafe<Array<{ table_name: string }>>(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'orders'
        LIMIT 1
      `)
      ordersTableExists = tableCheck.length > 0
    } catch (error) {
      console.log('Erro ao verificar tabela orders, assumindo que não existe:', error)
      ordersTableExists = false
    }

    if (!ordersTableExists) {
      // Tabela orders não existe, retornar dados vazios
      return NextResponse.json({
        success: true,
        stats: {
          today: {
            orders: 0,
            revenue: 0,
            revenueFormatted: 'R$ 0,00',
          },
          week: {
            orders: 0,
            revenue: 0,
            revenueFormatted: 'R$ 0,00',
            ordersChange: 0,
            revenueChange: 0,
          },
          pendingOrders: 0,
          dailyStats: ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'].map(day => ({
            day,
            orders: 0,
            revenue: 0,
          })),
          ...(isSuperAdmin && { totalRestaurants: 0 }),
        },
      })
    }

    // Pedidos de hoje - com tratamento de erro
    let todayOrders = 0
    let todayRevenue: any = { _sum: { total_price: null } }
    try {
      todayOrders = await prisma.order.count({
        where: {
          ...(tenantId ? { tenant_id: tenantId } : {}),
          created_at: {
            gte: today,
          },
        },
      })

      // Receita de hoje
      todayRevenue = await prisma.order.aggregate({
        where: {
          ...(tenantId ? { tenant_id: tenantId } : {}),
          created_at: {
            gte: today,
          },
          status: {
            in: ['printed', 'finished', 'out_for_delivery'],
          },
        },
        _sum: {
          total_price: true,
        },
      })
    } catch (orderError: any) {
      console.error('Erro ao buscar pedidos de hoje:', orderError)
      if (orderError?.code === 'P2022' || orderError?.code === 'P2021') {
        // Tabela ou coluna não existe, retornar dados vazios
        return NextResponse.json({
          success: true,
          stats: {
            today: {
              orders: 0,
              revenue: 0,
              revenueFormatted: 'R$ 0,00',
            },
            week: {
              orders: 0,
              revenue: 0,
              revenueFormatted: 'R$ 0,00',
              ordersChange: 0,
              revenueChange: 0,
            },
            pendingOrders: 0,
            dailyStats: ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'].map(day => ({
              day,
              orders: 0,
              revenue: 0,
            })),
            ...(isSuperAdmin && { totalRestaurants: 0 }),
          },
        })
      }
      throw orderError
    }

    // Pedidos da semana atual
    let weekOrders = 0
    let weekRevenue: any = { _sum: { total_price: null } }
    let lastWeekOrders = 0
    let lastWeekRevenue: any = { _sum: { total_price: null } }
    let ordersByDay: any[] = []
    
    try {
      weekOrders = await prisma.order.count({
        where: {
          ...(tenantId ? { tenant_id: tenantId } : {}),
          created_at: {
            gte: weekStart,
          },
        },
      })

      // Receita da semana atual
      weekRevenue = await prisma.order.aggregate({
        where: {
          ...(tenantId ? { tenant_id: tenantId } : {}),
          created_at: {
            gte: weekStart,
          },
          status: {
            in: ['printed', 'finished', 'out_for_delivery'],
          },
        },
        _sum: {
          total_price: true,
        },
      })

      // Pedidos da semana passada (para comparação)
      lastWeekOrders = await prisma.order.count({
        where: {
          ...(tenantId ? { tenant_id: tenantId } : {}),
          created_at: {
            gte: lastWeekStart,
            lt: lastWeekEnd,
          },
        },
      })

      // Receita da semana passada
      lastWeekRevenue = await prisma.order.aggregate({
        where: {
          ...(tenantId ? { tenant_id: tenantId } : {}),
          created_at: {
            gte: lastWeekStart,
            lt: lastWeekEnd,
          },
          status: {
            in: ['printed', 'finished', 'out_for_delivery'],
          },
        },
        _sum: {
          total_price: true,
        },
      })

      // Pedidos por dia da semana atual
      ordersByDay = await prisma.order.findMany({
        where: {
          ...(tenantId ? { tenant_id: tenantId } : {}),
          created_at: {
            gte: weekStart,
          },
        },
        select: {
          created_at: true,
          total_price: true,
          status: true,
        },
      })
    } catch (orderError: any) {
      console.error('Erro ao buscar pedidos da semana:', orderError)
      // Se der erro, usar valores padrão (zeros)
      if (orderError?.code === 'P2022' || orderError?.code === 'P2021') {
        weekOrders = 0
        weekRevenue = { _sum: { total_price: null } }
        lastWeekOrders = 0
        lastWeekRevenue = { _sum: { total_price: null } }
        ordersByDay = []
      } else {
        throw orderError
      }
    }

    // Agrupar por dia
    const dailyStats: Record<string, { orders: number; revenue: number }> = {}
    const daysOfWeek = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo']
    
    // Inicializar todos os dias com zero
    for (let i = 0; i < 7; i++) {
      const date = new Date(weekStart)
      date.setDate(weekStart.getDate() + i)
      const dayKey = daysOfWeek[i]
      dailyStats[dayKey] = { orders: 0, revenue: 0 }
    }

    // Preencher com dados reais
    ordersByDay.forEach((order) => {
      const orderDate = new Date(order.created_at)
      const dayIndex = orderDate.getDay() === 0 ? 6 : orderDate.getDay() - 1
      const dayKey = daysOfWeek[dayIndex]
      
      if (dailyStats[dayKey]) {
        dailyStats[dayKey].orders++
        if (order.status !== 'pending') {
          const price = typeof order.total_price === 'string' 
            ? parseFloat(order.total_price) 
            : typeof order.total_price === 'object' && 'toNumber' in order.total_price
            ? (order.total_price as any).toNumber()
            : Number(order.total_price) || 0
          dailyStats[dayKey].revenue += price
        }
      }
    })

    // Pedidos pendentes
    let pendingOrders = 0
    try {
      pendingOrders = await prisma.order.count({
        where: {
          ...(tenantId ? { tenant_id: tenantId } : {}),
          status: 'pending',
        },
      })
    } catch (error: any) {
      console.error('Erro ao buscar pedidos pendentes:', error)
      if (error?.code === 'P2022' || error?.code === 'P2021') {
        pendingOrders = 0
      } else {
        throw error
      }
    }

    // Total de restaurantes (apenas para super admin)
    let totalRestaurants = 0
    if (isSuperAdmin) {
      totalRestaurants = await prisma.tenant.count({
        where: {
          is_active: true,
        },
      })
    }

    // Calcular variações percentuais
    const ordersChange = lastWeekOrders > 0 
      ? ((weekOrders - lastWeekOrders) / lastWeekOrders) * 100 
      : 0
    
    const lastWeekRevenueValue = lastWeekRevenue._sum.total_price 
      ? (typeof lastWeekRevenue._sum.total_price === 'string' 
          ? parseFloat(lastWeekRevenue._sum.total_price) 
          : typeof lastWeekRevenue._sum.total_price === 'object' && 'toNumber' in lastWeekRevenue._sum.total_price
          ? (lastWeekRevenue._sum.total_price as any).toNumber()
          : Number(lastWeekRevenue._sum.total_price) || 0)
      : 0
    
    const weekRevenueValue = weekRevenue._sum.total_price 
      ? (typeof weekRevenue._sum.total_price === 'string' 
          ? parseFloat(weekRevenue._sum.total_price) 
          : typeof weekRevenue._sum.total_price === 'object' && 'toNumber' in weekRevenue._sum.total_price
          ? (weekRevenue._sum.total_price as any).toNumber()
          : Number(weekRevenue._sum.total_price) || 0)
      : 0

    const revenueChange = lastWeekRevenueValue > 0 
      ? ((weekRevenueValue - lastWeekRevenueValue) / lastWeekRevenueValue) * 100 
      : 0

    // Formatar receita
    const formatRevenue = (value: number) => {
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
      }).format(value)
    }

    return NextResponse.json({
      success: true,
      stats: {
        today: {
          orders: todayOrders,
          revenue: todayRevenue._sum.total_price 
            ? (typeof todayRevenue._sum.total_price === 'string' 
                ? parseFloat(todayRevenue._sum.total_price) 
                : typeof todayRevenue._sum.total_price === 'object' && 'toNumber' in todayRevenue._sum.total_price
                ? (todayRevenue._sum.total_price as any).toNumber()
                : Number(todayRevenue._sum.total_price) || 0)
            : 0,
          revenueFormatted: formatRevenue(
            todayRevenue._sum.total_price 
              ? (typeof todayRevenue._sum.total_price === 'string' 
                  ? parseFloat(todayRevenue._sum.total_price) 
                  : typeof todayRevenue._sum.total_price === 'object' && 'toNumber' in todayRevenue._sum.total_price
                  ? (todayRevenue._sum.total_price as any).toNumber()
                  : Number(todayRevenue._sum.total_price) || 0)
              : 0
          ),
        },
        week: {
          orders: weekOrders,
          revenue: weekRevenueValue,
          revenueFormatted: formatRevenue(weekRevenueValue),
          ordersChange: Number(ordersChange.toFixed(1)),
          revenueChange: Number(revenueChange.toFixed(1)),
        },
        pendingOrders,
        dailyStats: daysOfWeek.map(day => ({
          day,
          orders: dailyStats[day]?.orders || 0,
          revenue: dailyStats[day]?.revenue || 0,
        })),
        ...(isSuperAdmin && { totalRestaurants }),
      },
    })
  } catch (error: any) {
    console.error('Erro ao buscar estatísticas:', error)
    console.error('Detalhes do erro:', {
      message: error?.message,
      code: error?.code,
      stack: error?.stack,
    })
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erro ao buscar estatísticas',
        details: process.env.NODE_ENV !== 'production' ? error?.message : undefined,
        errorCode: error?.code,
      },
      { status: 500 }
    )
  }
}
