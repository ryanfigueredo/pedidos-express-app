import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Connection pooling configuration
// Para Neon/PostgreSQL, usar connection string com ?pgbouncer=true se disponível
const databaseUrl = process.env.DATABASE_URL || ''

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    datasources: {
      db: {
        url: databaseUrl
      }
    },
    // Connection pool settings
    // Prisma gerencia pooling automaticamente, mas podemos ajustar:
    // - connection_limit: número máximo de conexões (padrão: número de CPUs * 2 + 1)
    // - pool_timeout: timeout para obter conexão do pool (padrão: 10s)
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// Graceful shutdown
if (typeof process !== 'undefined') {
  process.on('beforeExit', async () => {
    await prisma.$disconnect()
  })
}
