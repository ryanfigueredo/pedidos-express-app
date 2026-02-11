import { NextRequest, NextResponse } from 'next/server'
import { validateApiKey } from '@/lib/auth'

/**
 * API para enviar mensagem WhatsApp via webhook do bot
 * Esta API será chamada quando um pedido sair para entrega
 * 
 * NOTA: Esta é uma solução temporária. O ideal seria o app Android
 * ter acesso direto ao Baileys ou usar uma API de WhatsApp Business.
 */
export async function POST(request: NextRequest) {
  // Validação de API_KEY
  const authValidation = await validateApiKey(request)
  if (!authValidation.isValid) {
    return authValidation.response!
  }

  try {
    const body = await request.json()
    const { phone, message } = body

    if (!phone || !message) {
      return NextResponse.json(
        { message: 'phone e message são obrigatórios' },
        { status: 400 }
      )
    }

    // Formatar telefone para WhatsApp (adicionar código do país se necessário)
    let whatsappPhone = phone.replace(/\D/g, '')
    if (!whatsappPhone.startsWith('55') && whatsappPhone.length === 11) {
      whatsappPhone = `55${whatsappPhone}`
    }
    const formattedPhone = `${whatsappPhone}@s.whatsapp.net`

    // Enviar mensagem via webhook interno (se o bot estiver rodando)
    // Por enquanto, retornamos os dados para o app Android enviar
    // TODO: Implementar envio direto via Baileys quando bot estiver rodando
    
    return NextResponse.json({
      success: true,
      phone: formattedPhone,
      message: message,
      note: 'O app Android deve enviar esta mensagem via WhatsApp usando Baileys ou API de WhatsApp Business'
    }, { status: 200 })
  } catch (error) {
    console.error('Erro ao preparar envio de mensagem:', error)
    return NextResponse.json(
      { message: 'Erro ao preparar mensagem', error: String(error) },
      { status: 500 }
    )
  }
}
