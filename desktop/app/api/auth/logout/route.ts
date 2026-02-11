import { NextRequest, NextResponse } from 'next/server'
import { destroySession } from '@/lib/auth-session'

export async function POST(request: NextRequest) {
  try {
    await destroySession()

    return NextResponse.json({
      success: true,
      message: 'Logout realizado com sucesso',
    })
  } catch (error) {
    console.error('Erro no logout:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
