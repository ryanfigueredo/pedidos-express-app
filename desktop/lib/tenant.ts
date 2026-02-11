import { prisma } from './prisma'
import crypto from 'crypto'

export interface TenantInfo {
  id: string
  name: string
  slug: string
  api_key: string
  whatsapp_phone?: string | null
  is_active: boolean
}

/**
 * Obtém tenant pelo API key
 */
export async function getTenantByApiKey(apiKey: string): Promise<TenantInfo | null> {
  try {
    const tenant = await prisma.tenant.findUnique({
      where: { api_key: apiKey },
      select: {
        id: true,
        name: true,
        slug: true,
        api_key: true,
        whatsapp_phone: true,
        is_active: true,
      },
    })

    if (!tenant || !tenant.is_active) {
      return null
    }

    return tenant
  } catch (error) {
    console.error('Erro ao buscar tenant por API key:', error)
    return null
  }
}

/**
 * Obtém tenant pelo slug
 */
export async function getTenantBySlug(slug: string): Promise<TenantInfo | null> {
  try {
    const tenant = await prisma.tenant.findUnique({
      where: { slug },
      select: {
        id: true,
        name: true,
        slug: true,
        api_key: true,
        whatsapp_phone: true,
        is_active: true,
      },
    })

    if (!tenant || !tenant.is_active) {
      return null
    }

    return tenant
  } catch (error) {
    console.error('Erro ao buscar tenant por slug:', error)
    return null
  }
}

/**
 * Obtém tenant pelo ID
 */
export async function getTenantById(id: string): Promise<TenantInfo | null> {
  try {
    const tenant = await prisma.tenant.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        slug: true,
        api_key: true,
        whatsapp_phone: true,
        is_active: true,
      },
    })

    if (!tenant || !tenant.is_active) {
      return null
    }

    return tenant
  } catch (error) {
    console.error('Erro ao buscar tenant por ID:', error)
    return null
  }
}

/**
 * Cria um novo tenant
 */
export async function createTenant(data: {
  name: string
  slug: string
  api_key?: string
  whatsapp_phone?: string
}): Promise<TenantInfo> {
  // Gerar API key se não fornecida
  const apiKey = data.api_key || generateApiKey()

  const tenant = await prisma.tenant.create({
    data: {
      name: data.name,
      slug: data.slug,
      api_key: apiKey,
      whatsapp_phone: data.whatsapp_phone,
      is_active: true,
    },
    select: {
      id: true,
      name: true,
      slug: true,
      api_key: true,
      whatsapp_phone: true,
      is_active: true,
    },
  })

  return tenant
}

/**
 * Gera uma API key única
 */
function generateApiKey(): string {
  return crypto.randomBytes(32).toString('hex')
}

/**
 * Lista todos os tenants ativos
 */
export async function listTenants(): Promise<TenantInfo[]> {
  const tenants = await prisma.tenant.findMany({
    where: { is_active: true },
    select: {
      id: true,
      name: true,
      slug: true,
      api_key: true,
      whatsapp_phone: true,
      is_active: true,
    },
    orderBy: { created_at: 'desc' },
  })

  return tenants
}
