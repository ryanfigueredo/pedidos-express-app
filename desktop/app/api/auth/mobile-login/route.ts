import { NextRequest, NextResponse } from 'next/server'
import { verifyCredentials } from '@/lib/auth-session'
import { prisma } from '@/lib/prisma'

/**
 * API de login para apps mobile
 * Retorna as informações do usuário sem criar sessão (cookies não funcionam bem em apps)
 */
export async function POST(request: NextRequest) {
  try {
    // Verificar se Prisma Client está disponível
    if (!prisma) {
      console.error('Prisma Client não está disponível')
      return NextResponse.json(
        { 
          success: false, 
          error: 'Erro de configuração do servidor',
          errorCode: 'PRISMA_NOT_INITIALIZED'
        },
        { status: 500 }
      )
    }

    const body = await request.json()
    const { username, password, email } = body

    // Aceitar username ou email
    const loginIdentifier = username || email

    if (!loginIdentifier || !password) {
      return NextResponse.json(
        { success: false, error: 'Username/Email e senha são obrigatórios' },
        { status: 400 }
      )
    }

    console.log('Tentativa de login:', { loginIdentifier, hasPassword: !!password })

    // Verificar credenciais
    let user
    try {
      user = await verifyCredentials(loginIdentifier, password)
      console.log('Resultado verifyCredentials:', user ? 'Usuário encontrado' : 'Usuário não encontrado ou senha incorreta')
    } catch (verifyError: any) {
      console.error('Erro ao verificar credenciais:', verifyError)
      console.error('Stack:', verifyError?.stack)
      console.error('Código do erro:', verifyError?.code)
      
      // Se for erro de conexão, retornar erro específico
      if (verifyError?.code === 'P1001' || verifyError?.message?.includes('connect')) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Erro de conexão com o banco de dados',
            details: process.env.NODE_ENV !== 'production' ? verifyError.message : undefined
          },
          { status: 500 }
        )
      }
      
      throw verifyError
    }

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Credenciais inválidas' },
        { status: 401 }
      )
    }

    // Buscar informações completas do usuário
    let fullUser: any = null
    try {
      // Verificar se a coluna tenant_id existe
      const columnCheck = await prisma.$queryRawUnsafe<Array<{ column_name: string }>>(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_schema = 'public'
        AND table_name = 'users' 
        AND column_name = 'tenant_id'
        LIMIT 1
      `)
      
      const hasTenantIdColumn = columnCheck.length > 0
      
      if (hasTenantIdColumn) {
        // Coluna existe, usar Prisma normalmente
        fullUser = await prisma.user.findUnique({
          where: { id: user.id },
          select: {
            id: true,
            username: true,
            name: true,
            role: true,
            tenant_id: true,
          },
        })
      } else {
        // Coluna não existe, usar SQL direto
        const users = await prisma.$queryRawUnsafe<Array<{
          id: string
          username: string
          name: string
          role: string
          tenant_id?: string | null
        }>>(`
          SELECT id, username, name, role, tenant_id
          FROM users
          WHERE id = $1
          LIMIT 1
        `, user.id)
        
        fullUser = users[0] || null
      }
    } catch (prismaError: any) {
      console.error('Erro ao buscar usuário no Prisma:', prismaError)
      console.error('Código do erro:', prismaError?.code)
      console.error('Mensagem:', prismaError?.message)
      
      // Se for erro P2022 (coluna não existe), tentar SQL direto
      if (prismaError?.code === 'P2022') {
        try {
          const users = await prisma.$queryRawUnsafe<Array<{
            id: string
            username: string
            name: string
            role: string
          }>>(`
            SELECT id, username, name, role
            FROM users
            WHERE id = $1
            LIMIT 1
          `, user.id)
          
          fullUser = users[0] ? { ...users[0], tenant_id: null } : null
        } catch (sqlError) {
          console.error('Erro ao buscar usuário via SQL direto:', sqlError)
          throw new Error(`Erro ao buscar usuário: ${sqlError}`)
        }
      } else if (prismaError?.code === 'P1001' || prismaError?.code === 'P2021') {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Erro de conexão com o banco de dados',
            details: process.env.NODE_ENV !== 'production' ? prismaError.message : undefined
          },
          { status: 500 }
        )
      } else {
        throw new Error(`Erro ao buscar usuário: ${prismaError.message}`)
      }
    }

    if (!fullUser) {
      console.error('Usuário não encontrado após verificação:', user.id)
      return NextResponse.json(
        { success: false, error: 'Usuário não encontrado' },
        { status: 404 }
      )
    }

    console.log('Login bem-sucedido:', { userId: fullUser.id, username: fullUser.username })

    // Buscar informações do tenant para incluir business_type
    let tenantInfo: any = null
    if (fullUser.tenant_id) {
      try {
        tenantInfo = await prisma.tenant.findUnique({
          where: { id: fullUser.tenant_id },
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
        id: fullUser.id,
        username: fullUser.username,
        name: fullUser.name,
        role: fullUser.role,
        tenant_id: fullUser.tenant_id,
        business_type: tenantInfo?.business_type || 'RESTAURANTE',
        show_prices_on_bot: tenantInfo?.show_prices_on_bot ?? true,
        tenant_name: tenantInfo?.name,
        tenant_slug: tenantInfo?.slug,
      },
    })
  } catch (error: any) {
    console.error('Erro no login mobile:', error)
    // Log detalhado do erro para debug
    console.error('Detalhes do erro:', {
      message: error?.message,
      stack: error?.stack,
      name: error?.name,
      code: error?.code,
    })
    
    // Verificar tipo de erro
    let errorMessage = 'Erro interno do servidor'
    let statusCode = 500
    let errorCode = error?.code
    
    if (error?.code === 'P1001') {
      errorMessage = 'Erro de conexão com o banco de dados. Verifique a configuração do banco.'
    } else if (error?.code === 'P2021') {
      errorMessage = 'Tabela não encontrada no banco de dados. Execute as migrações.'
    } else if (error?.code === 'P2022') {
      errorMessage = 'Coluna não encontrada no banco de dados. Execute as migrações para atualizar o schema.'
    } else if (error?.code === 'P2002') {
      errorMessage = 'Violação de constraint única'
    } else if (error?.message?.includes('PrismaClient')) {
      errorMessage = 'Erro ao inicializar Prisma Client. Verifique se o Prisma foi gerado corretamente.'
    } else if (error?.message) {
      // Em produção, retornar mensagem genérica mas incluir código do erro
      errorMessage = 'Erro interno do servidor'
    }
    
    return NextResponse.json(
      { 
        success: false, 
        error: errorMessage,
        // Sempre incluir código do erro para ajudar no debug
        ...(errorCode && { errorCode }),
        // Detalhes apenas em desenvolvimento
        ...(process.env.NODE_ENV !== 'production' && { 
          details: error?.stack,
          message: error?.message
        })
      },
      { status: statusCode }
    )
  }
}
