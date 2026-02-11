import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { validateApiKey } from '@/lib/auth'
import { sendDeliveryNotification } from '@/lib/notify-delivery'

/**
 * API para notificar cliente via WhatsApp quando pedido sair para entrega.
 * Chamada opcional após marcar pedido como "out_for_delivery".
 * O PATCH /api/orders/[id]/status já dispara a notificação automaticamente.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authValidation = await validateApiKey(request)
  if (!authValidation.isValid) {
    return authValidation.response!
  }

  try {
    const orderId = params.id
    const order = await prisma.order.findUnique({
      where: { id: orderId }
    })

    if (!order) {
      return NextResponse.json(
        { message: 'Pedido não encontrado' },
        { status: 404 }
      )
    }

    if (order.status !== 'out_for_delivery') {
      return NextResponse.json(
        { message: 'Pedido não está marcado como "saiu para entrega"' },
        { status: 400 }
      )
    }

    const result = await sendDeliveryNotification(order)

    if (!result.sent && result.error?.includes('Limite')) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 429 }
      )
    }

    const displayId = order.display_id || `#${(order.daily_sequence?.toString().padStart(3, '0') || '000')}`
    return NextResponse.json({
      success: true,
      order_id: order.id,
      customer_phone: order.customer_phone,
      display_id: displayId,
      note: result.sent ? 'Mensagem enviada ao bot WhatsApp' : (result.error || 'Envio não realizado')
    }, { status: 200 })
  } catch (error) {
    console.error('Erro ao preparar notificação de entrega:', error)
    return NextResponse.json(
      { message: 'Erro ao preparar notificação', error: String(error) },
      { status: 500 }
    )
  }
}
