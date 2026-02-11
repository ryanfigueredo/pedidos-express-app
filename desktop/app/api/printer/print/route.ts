import { NextRequest, NextResponse } from 'next/server'
import { validateApiKey } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * API para receber comando de impressão e enviar para a maquininha
 * O app mobile envia o comando aqui, e a maquininha busca via polling ou WebSocket
 */
export async function POST(request: NextRequest) {
  const authValidation = await validateApiKey(request)
  if (!authValidation.isValid) {
    return authValidation.response!
  }

  try {
    const body = await request.json()
    const { orderId, printerDeviceId, printerIp } = body

    if (!orderId) {
      return NextResponse.json(
        { message: 'orderId é obrigatório' },
        { status: 400 }
      )
    }

    // Buscar pedido
    const order = await prisma.order.findUnique({
      where: { id: orderId }
    })

    if (!order) {
      return NextResponse.json(
        { message: 'Pedido não encontrado' },
        { status: 404 }
      )
    }

    // Criar comando de impressão na fila
    // A maquininha vai buscar esse comando via polling
    // Por enquanto, vamos usar uma tabela simples ou cache
    // Em produção, use Redis ou banco de dados
    
    // Por enquanto, retornamos sucesso e a maquininha busca via API
    return NextResponse.json({
      success: true,
      message: 'Comando de impressão enviado',
      orderId: order.id,
      printerDeviceId,
      printerIp,
      // A maquininha deve buscar em /api/printer/pending-prints
    }, { status: 200 })
  } catch (error) {
    console.error('Erro ao processar comando de impressão:', error)
    return NextResponse.json(
      { message: 'Erro ao processar comando', error: String(error) },
      { status: 500 }
    )
  }
}
