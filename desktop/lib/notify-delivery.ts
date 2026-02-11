import { checkMessageLimit, incrementMessageUsage } from '@/lib/message-limits'

type OrderForNotify = {
  id: string
  tenant_id: string
  status: string
  display_id: string | null
  daily_sequence: number | null
  customer_name: string
  customer_phone: string
  order_type: string | null
  delivery_address: string | null
}

/**
 * Envia notificação de "saiu para entrega" ao cliente via Meta WhatsApp (Cloud API).
 * Usado pelo POST /api/orders/[id]/notify-delivery e pelo PATCH /api/orders/[id]/status
 * quando o status é atualizado para out_for_delivery.
 */
export async function sendDeliveryNotification(order: OrderForNotify): Promise<{ sent: boolean; error?: string }> {
  if (order.status !== 'out_for_delivery') {
    return { sent: false, error: 'Pedido não está marcado como saiu para entrega' }
  }

  try {
    const limitCheck = await checkMessageLimit(order.tenant_id)
    if (!limitCheck.allowed) {
      return {
        sent: false,
        error: `Limite de mensagens excedido. Plano: ${limitCheck.planName} (${limitCheck.current}/${limitCheck.limit} mensagens usadas).`
      }
    }
  } catch (error) {
    console.error('[NotifyDelivery] Erro ao verificar limite:', error)
    // Não bloqueia envio se houver erro na verificação
  }

  const displayId = order.display_id || `#${(order.daily_sequence?.toString().padStart(3, '0') || '000')}`
  const mensagem = `🚚 *PEDIDO ${displayId} SAIU PARA ENTREGA!*

Olá ${order.customer_name}! 👋

Seu pedido ${displayId} acabou de sair para entrega e está a caminho!

${order.order_type === 'delivery' && order.delivery_address
  ? `📍 Endereço: ${order.delivery_address}\n`
  : ''}Em breve chegará até você!

Obrigado por escolher Pedidos Express! ❤️`

  let whatsappPhone = order.customer_phone.replace(/\D/g, '')
  if (!whatsappPhone.startsWith('55') && whatsappPhone.length >= 10) {
    whatsappPhone = `55${whatsappPhone}`
  }

  const token = process.env.TOKEN_API_META
  const phoneNumberId = process.env.PHONE_NUMBER_ID
  const graphVersion = process.env.WHATSAPP_GRAPH_VERSION || 'v21.0'

  if (!token || !phoneNumberId) {
    return { sent: false, error: 'TOKEN_API_META e PHONE_NUMBER_ID não configurados (Meta WhatsApp)' }
  }

  try {
    const url = `https://graph.facebook.com/${graphVersion}/${phoneNumberId}/messages`
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: whatsappPhone,
        type: 'text',
        text: { body: mensagem.slice(0, 4096) },
      }),
    })
    const data = (await res.json().catch(() => ({}))) as { error?: { message?: string } }
    if (res.ok) {
      console.log(`✅ Mensagem de entrega enviada para ${order.customer_phone} (pedido ${order.id})`)
      try {
        await incrementMessageUsage(order.tenant_id, 1)
      } catch (error) {
        console.error('[NotifyDelivery] Erro ao incrementar uso:', error)
      }
      return { sent: true }
    }
    return { sent: false, error: data?.error?.message || `Meta API ${res.status}` }
  } catch (error) {
    console.error('[NotifyDelivery] Erro Meta API:', error)
    return { sent: false, error: error instanceof Error ? error.message : String(error) }
  }
}
