import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'
import { getMessageUsageStats } from '@/lib/message-limits'

export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthUser(request)
    if (!authUser) {
      return NextResponse.json(
        { success: false, error: 'Não autenticado' },
        { status: 401 }
      )
    }

    // Super admin vê todos, tenant admin vê apenas seu próprio
    const tenantId = authUser.tenant_id

    if (tenantId) {
      // Tenant admin - apenas seu próprio uso
      const stats = await getMessageUsageStats(tenantId)
      return NextResponse.json({
        success: true,
        usage: [stats]
      })
    } else {
      // Super admin - todos os tenants
      const tenants = await prisma.tenant.findMany({
        where: { is_active: true },
        select: { id: true, name: true }
      })

      const usageStats = await Promise.all(
        tenants.map(async (tenant) => {
          const stats = await getMessageUsageStats(tenant.id)
          return {
            ...stats,
            tenant_id: tenant.id,
            tenant_name: tenant.name
          }
        })
      )

      return NextResponse.json({
        success: true,
        usage: usageStats
      })
    }
  } catch (error) {
    console.error('Erro ao buscar uso de mensagens:', error)
    return NextResponse.json(
      { success: false, error: 'Erro ao buscar uso' },
      { status: 500 }
    )
  }
}
