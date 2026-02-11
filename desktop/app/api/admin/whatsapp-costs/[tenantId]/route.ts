import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth-session'
import { prisma } from '@/lib/prisma'
import { getWhatsAppCosts } from '@/lib/whatsapp-costs'

export const dynamic = 'force-dynamic'

/**
 * GET /api/admin/whatsapp-costs/[tenantId]
 * Retorna custos detalhados de um tenant específico
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { tenantId: string } }
) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Não autenticado' },
        { status: 401 }
      )
    }

    // Verificar se é super admin ou se é o próprio tenant
    const user = await prisma.user.findUnique({
      where: { id: session.id },
      select: { tenant_id: true },
    })

    const isSuperAdmin = !user?.tenant_id
    const isOwnTenant = user?.tenant_id === params.tenantId

    if (!isSuperAdmin && !isOwnTenant) {
      return NextResponse.json(
        { success: false, error: 'Acesso negado' },
        { status: 403 }
      )
    }

    const searchParams = request.nextUrl.searchParams
    const month = searchParams.get('month') ? parseInt(searchParams.get('month')!) : undefined
    const year = searchParams.get('year') ? parseInt(searchParams.get('year')!) : undefined

    const costs = await getWhatsAppCosts(params.tenantId, month, year)

    return NextResponse.json({
      success: true,
      costs,
    })
  } catch (error: any) {
    console.error('[WhatsApp Costs API] Erro:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Erro ao buscar custos' },
      { status: 500 }
    )
  }
}
