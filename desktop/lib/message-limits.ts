import { prisma } from './prisma'

export type PlanType = 'basic' | 'complete' | 'premium'

export interface PlanLimits {
  messages: number
  name: string
}

export const PLAN_LIMITS: Record<PlanType, PlanLimits> = {
  basic: {
    messages: 1000,
    name: 'Básico'
  },
  complete: {
    messages: 2500,
    name: 'Completo'
  },
  premium: {
    messages: -1, // -1 = ilimitado
    name: 'Premium'
  }
}

export interface MessageLimitCheck {
  allowed: boolean
  current: number
  limit: number
  plan: PlanType
  planName: string
  percentage: number
  remaining: number
}

/**
 * Verifica se o tenant pode enviar mais mensagens
 */
export async function checkMessageLimit(tenantId: string): Promise<MessageLimitCheck> {
  // Buscar tenant e plano
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: {
      plan_type: true,
      plan_message_limit: true
    }
  })

  if (!tenant) {
    throw new Error('Tenant não encontrado')
  }

  const planType = (tenant.plan_type || 'basic') as PlanType
  const planLimit = PLAN_LIMITS[planType]

  // Premium = ilimitado
  if (planType === 'premium' || planLimit.messages === -1) {
    return {
      allowed: true,
      current: 0,
      limit: -1,
      plan: planType,
      planName: planLimit.name,
      percentage: 0,
      remaining: -1
    }
  }

  // Buscar uso do mês atual
  const now = new Date()
  const month = now.getMonth() + 1
  const year = now.getFullYear()

  const usage = await prisma.messageUsage.findUnique({
    where: {
      tenant_id_month_year: {
        tenant_id: tenantId,
        month,
        year
      }
    }
  })

  const current = usage?.messages_sent || 0
  const limit = tenant.plan_message_limit || planLimit.messages
  const allowed = current < limit
  const remaining = Math.max(0, limit - current)
  const percentage = limit > 0 ? Math.round((current / limit) * 100) : 0

  return {
    allowed,
    current,
    limit,
    plan: planType,
    planName: planLimit.name,
    percentage,
    remaining
  }
}

/**
 * Incrementa o contador de mensagens enviadas
 */
export async function incrementMessageUsage(tenantId: string, count: number = 1): Promise<void> {
  const now = new Date()
  const month = now.getMonth() + 1
  const year = now.getFullYear()

  await prisma.messageUsage.upsert({
    where: {
      tenant_id_month_year: {
        tenant_id: tenantId,
        month,
        year
      }
    },
    update: {
      messages_sent: {
        increment: count
      }
    },
    create: {
      tenant_id: tenantId,
      month,
      year,
      messages_sent: count,
      conversations_started: 0
    }
  })
}

/**
 * Obtém estatísticas de uso de mensagens
 */
export async function getMessageUsageStats(tenantId: string) {
  const now = new Date()
  const month = now.getMonth() + 1
  const year = now.getFullYear()

  const usage = await prisma.messageUsage.findUnique({
    where: {
      tenant_id_month_year: {
        tenant_id: tenantId,
        month,
        year
      }
    }
  })

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: {
      plan_type: true,
      plan_message_limit: true
    }
  })

  const planType = (tenant?.plan_type || 'basic') as PlanType
  const planLimit = PLAN_LIMITS[planType]
  const limit = tenant?.plan_message_limit || planLimit.messages

  const current = usage?.messages_sent || 0
  const remaining = limit === -1 ? -1 : Math.max(0, limit - current)
  const percentage = limit === -1 ? 0 : Math.round((current / limit) * 100)

  return {
    current,
    limit,
    remaining,
    percentage,
    plan: planType,
    planName: planLimit.name,
    month,
    year
  }
}
