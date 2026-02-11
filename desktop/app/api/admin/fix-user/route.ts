import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

/**
 * Rota para verificar e corrigir usuário admin@tamboril.com
 * Esta rota verifica se o usuário existe, se a senha está correta, e corrige se necessário
 */
export async function POST(request: NextRequest) {
  try {
    console.log('🔍 Verificando usuário admin@tamboril.com...')

    // Buscar tenant Tamboril Burguer
    const tenant = await prisma.tenant.findFirst({
      where: { slug: 'tamboril-burguer' },
    })

    if (!tenant) {
      return NextResponse.json({
        success: false,
        error: 'Tenant tamboril-burguer não encontrado',
      }, { status: 404 })
    }

    console.log('✅ Tenant encontrado:', tenant.id)

    // Verificar se usuário existe
    let user = await prisma.user.findFirst({
      where: {
        username: 'admin@tamboril.com',
        tenant_id: tenant.id,
      },
    })

    if (!user) {
      console.log('⚠️  Usuário não encontrado, criando...')
      const hashedPassword = await bcrypt.hash('123456', 10)
      user = await prisma.user.create({
        data: {
          tenant_id: tenant.id,
          username: 'admin@tamboril.com',
          password: hashedPassword,
          name: 'Admin Tamboril',
          role: 'admin',
        },
      })
      console.log('✅ Usuário criado!')
    } else {
      console.log('✅ Usuário encontrado:', user.id)
      
      // Verificar se a senha está correta
      const isValid = await bcrypt.compare('123456', user.password)
      if (!isValid) {
        console.log('⚠️  Senha incorreta, atualizando...')
        const hashedPassword = await bcrypt.hash('123456', 10)
        user = await prisma.user.update({
          where: { id: user.id },
          data: { password: hashedPassword },
        })
        console.log('✅ Senha atualizada!')
      } else {
        console.log('✅ Senha está correta')
      }
    }

    // Testar login
    console.log('🧪 Testando login...')
    const testPassword = await bcrypt.compare('123456', user.password)
    if (!testPassword) {
      return NextResponse.json({
        success: false,
        error: 'Erro: Senha não confere após correção',
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Usuário verificado e corrigido com sucesso!',
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role,
        tenant_id: user.tenant_id,
      },
      tenant: {
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
      },
    })
  } catch (error: any) {
    console.error('❌ Erro ao verificar/corrigir usuário:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Erro ao verificar usuário',
        details: error.stack,
      },
      { status: 500 }
    )
  }
}
