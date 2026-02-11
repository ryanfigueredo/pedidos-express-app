"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, DollarSign, TrendingUp, AlertTriangle, CheckCircle2, MessageSquare, BarChart3 } from "lucide-react";

interface CostByCategory {
  SERVICE: { count: number; cost_brl: number };
  UTILITY: { count: number; cost_brl: number };
  MARKETING: { count: number; cost_brl: number };
  AUTHENTICATION: { count: number; cost_brl: number };
}

interface TenantCost {
  tenant_id: string;
  tenant_name: string;
  tenant_slug: string;
  plan_type: string;
  total_messages: number;
  total_cost_brl: number;
  by_category: {
    SERVICE: number;
    UTILITY: number;
    MARKETING: number;
    AUTHENTICATION: number;
  };
}

interface DetailedCosts {
  month: number;
  year: number;
  total_messages: number;
  total_cost_brl: number;
  by_category: CostByCategory;
  recent_messages: Array<{
    id: string;
    to_phone: string;
    category: string;
    cost_brl: number;
    created_at: string;
  }>;
}

export default function CustosWhatsAppPage() {
  const [tenantsCosts, setTenantsCosts] = useState<TenantCost[]>([]);
  const [selectedTenant, setSelectedTenant] = useState<string | null>(null);
  const [detailedCosts, setDetailedCosts] = useState<DetailedCosts | null>(null);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [totalCost, setTotalCost] = useState(0);
  const [totalMessages, setTotalMessages] = useState(0);

  useEffect(() => {
    loadCosts();
  }, [month, year]);

  const loadCosts = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/whatsapp-costs?month=${month}&year=${year}`);
      const data = await res.json();
      
      if (data.success) {
        setTenantsCosts(data.costs || []);
        const total = (data.costs || []).reduce((sum: number, t: TenantCost) => sum + t.total_cost_brl, 0);
        const totalMsg = (data.costs || []).reduce((sum: number, t: TenantCost) => sum + t.total_messages, 0);
        setTotalCost(total);
        setTotalMessages(totalMsg);
      }
    } catch (error) {
      console.error("Erro ao carregar custos:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadTenantDetails = async (tenantId: string) => {
    try {
      const res = await fetch(`/api/admin/whatsapp-costs/${tenantId}?month=${month}&year=${year}`);
      const data = await res.json();
      if (data.success) {
        setDetailedCosts(data.costs);
        setSelectedTenant(tenantId);
      }
    } catch (error) {
      console.error("Erro ao carregar detalhes:", error);
    }
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      SERVICE: "Serviço",
      UTILITY: "Utilidade",
      MARKETING: "Marketing",
      AUTHENTICATION: "Autenticação",
    };
    return labels[category] || category;
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      SERVICE: "bg-green-100 text-green-800",
      UTILITY: "bg-blue-100 text-blue-800",
      MARKETING: "bg-purple-100 text-purple-800",
      AUTHENTICATION: "bg-yellow-100 text-yellow-800",
    };
    return colors[category] || "bg-gray-100 text-gray-800";
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const getPlanName = (plan: string) => {
    const names: Record<string, string> = {
      basic: "Básico",
      complete: "Completo",
      premium: "Premium",
    };
    return names[plan] || plan;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/admin"
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft size={20} />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 font-display">
                  Custos WhatsApp
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                  Monitoramento de custos por categoria e tenant
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <select
                value={month}
                onChange={(e) => setMonth(parseInt(e.target.value))}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                  <option key={m} value={m}>
                    {new Date(2024, m - 1).toLocaleDateString("pt-BR", {
                      month: "long",
                    })}
                  </option>
                ))}
              </select>
              <input
                type="number"
                value={year}
                onChange={(e) => setYear(parseInt(e.target.value))}
                className="w-24 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                min="2024"
                max="2030"
              />
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
            {/* Alertas de Uso Excessivo */}
            {tenantsCosts.some((t) => {
              const thresholds: Record<string, number> = {
                basic: 50,
                complete: 100,
                premium: 200,
              };
              return t.total_cost_brl > (thresholds[t.plan_type] || 50);
            }) && (
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6 rounded-r-lg">
                <div className="flex items-start">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 mr-3" />
                  <div>
                    <h3 className="text-sm font-medium text-yellow-800">
                      Alertas de Uso Excessivo
                    </h3>
                    <p className="mt-1 text-sm text-yellow-700">
                      Alguns clientes estão com custos acima do recomendado para seus planos.
                      Considere entrar em contato para otimização ou upgrade de plano.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Stats Cards */}
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Custo Total</p>
                    <p className="text-3xl font-bold text-gray-900">
                      {formatCurrency(totalCost)}
                    </p>
                  </div>
                  <DollarSign size={32} className="text-green-600" />
                </div>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Total de Mensagens</p>
                    <p className="text-3xl font-bold text-gray-900">
                      {totalMessages.toLocaleString("pt-BR")}
                    </p>
                  </div>
                  <MessageSquare size={32} className="text-blue-600" />
                </div>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Custo Médio/Mensagem</p>
                    <p className="text-3xl font-bold text-gray-900">
                      {totalMessages > 0
                        ? formatCurrency(totalCost / totalMessages)
                        : formatCurrency(0)}
                    </p>
                  </div>
                  <BarChart3 size={32} className="text-purple-600" />
                </div>
              </div>
            </div>

            {/* Tenants Costs Table */}
            <div className="bg-white rounded-lg shadow mb-8">
              <div className="px-6 py-4 border-b">
                <h2 className="text-xl font-bold text-gray-900 font-display">
                  Custos por Cliente
                </h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Cliente
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Plano
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Mensagens
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Custo Total
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Por Categoria
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {tenantsCosts.map((tenant) => {
                      // Alertas baseados no plano
                      const costThresholds: Record<string, number> = {
                        basic: 50, // R$ 50 para Básico
                        complete: 100, // R$ 100 para Completo
                        premium: 200, // R$ 200 para Premium
                      };
                      const threshold = costThresholds[tenant.plan_type] || 50;
                      const hasHighCost = tenant.total_cost_brl > threshold;
                      const costPercentage = threshold > 0 ? (tenant.total_cost_brl / threshold) * 100 : 0;
                      const isCritical = costPercentage > 150; // >150% do threshold
                      
                      return (
                        <tr
                          key={tenant.tenant_id}
                          className={`hover:bg-gray-50 ${
                            isCritical
                              ? "bg-red-50 border-l-4 border-red-500"
                              : hasHighCost
                              ? "bg-yellow-50 border-l-4 border-yellow-500"
                              : ""
                          }`}
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="font-medium text-gray-900">
                              {tenant.tenant_name}
                            </div>
                            <div className="text-sm text-gray-500">{tenant.tenant_slug}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-2 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
                              {getPlanName(tenant.plan_type)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-gray-900 font-medium">
                            {tenant.total_messages.toLocaleString("pt-BR")}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <span
                                className={`font-bold ${
                                  isCritical
                                    ? "text-red-600"
                                    : hasHighCost
                                    ? "text-yellow-600"
                                    : "text-gray-900"
                                }`}
                              >
                                {formatCurrency(tenant.total_cost_brl)}
                              </span>
                              {isCritical && (
                                <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded text-xs font-semibold">
                                  ⚠️ Crítico
                                </span>
                              )}
                              {hasHighCost && !isCritical && (
                                <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded text-xs font-semibold">
                                  ⚠️ Atenção
                                </span>
                              )}
                            </div>
                            {hasHighCost && (
                              <div className="text-xs text-gray-500 mt-1">
                                {costPercentage.toFixed(0)}% do limite recomendado
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-wrap gap-1">
                              {Object.entries(tenant.by_category).map(([cat, count]) => (
                                <span
                                  key={cat}
                                  className={`px-2 py-1 rounded text-xs ${getCategoryColor(
                                    cat
                                  )}`}
                                >
                                  {getCategoryLabel(cat)}: {count}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <button
                              onClick={() => loadTenantDetails(tenant.tenant_id)}
                              className="text-primary-600 hover:text-primary-700 font-medium text-sm"
                            >
                              Ver Detalhes
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Detailed View */}
            {selectedTenant && detailedCosts && (
              <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b flex items-center justify-between">
                  <h2 className="text-xl font-bold text-gray-900 font-display">
                    Detalhes - {tenantsCosts.find((t) => t.tenant_id === selectedTenant)?.tenant_name}
                  </h2>
                  <button
                    onClick={() => {
                      setSelectedTenant(null);
                      setDetailedCosts(null);
                    }}
                    className="text-gray-600 hover:text-gray-900"
                  >
                    ✕
                  </button>
                </div>
                <div className="p-6">
                  {/* Summary by Category */}
                  <div className="grid md:grid-cols-4 gap-4 mb-6">
                    {Object.entries(detailedCosts.by_category).map(([cat, data]) => (
                      <div
                        key={cat}
                        className={`p-4 rounded-lg border-2 ${getCategoryColor(cat).replace(
                          "bg-",
                          "border-"
                        )}`}
                      >
                        <p className="text-sm text-gray-600 mb-1">
                          {getCategoryLabel(cat)}
                        </p>
                        <p className="text-2xl font-bold text-gray-900">
                          {data.count.toLocaleString("pt-BR")}
                        </p>
                        <p className="text-sm text-gray-500 mt-1">
                          {formatCurrency(data.cost_brl)}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Recent Messages */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Últimas Mensagens
                    </h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">
                              Data/Hora
                            </th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">
                              Destino
                            </th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">
                              Categoria
                            </th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">
                              Custo
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {detailedCosts.recent_messages.map((msg) => (
                            <tr key={msg.id} className="hover:bg-gray-50">
                              <td className="px-4 py-2 text-gray-600">
                                {new Date(msg.created_at).toLocaleString("pt-BR")}
                              </td>
                              <td className="px-4 py-2 text-gray-900">{msg.to_phone}</td>
                              <td className="px-4 py-2">
                                <span
                                  className={`px-2 py-1 rounded text-xs ${getCategoryColor(
                                    msg.category
                                  )}`}
                                >
                                  {getCategoryLabel(msg.category)}
                                </span>
                              </td>
                              <td className="px-4 py-2 font-medium">
                                {formatCurrency(Number(msg.cost_brl))}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
