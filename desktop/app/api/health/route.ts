import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * Health check endpoint para verificar se a API e banco estão funcionando
 */
export async function GET() {
  try {
    // Testar conexão com banco
    await prisma.$queryRaw`SELECT 1`
    
    // Verificar se tabelas existem
    const tables = await prisma.$queryRaw<Array<{ tablename: string }>>`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public'
    `
    
    const tableNames = tables.map(t => t.tablename)
    const hasTenants = tableNames.includes('tenants')
    const hasUsers = tableNames.includes('users')
    const hasOrders = tableNames.includes('orders')
    
    return NextResponse.json({
      status: 'ok',
      database: 'connected',
      tables: {
        tenants: hasTenants,
        users: hasUsers,
        orders: hasOrders,
        all: hasTenants && hasUsers && hasOrders
      },
      timestamp: new Date().toISOString()
    })
  } catch (error: any) {
    console.error('Health check failed:', error)
    return NextResponse.json(
      {
        status: 'error',
        database: 'disconnected',
        error: error?.message || 'Unknown error',
        code: error?.code,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}
