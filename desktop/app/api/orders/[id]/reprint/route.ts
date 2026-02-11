import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const orderId = params.id

  try {
    // Verifica se o pedido existe
    const existingOrder = await prisma.order.findUnique({
      where: { id: orderId },
    })

    if (!existingOrder) {
      return NextResponse.json(
        { message: 'Pedido não encontrado' },
        { status: 404 }
      )
    }

    // Atualiza o status do pedido para 'pending' (reimprimir)
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: { status: 'pending' },
    })

    console.log(`[REPRINT] Pedido ${orderId} marcado para reimpressão`)

    return NextResponse.json(
      {
        message: 'Pedido marcado para reimpressão',
        order: updatedOrder,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error(`[REPRINT] Erro ao reimprimir pedido - ID: ${orderId}`, error)
    
    return NextResponse.json(
      {
        message: 'Erro ao reimprimir pedido',
        error: String(error),
      },
      { status: 500 }
    )
  }
}
