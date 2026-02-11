import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { validateApiKey } from '@/lib/auth'

export async function GET(request: NextRequest) {
  // Validação de API_KEY
  const authValidation = await validateApiKey(request)
  if (!authValidation.isValid) {
    return authValidation.response!
  }

  try {
    const order = await prisma.order.findFirst({
      where: {
        status: 'pending',
      },
      orderBy: {
        created_at: 'asc', // Pedido mais antigo primeiro
      },
    })

    if (!order) {
      return NextResponse.json(
        { message: 'Nenhum pedido pendente encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json(order, { status: 200 })
  } catch (error) {
    console.error('Erro ao buscar próximo pedido para impressão:', error)
    return NextResponse.json(
      { message: 'Erro ao buscar pedido', error: String(error) },
      { status: 500 }
    )
  }
}
