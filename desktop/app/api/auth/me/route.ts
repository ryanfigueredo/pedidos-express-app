import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth-session'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const user = await getSession()

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Não autenticado' },
        { status: 401 }
      )
    }

    // Buscar informações do tenant para incluir business_type
    let tenantInfo: any = null
    if (user.tenant_id) {
      try {
        tenantInfo = await prisma.tenant.findUnique({
          where: { id: user.tenant_id },
          select: {
            id: true,
            name: true,
            slug: true,
            business_type: true,
            show_prices_on_bot: true,
          },
        })
      } catch (tenantError) {
        console.error('Erro ao buscar tenant:', tenantError)
      }
    }

    return NextResponse.json({
      success: true,
      user: {
        ...user,
        business_type: tenantInfo?.business_type || 'RESTAURANTE',
        show_prices_on_bot: tenantInfo?.show_prices_on_bot ?? true,
        tenant_name: tenantInfo?.name,
        tenant_slug: tenantInfo?.slug,
      },
    })
  } catch (error) {
    console.error('Erro ao verificar sessão:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
