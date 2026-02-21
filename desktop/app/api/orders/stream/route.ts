import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getTenantIdFromRequest } from '@/lib/tenant-from-request'
import { getAgendaDateRange } from '@/lib/agenda-date-range'

/**
 * Server-Sent Events (SSE) para atualização em tempo real de pedidos.
 * Multi-tenancy: retorna APENAS pedidos do tenant do usuário autenticado (sessão ou Basic Auth).
 * Filtro agenda: inclui pedidos com appointment_date hoje/amanhã OU sem appointment_date (últimos 2 dias).
 */
export async function GET(request: NextRequest) {
  const tenantId = await getTenantIdFromRequest(request)
  if (!tenantId) {
    return new Response('Unauthorized', { status: 401 })
  }

  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: any) => {
        const message = `data: ${JSON.stringify(data)}\n\n`
        controller.enqueue(encoder.encode(message))
      }

      const { startOfToday, endOfRange, twoDaysAgo } = getAgendaDateRange(2)

      const fetchOrders = async () => {
        const raw = await prisma.order.findMany({
          where: {
            tenant_id: tenantId,
            OR: [
              {
                appointment_date: null,
                created_at: { gte: twoDaysAgo },
              },
              {
                appointment_date: { gte: startOfToday, lt: endOfRange },
              },
            ],
          },
          orderBy: [{ appointment_date: 'asc' }, { created_at: 'desc' }],
          take: 60,
        })
        return raw.map((order: any) => ({
          id: order.id,
          customer_name: order.customer_name,
          customer_phone: order.customer_phone,
          items: Array.isArray(order.items) ? order.items : [],
          total_price: Number(order.total_price),
          status: order.status,
          created_at: order.created_at.toISOString(),
          display_id: order.display_id,
          daily_sequence: order.daily_sequence,
          order_type: order.order_type,
          appointment_date: order.appointment_date?.toISOString?.() ?? null,
          estimated_time: order.estimated_time,
        }))
      }

      try {
        const orders = await fetchOrders()
        send({ type: 'initial', orders })
      } catch (error) {
        send({ type: 'error', message: 'Erro ao carregar pedidos' })
      }

      const interval = setInterval(async () => {
        try {
          const orders = await fetchOrders()
          send({ type: 'update', orders, timestamp: Date.now() })
        } catch (error) {
          console.error('Erro no SSE:', error)
        }
      }, 5000)

      request.signal.addEventListener('abort', () => {
        clearInterval(interval)
        controller.close()
      })
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no', // Desabilita buffering do nginx
    },
  })
}
