import { cookies } from 'next/headers'
import { prisma } from './prisma'
import bcrypt from 'bcryptjs'

export interface SessionUser {
  id: string
  username: string
  name: string
  role: string
  tenant_id?: string | null
}

/**
 * Cria uma sessão para o usuário
 */
export async function createSession(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      username: true,
      name: true,
      role: true,
      tenant_id: true,
    },
  })

  if (!user) {
    return null
  }

  // Armazena dados do usuário no cookie
  const cookieStore = await cookies()
  cookieStore.set('session', JSON.stringify(user), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 dias
    path: '/',
  })

  return user as SessionUser
}

/**
 * Obtém o usuário da sessão atual
 */
export async function getSession(): Promise<SessionUser | null> {
  try {
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get('session')

    if (!sessionCookie?.value) {
      return null
    }

    const user = JSON.parse(sessionCookie.value) as SessionUser
    return user
  } catch (error) {
    return null
  }
}

/**
 * Remove a sessão do usuário
 */
export async function destroySession() {
  const cookieStore = await cookies()
  cookieStore.delete('session')
}

/**
 * Verifica credenciais de login
 * Busca o usuário em todos os tenants (ou sem tenant para super admin)
 */
export async function verifyCredentials(
  username: string,
  password: string
): Promise<SessionUser | null> {
  try {
    // Tentar buscar usuário normalmente primeiro
    let user: any = null
    
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
        user = await prisma.user.findFirst({
          where: { username },
        })
      } else {
        // Coluna não existe, usar SQL direto
        const users = await prisma.$queryRawUnsafe<Array<{
          id: string
          username: string
          name: string
          role: string
          password: string
          tenant_id?: string | null
        }>>(`
          SELECT id, username, name, role, password, tenant_id
          FROM users
          WHERE username = $1
          LIMIT 1
        `, username)
        
        user = users[0] || null
      }
    } catch (queryError: any) {
      // Se der erro P2022 (coluna não existe), tentar SQL direto
      if (queryError?.code === 'P2022') {
        console.log('Coluna tenant_id não existe, usando SQL direto...')
        const users = await prisma.$queryRawUnsafe<Array<{
          id: string
          username: string
          name: string
          role: string
          password: string
        }>>(`
          SELECT id, username, name, role, password
          FROM users
          WHERE username = $1
          LIMIT 1
        `, username)
        
        user = users[0] || null
      } else {
        throw queryError
      }
    }

    if (!user) {
      console.log('❌ Usuário não encontrado para username:', username)
      return null
    }

    console.log('✅ Usuário encontrado:', { id: user.id, username: user.username, role: user.role })

    // Verificar senha
    try {
      const isValid = await bcrypt.compare(password, user.password)
      console.log('🔐 Verificação de senha:', isValid ? '✅ Senha correta' : '❌ Senha incorreta')
      if (!isValid) {
        return null
      }
    } catch (bcryptError) {
      console.error('Erro ao comparar senha:', bcryptError)
      return null
    }

    return {
      id: user.id,
      username: user.username,
      name: user.name,
      role: user.role,
      tenant_id: user.tenant_id || null,
    }
  } catch (error) {
    console.error('Erro ao verificar credenciais:', error)
    throw error // Re-throw para ser capturado pela rota
  }
}

/**
 * Cria hash de senha
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10)
}
