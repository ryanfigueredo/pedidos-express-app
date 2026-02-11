import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth-session'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verificar se é super admin
    const session = await getSession()
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Não autenticado' },
        { status: 401 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { id: session.id },
    })

    if (user?.tenant_id) {
      return NextResponse.json(
        { success: false, error: 'Acesso negado. Apenas super admin.' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { is_active } = body

    const tenant = await prisma.tenant.update({
      where: { id: params.id },
      data: { is_active },
    })

    return NextResponse.json({
      success: true,
      tenant: {
        id: tenant.id,
        name: tenant.name,
        is_active: tenant.is_active,
      },
    })
  } catch (error) {
    console.error('Erro ao atualizar tenant:', error)
    return NextResponse.json(
      { success: false, error: 'Erro ao atualizar tenant' },
      { status: 500 }
    )
  }
}
