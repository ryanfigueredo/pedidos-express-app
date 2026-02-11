import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth-session'
import { prisma } from '@/lib/prisma'
import { getAllTenantsCosts, getWhatsAppCosts } from '@/lib/whatsapp-costs'

export const dynamic = 'force-dynamic'

/**
 * GET /api/admin/whatsapp-costs
 * Retorna custos de WhatsApp para todos os tenants (super admin)
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Não autenticado' },
        { status: 401 }
      )
    }

    // Verificar se é super admin
    const user = await prisma.user.findUnique({
      where: { id: session.id },
      select: { tenant_id: true },
    })

    if (user?.tenant_id) {
      return NextResponse.json(
        { success: false, error: 'Acesso negado. Apenas super admin.' },
        { status: 403 }
      )
    }

    const searchParams = request.nextUrl.searchParams
    const month = searchParams.get('month') ? parseInt(searchParams.get('month')!) : undefined
    const year = searchParams.get('year') ? parseInt(searchParams.get('year')!) : undefined

    const costs = await getAllTenantsCosts(month, year)

    return NextResponse.json({
      success: true,
      costs,
      month: month || new Date().getMonth() + 1,
      year: year || new Date().getFullYear(),
    })
  } catch (error: any) {
    console.error('[WhatsApp Costs API] Erro:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Erro ao buscar custos' },
      { status: 500 }
    )
  }
}
