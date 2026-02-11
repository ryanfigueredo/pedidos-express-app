import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { WhatsAppWebhookPayload, OrderItem } from '@/types/order'
import { Prisma } from '@prisma/client'

/**
 * Sanitiza e valida dados do JSONB para prevenir injeções
 * Remove caracteres perigosos e valida estrutura
 */
function sanitizeJsonbData(items: any[]): OrderItem[] {
  return items.map((item: any) => {
    const sanitizeString = (str: string): string => {
      if (typeof str !== 'string') return ''
      return str
        .replace(/[\x00-\x1F\x7F]/g, '')
        .replace(/[<>\"'\\]/g, '')
        .trim()
        .substring(0, 500)
    }
    const id = item.id != null ? String(item.id) : ''
    const name = item.name ?? item.nome ?? ''
    const quantity = typeof item.quantity === 'number' ? item.quantity : (typeof item.quantidade === 'number' ? item.quantidade : 0)
    const price = typeof item.price === 'number' ? item.price : (typeof item.preco === 'number' ? item.preco : 0)

    return {
      id: sanitizeString(id) || `item-${Math.random().toString(36).slice(2, 9)}`,
      name: sanitizeString(String(name)),
      quantity: Math.max(1, Math.min(1000, Math.floor(Number(quantity) || 1))),
      price: Math.max(0, Math.min(999999.99, Number(price) || 0))
    }
  })
}

function validateOrderData(data: any): { isValid: boolean; errors: string[]; sanitizedData?: WhatsAppWebhookPayload } {
  const errors: string[] = []

  if (!data) {
    errors.push('Dados do pedido não fornecidos')
    return { isValid: false, errors }
  }

  // Validar customer_name
  if (!data.customer_name || typeof data.customer_name !== 'string' || data.customer_name.trim().length === 0) {
    errors.push('Nome do cliente é obrigatório')
  }

  // Validar customer_phone
  if (!data.customer_phone || typeof data.customer_phone !== 'string' || data.customer_phone.trim().length === 0) {
    errors.push('Telefone do cliente é obrigatório')
  }

  // Validar items
  if (!Array.isArray(data.items) || data.items.length === 0) {
    errors.push('Items do pedido são obrigatórios e devem ser um array não vazio')
  } else {
    // Validar estrutura de cada item
    data.items.forEach((item: any, index: number) => {
      const id = item.id != null ? String(item.id) : ''
      if (!id.trim()) {
        errors.push(`Item ${index + 1}: ID é obrigatório`)
      }
      const name = item.name != null ? String(item.name) : (item.nome != null ? String(item.nome) : '')
      if (!name.trim()) {
        errors.push(`Item ${index + 1}: Nome é obrigatório`)
      }
      const qty = typeof item.quantity === 'number' ? item.quantity : (typeof item.quantidade === 'number' ? item.quantidade : NaN)
      if (!Number.isFinite(qty) || qty <= 0) {
        errors.push(`Item ${index + 1}: Quantidade deve ser um número maior que zero`)
      }
      const price = typeof item.price === 'number' ? item.price : (typeof item.preco === 'number' ? item.preco : NaN)
      if (!Number.isFinite(price) || price < 0) {
        errors.push(`Item ${index + 1}: Preço deve ser um número maior ou igual a zero`)
      }
    })
  }

  // Validar total_price (aceitar number ou string numérica)
  const totalPrice = typeof data.total_price === 'number' ? data.total_price : parseFloat(data.total_price)
  if (!Number.isFinite(totalPrice) || totalPrice < 0) {
    errors.push('Preço total deve ser um número maior ou igual a zero')
  }

  // Validar se o total_price corresponde à soma dos items
  if (Array.isArray(data.items) && data.items.length > 0 && Number.isFinite(totalPrice)) {
    const calculatedTotal = data.items.reduce((sum: number, item: any) => {
      const q = typeof item.quantity === 'number' ? item.quantity : (typeof item.quantidade === 'number' ? item.quantidade : 0)
      const p = typeof item.price === 'number' ? item.price : (typeof item.preco === 'number' ? item.preco : 0)
      return sum + p * q
    }, 0)
    const tolerance = 0.50
    if (Math.abs(calculatedTotal - totalPrice) > tolerance) {
      errors.push(`Preço total (${totalPrice}) não corresponde à soma dos items (${calculatedTotal.toFixed(2)})`)
    }
  }

  // Se passou na validação, sanitizar os dados
  if (errors.length === 0) {
    const sanitizedItems = sanitizeJsonbData(data.items)
    const totalPrice = typeof data.total_price === 'number' ? data.total_price : parseFloat(data.total_price)
    const sanitizedData: WhatsAppWebhookPayload = {
      customer_name: String(data.customer_name || '').trim().substring(0, 200),
      customer_phone: String(data.customer_phone || '').trim().substring(0, 20),
      items: sanitizedItems,
      total_price: Math.max(0, Math.min(999999.99, Number.isFinite(totalPrice) ? totalPrice : 0))
    }
    return {
      isValid: true,
      errors: [],
      sanitizedData
    }
  }

  return {
    isValid: false,
    errors
  }
}

export async function POST(request: NextRequest) {
  try {
    // Parse do body
    const body = await request.json()

    // Validação e sanitização dos dados
    const validation = validateOrderData(body)
    if (!validation.isValid) {
      return NextResponse.json(
        {
          success: false,
          error: 'Dados inválidos',
          details: validation.errors
        },
        { status: 400 }
      )
    }

    // Usar dados sanitizados para prevenir injeções
    const orderData = validation.sanitizedData!

    // Obter método de pagamento se existir
    const paymentMethod = body.payment_method || 'Não especificado'
    
    // Obter tipo de pedido (restaurante ou delivery)
    const orderType = body.order_type || 'restaurante'
    
    // Obter endereço de entrega (apenas para delivery)
    const deliveryAddress = body.delivery_address || null
    
    // Obter campos de agendamento (para dentistas)
    const appointmentDate = body.appointment_date ? new Date(body.appointment_date) : null
    const appointmentType = body.appointment_type || null
    const doctorNotes = body.doctor_notes || null
    const patientNotes = body.patient_notes || null

    // Normalizar telefone (remover caracteres especiais e garantir formato correto)
    let normalizedPhone = orderData.customer_phone.replace(/\D/g, '')
    // Se começar com 55 (código do país) e tiver mais de 11 dígitos, remover o 55
    if (normalizedPhone.startsWith('55') && normalizedPhone.length > 11) {
      normalizedPhone = normalizedPhone.substring(2)
    }
    // Garantir que não tenha caracteres estranhos
    normalizedPhone = normalizedPhone.replace(/[^0-9]/g, '')

    // Obter tenant_id (UUID) do header, body ou API key
    // Bot envia slug (ex: tamboril-burguer) ou API key — precisamos do UUID para orders.tenant_id
    let tenantId: string | null = null
    const apiKey = request.headers.get('x-api-key') || request.headers.get('X-API-Key')
    const tenantIdHeader = request.headers.get('x-tenant-id') || request.headers.get('X-Tenant-Id')
    const tenantFromBody = body.tenant_id

    // 1) API key tem prioridade — sempre retorna tenant.id (UUID)
    if (apiKey) {
      const { getTenantByApiKey } = await import('@/lib/tenant')
      const tenant = await getTenantByApiKey(apiKey)
      if (tenant) {
        tenantId = tenant.id
      }
    }

    // 2) Se ainda não temos UUID, usar header ou body (pode ser slug ou UUID)
    if (!tenantId && (tenantIdHeader || tenantFromBody)) {
      const raw = tenantIdHeader || tenantFromBody
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(raw)
      if (isUuid) {
        tenantId = raw
      } else {
        const { getTenantBySlug } = await import('@/lib/tenant')
        const tenant = await getTenantBySlug(raw)
        if (tenant) {
          tenantId = tenant.id
        }
      }
    }

    if (!tenantId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Tenant não identificado. Forneça X-Tenant-Id (slug ou UUID) ou X-API-Key válida.'
        },
        { status: 400 }
      )
    }

    // Contar quantos pedidos já existem deste telefone para este tenant (correspondência exata)
    const ordersFromPhone = await prisma.order.count({
      where: {
        customer_phone: normalizedPhone,
        tenant_id: tenantId
      }
    })

    // Calcular número do pedido (sequencial por telefone)
    const orderNumber = ordersFromPhone + 1

    // Total de pedidos do cliente (para promoções do Papelão)
    const customerTotalOrders = ordersFromPhone + 1

    // Calcular sequência diária (quantos pedidos foram feitos hoje)
    const { getTodayBRTBounds, formatDisplayId } = await import(
      "@/lib/order-display-id"
    )
    const { start: dayStart, end: dayEnd } = getTodayBRTBounds()
    const dailySequence =
      (await prisma.order.count({
        where: {
          tenant_id: tenantId,
          created_at: { gte: dayStart, lte: dayEnd },
        },
      })) + 1

    const displayId = formatDisplayId(dailySequence)

    // Calcular tempo estimado baseado na fila (20 minutos por pedido)
    // Se for o 1º pedido = 20 min, 2º = 40 min, 3º = 60 min, etc.
    const estimatedTime = dailySequence * 20

    // Criar pedido no banco de dados usando dados sanitizados
    // O Prisma já protege contra SQL injection, mas garantimos que o JSONB está limpo
    const order = await prisma.order.create({
      data: {
        tenant_id: tenantId,
        customer_name: orderData.customer_name,
        customer_phone: normalizedPhone,
        items: orderData.items as unknown as Prisma.InputJsonValue, // JSONB sanitizado
        total_price: new Prisma.Decimal(orderData.total_price),
        status: 'pending',
        payment_method: paymentMethod,
        order_number: orderNumber,
        daily_sequence: dailySequence,
        display_id: displayId,
        customer_total_orders: customerTotalOrders,
        order_type: orderType,
        estimated_time: estimatedTime,
        delivery_address: deliveryAddress,
        // Campos de agendamento (para dentistas)
        appointment_date: appointmentDate,
        appointment_type: appointmentType,
        doctor_notes: doctorNotes,
        patient_notes: patientNotes
      }
    })

    // Retornar sucesso com o ID do pedido
    return NextResponse.json(
      {
        success: true,
        order_id: order.id,
        display_id: order.display_id,
        daily_sequence: order.daily_sequence,
        customer_total_orders: order.customer_total_orders,
        estimated_time: order.estimated_time,
        order_type: order.order_type,
        message: 'Pedido criado com sucesso'
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('Erro ao processar webhook do WhatsApp:', error)
    console.error('Stack:', error?.stack)
    console.error('Code:', error?.code)

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        return NextResponse.json(
          { success: false, error: 'Erro de duplicação no banco de dados', details: 'P2002' },
          { status: 409 }
        )
      }
      if (error.code === 'P2003') {
        return NextResponse.json(
          { success: false, error: 'Erro de referência (tenant ou tabela). Verifique se o tenant existe.', details: 'P2003' },
          { status: 400 }
        )
      }
      if (error.code === 'P2021' || error.code === 'P2022') {
        return NextResponse.json(
          { success: false, error: 'Tabela ou coluna não existe. Execute o setup do banco (POST /api/admin/setup-database).', details: error.code },
          { status: 500 }
        )
      }
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Erro ao processar pedido',
        details: process.env.NODE_ENV === 'development' ? String(error?.message || error) : 'Erro interno. Verifique os logs.'
      },
      { status: 500 }
    )
  }
}

// Método GET para verificação de saúde do endpoint
export async function GET() {
  return NextResponse.json(
    {
      success: true,
      message: 'Webhook WhatsApp endpoint está ativo',
      method: 'POST',
      description: 'Este endpoint recebe pedidos do bot do WhatsApp'
    },
    { status: 200 }
  )
}
