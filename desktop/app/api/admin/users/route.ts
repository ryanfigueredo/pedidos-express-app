import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth-session'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
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
    const { tenant_id, username, password, name } = body

    if (!tenant_id || !username || !password) {
      return NextResponse.json(
        { success: false, error: 'tenant_id, username e password são obrigatórios' },
        { status: 400 }
      )
    }

    // Verificar se tenant existe
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenant_id },
    })

    if (!tenant) {
      return NextResponse.json(
        { success: false, error: 'Tenant não encontrado' },
        { status: 404 }
      )
    }

    // Verificar se username já existe para este tenant
    const existingUser = await prisma.user.findUnique({
      where: {
        tenant_id_username: {
          tenant_id,
          username,
        },
      },
    })

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'Username já existe para este tenant' },
        { status: 400 }
      )
    }

    // Criar usuário
    const hashedPassword = await bcrypt.hash(password, 10)
    const newUser = await prisma.user.create({
      data: {
        tenant_id,
        username,
        password: hashedPassword,
        name: name || username,
        role: 'admin',
      },
    })

    return NextResponse.json({
      success: true,
      user: {
        id: newUser.id,
        username: newUser.username,
        name: newUser.name,
      },
    })
  } catch (error) {
    console.error('Erro ao criar usuário:', error)
    return NextResponse.json(
      { success: false, error: 'Erro ao criar usuário' },
      { status: 500 }
    )
  }
}
