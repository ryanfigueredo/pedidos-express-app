import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { validateApiKey } from '@/lib/auth'
import { sendDeliveryNotification } from '@/lib/notify-delivery'

/**
 * API para atualizar status do pedido.
 * Usado pelo app Android/iOS para impressão e "saiu para entrega".
 * Ao marcar como out_for_delivery, envia notificação ao cliente via bot WhatsApp.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authValidation = await validateApiKey(request)
  if (!authValidation.isValid) {
    return authValidation.response!
  }

  const startTime = Date.now()
  const orderId = params.id

  try {
    const body = await request.json()
    const { status } = body

    if (!status) {
      return NextResponse.json(
        { message: 'Status é obrigatório' },
        { status: 400 }
      )
    }

    const existingOrder = await prisma.order.findUnique({
      where: { id: orderId },
    })

    if (!existingOrder) {
      const responseTime = Date.now() - startTime
      console.log(`[UPDATE-STATUS] Pedido não encontrado - ID: ${orderId} - Tempo: ${responseTime}ms`)
      return NextResponse.json(
        { message: 'Pedido não encontrado' },
        { status: 404 }
      )
    }

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: { status: status as any },
    })

    const responseTime = Date.now() - startTime
    console.log(`[UPDATE-STATUS] Pedido atualizado - ID: ${orderId} - ${existingOrder.status} -> ${updatedOrder.status} - ${responseTime}ms`)

    // Ao marcar como "saiu para entrega", notificar cliente via bot WhatsApp
    if (status === 'out_for_delivery') {
      sendDeliveryNotification(updatedOrder).then((result) => {
        if (!result.sent) {
          console.warn(`[UPDATE-STATUS] Notificação de entrega não enviada para ${orderId}:`, result.error)
        }
      })
    }

    return NextResponse.json(
      {
        message: 'Status atualizado com sucesso',
        order: updatedOrder,
        responseTime: `${responseTime}ms`,
      },
      { status: 200 }
    )
  } catch (error) {
    const responseTime = Date.now() - startTime
    
    console.error(`[UPDATE-STATUS] Erro - ID: ${orderId} - Tempo: ${responseTime}ms`)
    console.error('Erro:', error)
    
    return NextResponse.json(
      {
        message: 'Erro ao atualizar status',
        error: String(error),
        responseTime: `${responseTime}ms`,
      },
      { status: 500 }
    )
  }
}
