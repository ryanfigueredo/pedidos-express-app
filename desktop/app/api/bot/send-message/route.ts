import { NextRequest, NextResponse } from 'next/server'
import { validateApiKey } from '@/lib/auth'

/**
 * API para o bot enviar mensagem via WhatsApp
 * Recebe comando de outras partes do sistema (ex: quando pedido sai para entrega)
 * 
 * Esta API chama o bot que está rodando no Railway
 */
export async function POST(request: NextRequest) {
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

    // Formatar telefone para WhatsApp
    let whatsappPhone = phone.replace(/\D/g, '')
    if (!whatsappPhone.startsWith('55') && whatsappPhone.length === 11) {
      whatsappPhone = `55${whatsappPhone}`
    }
    const formattedPhone = `${whatsappPhone}@s.whatsapp.net`

    // Enviar comando para o bot no Railway
    // O bot precisa ter um endpoint para receber comandos de envio de mensagem
    // Por enquanto, vamos retornar os dados para o bot buscar via polling
    // TODO: Implementar webhook direto do bot ou fila de mensagens

    return NextResponse.json({
      success: true,
      phone: formattedPhone,
      message: message,
      note: 'Mensagem será enviada pelo bot na próxima verificação'
    }, { status: 200 })
  } catch (error) {
    console.error('Erro ao preparar envio de mensagem:', error)
    return NextResponse.json(
      { message: 'Erro ao preparar mensagem', error: String(error) },
      { status: 500 }
    )
  }
}
