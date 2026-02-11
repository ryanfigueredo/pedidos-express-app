import { NextRequest, NextResponse } from 'next/server'
import { validateApiKey, validateBasicAuth } from '@/lib/auth'
import { getSession } from '@/lib/auth-session'
import { getStoreStatus, updateStoreStatus } from '@/lib/store-status'

// GET - Obter status atual da loja
export async function GET(request: NextRequest) {
  // Permitir acesso via sessão (web), API key (app) ou Basic Auth (app mobile)
  const session = await getSession()
  const authValidation = await validateApiKey(request)
  const basicAuth = await validateBasicAuth(request)
  
  if (!session && !authValidation.isValid && !basicAuth.isValid) {
    return NextResponse.json(
      { error: 'Não autenticado' },
      { status: 401 }
    )
  }

  const status = getStoreStatus()
  return NextResponse.json({ status }, { status: 200 })
}

// POST - Atualizar status da loja (abrir/fechar)
export async function POST(request: NextRequest) {
  // Permitir acesso via sessão (web), API key (app) ou Basic Auth (app mobile)
  const session = await getSession()
  const authValidation = await validateApiKey(request)
  const basicAuth = await validateBasicAuth(request)
  
  if (!session && !authValidation.isValid && !basicAuth.isValid) {
    return NextResponse.json(
      { error: 'Não autenticado' },
      { status: 401 }
    )
  }

  try {
    const body = await request.json()
    const { isOpen, nextOpenTime, message } = body

    if (typeof isOpen !== 'boolean') {
      return NextResponse.json(
        { message: 'isOpen deve ser um boolean' },
        { status: 400 }
      )
    }

    // Atualizar status
    const updatedStatus = updateStoreStatus({ isOpen, nextOpenTime, message })

    return NextResponse.json({
      success: true,
      status: updatedStatus
    }, { status: 200 })
  } catch (error) {
    console.error('Erro ao atualizar status da loja:', error)
    return NextResponse.json(
      { message: 'Erro ao atualizar status', error: String(error) },
      { status: 500 }
    )
  }
}
