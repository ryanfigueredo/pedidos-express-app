import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth-session'

/**
 * Server-Sent Events (SSE) para atualização em tempo real de pedidos
 * Substitui o polling, reduzindo carga no servidor
 */
export async function GET(request: NextRequest) {
  // Verificar autenticação
  const session = await getSession()
  if (!session) {
    return new Response('Unauthorized', { status: 401 })
  }

  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: any) => {
        const message = `data: ${JSON.stringify(data)}\n\n`
        controller.enqueue(encoder.encode(message))
      }

      // Enviar dados iniciais
      try {
        const orders = await prisma.order.findMany({
          orderBy: { created_at: 'desc' },
          take: 20,
        })

        send({ type: 'initial', orders })
      } catch (error) {
        send({ type: 'error', message: 'Erro ao carregar pedidos' })
      }

      // Polling otimizado (a cada 5 segundos)
      const interval = setInterval(async () => {
        try {
          const orders = await prisma.order.findMany({
            orderBy: { created_at: 'desc' },
            take: 20,
          })

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
