import { prisma } from './prisma'

export type MessageCategory = 'SERVICE' | 'UTILITY' | 'MARKETING' | 'AUTHENTICATION'

// Custos por categoria em USD (conforme documentação WhatsApp)
const COSTS_USD: Record<MessageCategory, number> = {
  SERVICE: 0, // Gratuito dentro de 24h
  UTILITY: 0.0085,
  MARKETING: 0.0782,
  AUTHENTICATION: 0.0085,
}

// Taxa de conversão USD -> BRL (pode ser atualizada via API ou config)
const USD_TO_BRL = 5.0 // Aproximado, pode ser atualizado

/**
 * Calcula custo em BRL baseado na categoria
 */
export function calculateCost(category: MessageCategory, within24h: boolean = false): { usd: number; brl: number } {
  // Se é SERVICE e está dentro de 24h, é gratuito
  if (category === 'SERVICE' && within24h) {
    return { usd: 0, brl: 0 }
  }
  
  const usd = COSTS_USD[category]
  const brl = usd * USD_TO_BRL
  
  return { usd, brl }
}

/**
 * Registra uma mensagem WhatsApp com categoria e custo
 */
export async function logWhatsAppMessage(
  tenantId: string,
  toPhone: string,
  category: MessageCategory,
  options?: {
    messageType?: string
    templateName?: string
    within24hWindow?: boolean
  }
): Promise<void> {
  const within24h = options?.within24hWindow ?? (category === 'SERVICE')
  const { usd, brl } = calculateCost(category, within24h)
  
  // Registrar mensagem individual
  await prisma.whatsAppMessage.create({
    data: {
      tenant_id: tenantId,
      to_phone: toPhone,
      category,
      cost_usd: usd,
      cost_brl: brl,
      message_type: options?.messageType || 'text',
      template_name: options?.templateName || null,
      within_24h_window: within24h,
    },
  })
  
  // Atualizar contadores mensais
  const now = new Date()
  const month = now.getMonth() + 1
  const year = now.getFullYear()
  
  const updateData: any = {
    messages_sent: { increment: 1 },
  }
  
  // Incrementar contador por categoria
  switch (category) {
    case 'SERVICE':
      updateData.messages_service = { increment: 1 }
      break
    case 'UTILITY':
      updateData.messages_utility = { increment: 1 }
      break
    case 'MARKETING':
      updateData.messages_marketing = { increment: 1 }
      break
    case 'AUTHENTICATION':
      updateData.messages_auth = { increment: 1 }
      break
  }
  
  // Atualizar custo total (só se não for gratuito)
  if (brl > 0) {
    updateData.total_cost_brl = { increment: brl }
  }
  
  await prisma.messageUsage.upsert({
    where: {
      tenant_id_month_year: {
        tenant_id: tenantId,
        month,
        year,
      },
    },
    update: updateData,
    create: {
      tenant_id: tenantId,
      month,
      year,
      messages_sent: 1,
      conversations_started: 0,
      messages_service: category === 'SERVICE' ? 1 : 0,
      messages_utility: category === 'UTILITY' ? 1 : 0,
      messages_marketing: category === 'MARKETING' ? 1 : 0,
      messages_auth: category === 'AUTHENTICATION' ? 1 : 0,
      total_cost_brl: brl,
    },
  })
}

/**
 * Obtém estatísticas de custos por tenant
 */
export async function getWhatsAppCosts(tenantId: string, month?: number, year?: number) {
  const now = new Date()
  const targetMonth = month || now.getMonth() + 1
  const targetYear = year || now.getFullYear()
  
  // Buscar uso mensal
  const usage = await prisma.messageUsage.findUnique({
    where: {
      tenant_id_month_year: {
        tenant_id: tenantId,
        month: targetMonth,
        year: targetYear,
      },
    },
  })
  
  // Buscar mensagens detalhadas do mês
  const startDate = new Date(targetYear, targetMonth - 1, 1)
  const endDate = new Date(targetYear, targetMonth, 0, 23, 59, 59)
  
  const messages = await prisma.whatsAppMessage.findMany({
    where: {
      tenant_id: tenantId,
      created_at: {
        gte: startDate,
        lte: endDate,
      },
    },
    orderBy: {
      created_at: 'desc',
    },
  })
  
  // Calcular totais por categoria
  const totalsByCategory = messages.reduce((acc, msg) => {
    if (!acc[msg.category]) {
      acc[msg.category] = { count: 0, cost_usd: 0, cost_brl: 0 }
    }
    acc[msg.category].count++
    acc[msg.category].cost_usd += Number(msg.cost_usd)
    acc[msg.category].cost_brl += Number(msg.cost_brl)
    return acc
  }, {} as Record<string, { count: number; cost_usd: number; cost_brl: number }>)
  
  return {
    month: targetMonth,
    year: targetYear,
    total_messages: usage?.messages_sent || 0,
    total_cost_brl: Number(usage?.total_cost_brl || 0),
    by_category: {
      SERVICE: {
        count: usage?.messages_service || 0,
        cost_brl: totalsByCategory.SERVICE?.cost_brl || 0,
      },
      UTILITY: {
        count: usage?.messages_utility || 0,
        cost_brl: totalsByCategory.UTILITY?.cost_brl || 0,
      },
      MARKETING: {
        count: usage?.messages_marketing || 0,
        cost_brl: totalsByCategory.MARKETING?.cost_brl || 0,
      },
      AUTHENTICATION: {
        count: usage?.messages_auth || 0,
        cost_brl: totalsByCategory.AUTHENTICATION?.cost_brl || 0,
      },
    },
    recent_messages: messages.slice(0, 50), // Últimas 50 mensagens
  }
}

/**
 * Obtém custos de todos os tenants (para admin)
 */
export async function getAllTenantsCosts(month?: number, year?: number) {
  const now = new Date()
  const targetMonth = month || now.getMonth() + 1
  const targetYear = year || now.getFullYear()
  
  const usages = await prisma.messageUsage.findMany({
    where: {
      month: targetMonth,
      year: targetYear,
    },
    include: {
      tenant: {
        select: {
          id: true,
          name: true,
          slug: true,
          plan_type: true,
        },
      },
    },
    orderBy: {
      total_cost_brl: 'desc',
    },
  })
  
  return usages.map((usage) => ({
    tenant_id: usage.tenant_id,
    tenant_name: usage.tenant.name,
    tenant_slug: usage.tenant.slug,
    plan_type: usage.tenant.plan_type,
    total_messages: usage.messages_sent,
    total_cost_brl: Number(usage.total_cost_brl),
    by_category: {
      SERVICE: usage.messages_service,
      UTILITY: usage.messages_utility,
      MARKETING: usage.messages_marketing,
      AUTHENTICATION: usage.messages_auth,
    },
  }))
}
