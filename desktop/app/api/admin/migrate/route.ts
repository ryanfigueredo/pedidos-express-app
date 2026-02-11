import { NextRequest, NextResponse } from 'next/server'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

/**
 * Rota para aplicar migrações manualmente (apenas em desenvolvimento ou com autenticação)
 * ATENÇÃO: Esta rota deve ser protegida em produção!
 */
export async function POST(request: NextRequest) {
  // Verificar se está em desenvolvimento ou tem autenticação
  if (process.env.NODE_ENV === 'production') {
    // Em produção, verificar autenticação
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.MIGRATE_SECRET || 'change-me-in-production'}`) {
      return NextResponse.json(
        { success: false, error: 'Não autorizado' },
        { status: 401 }
      )
    }
  }

  try {
    console.log('🔄 Aplicando migrações...')
    
    // Aplicar migrações
    const { stdout, stderr } = await execAsync('npx prisma migrate deploy', {
      cwd: process.cwd(),
      env: process.env,
    })

    console.log('✅ Migrações aplicadas:', stdout)
    if (stderr) {
      console.warn('⚠️  Avisos:', stderr)
    }

    return NextResponse.json({
      success: true,
      message: 'Migrações aplicadas com sucesso',
      output: stdout,
    })
  } catch (error: any) {
    console.error('❌ Erro ao aplicar migrações:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Erro ao aplicar migrações',
        details: error.stdout || error.stderr,
      },
      { status: 500 }
    )
  }
}
