import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { validateApiKey } from '@/lib/auth'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Validação de API_KEY
  const authValidation = await validateApiKey(request)
  if (!authValidation.isValid) {
    return authValidation.response!
  }

  try {
    const orderId = params.id

    // Buscar pedido para obter dados do cliente
    const order = await prisma.order.findUnique({
      where: { id: orderId }
    })

    if (!order) {
      return NextResponse.json(
        { message: 'Pedido não encontrado' },
        { status: 404 }
      )
    }

    // Atualizar status para "out_for_delivery"
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        status: 'out_for_delivery'
      }
    })

    // Retornar dados do pedido para envio de mensagem WhatsApp
    return NextResponse.json({
      success: true,
      order: updatedOrder,
      customer_phone: order.customer_phone,
      display_id: order.display_id || `#${order.daily_sequence?.toString().padStart(3, '0') || '000'}`
    }, { status: 200 })
  } catch (error) {
    console.error('Erro ao marcar pedido como saiu para entrega:', error)
    return NextResponse.json(
      { message: 'Erro ao atualizar pedido', error: String(error) },
      { status: 500 }
    )
  }
}
