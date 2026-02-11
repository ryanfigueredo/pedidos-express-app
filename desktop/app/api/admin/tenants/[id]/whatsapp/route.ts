import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verificar se é super admin
    const authUser = await getAuthUser(request)
    if (!authUser) {
      return NextResponse.json(
        { success: false, error: 'Não autenticado' },
        { status: 401 }
      )
    }

    if (authUser.tenant_id) {
      return NextResponse.json(
        { success: false, error: 'Acesso negado. Apenas super admin.' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { 
      whatsapp_phone, 
      meta_phone_number_id, 
      meta_access_token, 
      meta_verify_token 
    } = body

    // Validar campos obrigatórios
    if (!whatsapp_phone || !meta_phone_number_id || !meta_access_token) {
      return NextResponse.json(
        { success: false, error: 'Telefone, Phone Number ID e Access Token são obrigatórios' },
        { status: 400 }
      )
    }

    // Atualizar tenant com configurações do WhatsApp
    const tenant = await prisma.tenant.update({
      where: { id: params.id },
      data: {
        whatsapp_phone: whatsapp_phone.replace(/\D/g, ''),
        meta_phone_number_id,
        meta_access_token, // Em produção, considerar criptografar
        meta_verify_token: meta_verify_token || undefined,
        bot_configured: true,
        bot_last_heartbeat: new Date(),
      },
    })

    return NextResponse.json({
      success: true,
      tenant: {
        id: tenant.id,
        name: tenant.name,
        whatsapp_phone: tenant.whatsapp_phone,
        bot_configured: tenant.bot_configured,
      },
    })
  } catch (error) {
    console.error('Erro ao atualizar configuração WhatsApp:', error)
    return NextResponse.json(
      { success: false, error: 'Erro ao atualizar configuração' },
      { status: 500 }
    )
  }
}
