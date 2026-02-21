import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getTenantIdFromRequest } from '@/lib/tenant-from-request'

/**
 * Server-Sent Events (SSE) para atualização em tempo real de pedidos.
 * Multi-tenancy: retorna APENAS pedidos do tenant do usuário autenticado (sessão ou Basic Auth).
 * NUNCA envia pedidos de outro tenant.
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

      const fetchOrders = () =>
        prisma.order.findMany({
          where: { tenant_id: tenantId },
          orderBy: { created_at: 'desc' },
          take: 20,
        })

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

      // Limpar intervalo quando cliente desconectar
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
