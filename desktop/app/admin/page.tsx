'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Building2, ArrowRight, DollarSign } from 'lucide-react'

interface Tenant {
  id: string
  name: string
  slug: string
  is_active: boolean
  created_at: string
  _count?: {
    orders: number
    users: number
  }
}

interface BotStatus {
  tenant_id: string
  tenant_name: string
  is_online: boolean
  last_heartbeat?: string
  total_orders_today: number
  total_orders_month: number
}

interface MessageUsage {
  current: number
  limit: number
  remaining: number
  percentage: number
  plan: string
  planName: string
  month: number
  year: number
  tenant_id?: string
  tenant_name?: string
}

export default function AdminPage() {
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [botStatuses, setBotStatuses] = useState<BotStatus[]>([])
  const [messageUsage, setMessageUsage] = useState<MessageUsage[]>([])
  const [loading, setLoading] = useState(true)
  const [sentryConfigured, setSentryConfigured] = useState<boolean | null>(null)

  useEffect(() => {
    loadData()
    // Atualizar a cada 30 segundos
    const interval = setInterval(loadData, 30000)
    return () => clearInterval(interval)
  }, [])

  const loadData = async () => {
    try {
      // Carregar tenants
      const tenantsRes = await fetch('/api/admin/tenants')
      const tenantsData = await tenantsRes.json()
      if (tenantsData.success) {
        setTenants(tenantsData.tenants || [])
      }

      // Carregar status dos bots
      const botsRes = await fetch('/api/admin/bot-status')
      const botsData = await botsRes.json()
      if (botsData.success) {
        setBotStatuses(botsData.bots || [])
      }

      // Carregar uso de mensagens
      const usageRes = await fetch('/api/admin/message-usage')
      const usageData = await usageRes.json()
      if (usageData.success) {
        setMessageUsage(usageData.usage || [])
      }

      // Verificar se Sentry está configurado (apenas para super admin)
      try {
        const sentryRes = await fetch('/api/admin/sentry-status')
        const sentryData = await sentryRes.json()
        if (sentryData.success) {
          setSentryConfigured(sentryData.configured)
        }
      } catch (error) {
        // Ignorar erro, não é crítico
        setSentryConfigured(false)
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900 font-display mb-2">Dashboard Master</h1>
              <p className="text-sm text-gray-500">Visão geral de todos os clientes</p>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/admin/custos-whatsapp"
                className="inline-flex items-center gap-2 bg-green-600 text-white px-4 py-2.5 rounded-lg font-semibold hover:bg-green-700 transition-colors shadow-sm hover:shadow-md"
              >
                <DollarSign size={18} />
                Custos WhatsApp
              </Link>
              <Link
                href="/admin/clientes"
                className="inline-flex items-center gap-2 bg-primary-600 text-white px-4 py-2.5 rounded-lg font-semibold hover:bg-primary-700 transition-colors shadow-sm hover:shadow-md"
              >
                <Building2 size={18} />
                Gerenciar Clientes
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            <p className="mt-4 text-gray-600">Carregando...</p>
          </div>
        ) : (
          <>
            {/* Aviso Sentry (apenas para super admin) */}
            {sentryConfigured === false && (
              <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6 rounded-r-lg">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3 flex-1">
                    <h3 className="text-sm font-medium text-blue-800">
                      💡 Monitoramento de Erros Disponível
                    </h3>
                    <div className="mt-2 text-sm text-blue-700">
                      <p>
                        O código do <strong>Sentry</strong> está disponível no sistema para monitoramento avançado de erros.
                        Para ativar no futuro:
                      </p>
                      <ul className="list-disc list-inside mt-2 space-y-1">
                        <li>Criar conta gratuita em <a href="https://sentry.io" target="_blank" rel="noopener noreferrer" className="underline">sentry.io</a> (5.000 eventos/mês grátis)</li>
                        <li>Adicionar <code className="bg-blue-100 px-1 rounded">SENTRY_DSN</code> nas variáveis de ambiente do Vercel</li>
                        <li>Instalar: <code className="bg-blue-100 px-1 rounded">npm install @sentry/nextjs</code></li>
                      </ul>
                      <p className="mt-2 text-xs text-blue-600">
                        📁 Código em: <code className="bg-blue-100 px-1 rounded">lib/sentry.ts</code>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Stats Cards */}
            <div className="grid md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="text-2xl font-bold text-gray-900">{tenants.length}</div>
                <div className="text-sm text-gray-500">Total de Clientes</div>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <div className="text-2xl font-bold text-primary-600">
                  {botStatuses.filter(b => b.is_online).length}
                </div>
                <div className="text-sm text-gray-500">Bots Online</div>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <div className="text-2xl font-bold text-red-600">
                  {botStatuses.filter(b => !b.is_online).length}
                </div>
                <div className="text-sm text-gray-500">Bots Offline</div>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <div className="text-2xl font-bold text-blue-600">
                  {botStatuses.reduce((sum, b) => sum + b.total_orders_today, 0)}
                </div>
                <div className="text-sm text-gray-500">Pedidos Hoje</div>
              </div>
            </div>

            {/* Tenants Table */}
            <div className="bg-white rounded-lg shadow mb-8">
              <div className="px-6 py-4 border-b">
                <h2 className="text-xl font-bold text-gray-900 font-display">Clientes (Tenants)</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nome</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Slug</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pedidos</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Criado em</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {tenants.map((tenant) => {
                      const botStatus = botStatuses.find(b => b.tenant_id === tenant.id)
                      return (
                        <tr key={tenant.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="font-medium text-gray-900">{tenant.name}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-gray-500">{tenant.slug}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                              tenant.is_active 
                                ? 'bg-primary-100 text-primary-700' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {tenant.is_active ? 'Ativo' : 'Inativo'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                            {tenant._count?.orders || 0}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                            {new Date(tenant.created_at).toLocaleDateString('pt-BR')}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Bot Status */}
            <div className="bg-white rounded-lg shadow mb-8">
              <div className="px-6 py-4 border-b">
                <h2 className="text-xl font-bold text-gray-900 font-display">Status dos Bots WhatsApp</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cliente</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pedidos Hoje</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pedidos Mês</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Última Atividade</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {botStatuses.map((bot) => {
                      const usage = messageUsage.find(u => {
                        const tenant = tenants.find(t => t.id === bot.tenant_id)
                        return tenant // Match por tenant_id quando implementado
                      })
                      return (
                        <tr key={bot.tenant_id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                            {bot.tenant_name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className={`w-3 h-3 rounded-full mr-2 ${
                                bot.is_online ? 'bg-green-500 animate-pulse' : 'bg-red-500'
                              }`}></div>
                              <span className={bot.is_online ? 'text-green-600 font-semibold' : 'text-red-600'}>
                                {bot.is_online ? 'Online' : 'Offline'}
                              </span>
                              {!bot.is_online && (
                                <span className="ml-2 text-xs text-red-500">⚠️ Verificar</span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                            {bot.total_orders_today}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                            {bot.total_orders_month}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                            {bot.last_heartbeat 
                              ? new Date(bot.last_heartbeat).toLocaleString('pt-BR')
                              : 'Nunca'
                            }
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Message Usage */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b">
                <h2 className="text-xl font-bold text-gray-900 font-display">Uso de Mensagens WhatsApp</h2>
                <p className="text-sm text-gray-500 mt-1">Monitoramento de limites por plano</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cliente</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Plano</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Usado</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Limite</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Progresso</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {messageUsage.map((usage) => {
                      const tenant = usage.tenant_id 
                        ? tenants.find(t => t.id === usage.tenant_id)
                        : null
                      const isWarning = usage.percentage >= 80 && usage.percentage < 100
                      const isCritical = usage.percentage >= 100
                      const isUnlimited = usage.limit === -1
                      return (
                        <tr key={usage.tenant_id || 'unknown'} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                            {usage.tenant_name || tenant?.name || 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-2 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
                              {usage.planName}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-gray-500 font-medium">
                            {usage.current}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                            {isUnlimited ? '∞' : usage.limit}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 bg-gray-200 rounded-full h-2">
                                <div
                                  className={`h-2 rounded-full ${
                                    isCritical
                                      ? 'bg-red-500'
                                      : isWarning
                                      ? 'bg-yellow-500'
                                      : 'bg-green-500'
                                  }`}
                                  style={{ width: `${Math.min(usage.percentage, 100)}%` }}
                                ></div>
                              </div>
                              <span className="text-xs text-gray-500 w-12 text-right">
                                {usage.percentage}%
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {isCritical ? (
                              <span className="text-xs font-semibold text-red-600">⚠️ Limite Excedido</span>
                            ) : isWarning ? (
                              <span className="text-xs font-semibold text-yellow-600">⚠️ Próximo do Limite</span>
                            ) : isUnlimited ? (
                              <span className="text-xs text-green-600">✓ Ilimitado</span>
                            ) : (
                              <span className="text-xs text-green-600">✓ OK</span>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
