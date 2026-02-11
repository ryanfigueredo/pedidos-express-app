import { NextResponse } from 'next/server'
import { getStoreStatus } from '@/lib/store-status'

// GET público - Verificar se loja está aberta
export async function GET() {
  try {
    const status = getStoreStatus()
    return NextResponse.json({
      isOpen: status.isOpen,
      nextOpenTime: status.nextOpenTime,
      message: status.message
    }, { status: 200 })
  } catch (error) {
    // Fallback: loja aberta por padrão
    return NextResponse.json({
      isOpen: true,
      nextOpenTime: null,
      message: null
    }, { status: 200 })
  }
}
