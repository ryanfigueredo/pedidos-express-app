import { NextRequest, NextResponse } from 'next/server'
import { validateApiKey } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * API para a maquininha buscar comandos de impressão pendentes
 * A maquininha faz polling nesta API periodicamente
 */
export async function GET(request: NextRequest) {
  const authValidation = await validateApiKey(request)
  if (!authValidation.isValid) {
    return authValidation.response!
  }

  try {
    const { searchParams } = new URL(request.url)
    const deviceId = searchParams.get('deviceId')
    const ip = searchParams.get('ip')

    // Buscar pedidos pendentes de impressão
    // Se deviceId ou ip for fornecido, filtra por impressora específica
    // Por enquanto, retorna todos os pedidos pendentes
    const pendingOrders = await prisma.order.findMany({
      where: {
        status: 'pending',
      },
      orderBy: {
        created_at: 'asc',
      },
      take: 1, // Retorna apenas o próximo pedido
    })

    if (pendingOrders.length === 0) {
      return NextResponse.json({
        hasOrder: false,
        order: null,
      }, { status: 200 })
    }

    const order = pendingOrders[0]

    return NextResponse.json({
      hasOrder: true,
      order: {
        id: order.id,
        customer_name: order.customer_name,
        customer_phone: order.customer_phone,
        items: order.items,
        total_price: order.total_price.toString(),
        status: order.status,
        created_at: order.created_at.toISOString(),
        display_id: order.display_id,
        daily_sequence: order.daily_sequence,
        payment_method: order.payment_method,
        order_type: order.order_type,
        delivery_address: order.delivery_address,
      },
    }, { status: 200 })
  } catch (error) {
    console.error('Erro ao buscar pedidos pendentes:', error)
    return NextResponse.json(
      { message: 'Erro ao buscar pedidos', error: String(error) },
      { status: 500 }
    )
  }
}
