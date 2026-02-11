import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'

/**
 * API para verificar se Sentry está configurado
 * Apenas para super admin (ryan@dmtn.com.br)
 */
export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthUser(request)
    if (!authUser) {
      return NextResponse.json(
        { success: false, error: 'Não autenticado' },
        { status: 401 }
      )
    }

    // Apenas super admin pode ver
    if (authUser.tenant_id) {
      return NextResponse.json(
        { success: false, error: 'Acesso negado. Apenas super admin.' },
        { status: 403 }
      )
    }

    // Verificar se Sentry está configurado (sem expor o DSN)
    const hasSentryDsn = !!(process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN)
    
    return NextResponse.json({
      success: true,
      configured: hasSentryDsn,
      info: hasSentryDsn 
        ? 'Sentry está configurado e ativo'
        : 'Sentry disponível no código mas não configurado. Veja lib/sentry.ts para ativar.'
    })
  } catch (error) {
    console.error('Erro ao verificar status Sentry:', error)
    return NextResponse.json(
      { success: false, error: 'Erro ao verificar status' },
      { status: 500 }
    )
  }
}
