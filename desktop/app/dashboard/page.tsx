"use client";

import { useEffect } from "react";
import useSWR from "swr";
import { OrderCard } from "@/components/OrderCard";
import { getOrdersLabel, getOrdersTodayLabel, getOrderLabel } from "@/lib/business-type-helper";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface Order {
  id: string;
  customer_name: string;
  customer_phone: string;
  items: Array<{
    id: string;
    name: string;
    quantity: number;
    price: number;
  }>;
  total_price: number | string;
  status: "pending" | "printed" | "finished";
  created_at: string;
  order_number?: number;
  daily_sequence?: number;
  display_id?: string;
  customer_total_orders?: number;
}

interface Stats {
  today: {
    orders: number;
    revenue: number;
    revenueFormatted: string;
  };
  week: {
    orders: number;
    revenue: number;
    revenueFormatted: string;
    ordersChange: number;
    revenueChange: number;
  };
  pendingOrders: number;
  dailyStats: Array<{
    day: string;
    orders: number;
    revenue: number;
  }>;
  totalRestaurants?: number;
}

const fetcher = (url: string) =>
  fetch(url, { credentials: "include" }).then((res) => res.json());

export default function DashboardPage() {
  // Verificar se é super admin e redirecionar
  const { data: authUserData } = useSWR<{ success: boolean; user: any }>("/api/auth/me", fetcher);
  
  useEffect(() => {
    if (authUserData?.success && authUserData?.user && !authUserData.user.tenant_id) {
      window.location.href = "/admin";
    }
  }, [authUserData]);

  const {
    data: statsData,
    error: statsError,
    isLoading: statsLoading,
  } = useSWR<{ success: boolean; stats: Stats }>("/api/admin/stats", fetcher, {
    refreshInterval: 30000, // Atualiza a cada 30 segundos
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
  });

  const {
    data: ordersData,
    error: ordersError,
    isLoading: ordersLoading,
    mutate,
  } = useSWR<{ orders: Order[]; pagination: any }>(
    "/api/orders?page=1&limit=10",
    fetcher,
    {
      refreshInterval: 5000, // Atualiza a cada 5 segundos
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
    }
  );

  // Definir stats antes de usar no próximo hook
  const stats = statsData?.stats;

  const { data: tenantsData } = useSWR<{ success: boolean; tenants: any[] }>(
    stats?.totalRestaurants !== undefined ? "/api/admin/tenants" : null,
    fetcher,
    {
      refreshInterval: 60000, // Atualiza a cada minuto
    }
  );

  const { data: menuStatsData } = useSWR<{
    success: boolean;
    stats: Array<{ name: string; quantity: number; revenue: number }>;
  }>("/api/admin/menu/stats", fetcher, {
    refreshInterval: 60000,
  });

  // Buscar informações do usuário para obter business_type
  const { data: userData } = useSWR<{ success: boolean; user: any }>("/api/auth/me", fetcher);

  const orders = ordersData?.orders || [];
  const menuStats = menuStatsData?.stats || [];
  const tenants = tenantsData?.tenants || [];
  const user = userData?.user;

  const handleReprint = async (orderId: string) => {
    try {
      const response = await fetch(`/api/orders/${orderId}/reprint`, {
        method: "PATCH",
      });

      if (response.ok) {
        mutate();
      } else {
        console.error("Erro ao reimprimir pedido");
      }
    } catch (error) {
      console.error("Erro ao reimprimir pedido:", error);
    }
  };

  const handlePrint = (orderId: string) => {
    window.open(`/dashboard/imprimir/${orderId}`, "_blank", "noopener");
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const formatChange = (value: number) => {
    const sign = value >= 0 ? "+" : "";
    const color = value >= 0 ? "text-green-600" : "text-red-600";
    return (
      <span className={color}>
        {sign}
        {value.toFixed(1)}%
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-gray-50 py-8 px-4 animate-fade-in">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 animate-slide-in">
          <h1 className="text-4xl font-bold text-gray-900 mb-2 font-display">
            Dashboard
          </h1>
          <p className="text-gray-600 text-lg">
            Visão geral dos pedidos e estatísticas em tempo real
          </p>
        </div>

        {/* KPIs */}
        {statsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="bg-white rounded-xl shadow-md p-6 animate-pulse"
              >
                <div className="h-4 bg-gray-200 rounded w-24 mb-4"></div>
                <div className="h-8 bg-gray-200 rounded w-32"></div>
              </div>
            ))}
          </div>
        ) : stats ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Pedidos Hoje */}
            <div className="card-modern p-6 border-l-4 border-blue-500 hover:scale-105 transition-transform duration-200 animate-fade-in">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1 uppercase tracking-wide">
                    {getOrdersTodayLabel(user)}
                  </p>
                  <p className="text-3xl font-bold text-gray-900 font-display">
                    {stats.today.orders}
                  </p>
                </div>
                <div className="bg-gradient-to-br from-blue-100 to-blue-50 rounded-xl p-4 shadow-sm">
                  <svg
                    className="w-8 h-8 text-blue-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>
              </div>
            </div>

            {/* Receita Hoje */}
            <div className="card-modern p-6 border-l-4 border-primary-500 hover:scale-105 transition-transform duration-200 animate-fade-in">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1 uppercase tracking-wide">
                    Receita Hoje
                  </p>
                  <p className="text-3xl font-bold text-primary-600 font-display">
                    {stats.today.revenueFormatted}
                  </p>
                </div>
                <div className="bg-gradient-to-br from-primary-100 to-primary-50 rounded-xl p-4 shadow-sm">
                  <svg
                    className="w-8 h-8 text-primary-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
              </div>
            </div>

            {/* Pedidos da Semana */}
            <div className="card-modern p-6 border-l-4 border-purple-500 hover:scale-105 transition-transform duration-200 animate-fade-in">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1 uppercase tracking-wide">
                    {getOrdersLabel(user)} Semana
                  </p>
                  <p className="text-3xl font-bold text-gray-900 font-display">
                    {stats.week.orders}
                  </p>
                  <p className="text-sm mt-2 font-medium">
                    {formatChange(stats.week.ordersChange)} vs semana anterior
                  </p>
                </div>
                <div className="bg-gradient-to-br from-purple-100 to-purple-50 rounded-xl p-4 shadow-sm">
                  <svg
                    className="w-8 h-8 text-purple-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"
                    />
                  </svg>
                </div>
              </div>
            </div>

            {/* Receita da Semana */}
            <div className="card-modern p-6 border-l-4 border-accent-500 hover:scale-105 transition-transform duration-200 animate-fade-in">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1 uppercase tracking-wide">
                    Receita Semana
                  </p>
                  <p className="text-3xl font-bold text-accent-600 font-display">
                    {stats.week.revenueFormatted}
                  </p>
                  <p className="text-sm mt-2 font-medium">
                    {formatChange(stats.week.revenueChange)} vs semana anterior
                  </p>
                </div>
                <div className="bg-gradient-to-br from-accent-100 to-accent-50 rounded-xl p-4 shadow-sm">
                  <svg
                    className="w-8 h-8 text-accent-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                    />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {/* Gráficos */}
        {statsLoading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-md p-6 h-80 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-32 mb-4"></div>
              <div className="h-full bg-gray-200 rounded"></div>
            </div>
            <div className="bg-white rounded-xl shadow-md p-6 h-80 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-32 mb-4"></div>
              <div className="h-full bg-gray-200 rounded"></div>
            </div>
          </div>
        ) : stats ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Gráfico de Pedidos por Dia */}
            <div className="card-modern p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 font-display">
                {getOrdersLabel(user)} por Dia da Semana
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={stats.dailyStats}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar
                    dataKey="orders"
                    fill="#3b82f6"
                    name={getOrdersLabel(user)}
                    radius={[8, 8, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Gráfico de Receita por Dia */}
            <div className="card-modern p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 font-display">
                Receita por Dia da Semana
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={stats.dailyStats}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis
                    tickFormatter={(value) =>
                      `R$ ${(value / 1000).toFixed(0)}k`
                    }
                  />
                  <Tooltip
                    formatter={(value: number | undefined) =>
                      value !== undefined ? formatCurrency(value) : ""
                    }
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="#10b981"
                    strokeWidth={3}
                    name="Receita"
                    dot={{ fill: "#10b981", r: 5 }}
                    activeDot={{ r: 7 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        ) : null}

        {/* Itens Mais Vendidos (30 dias) */}
        {menuStats.length > 0 && (
          <div className="card-modern p-6 mb-8 border-l-4 border-blue-500 animate-fade-in">
            <h3 className="text-lg font-bold text-gray-900 font-display mb-4">
              Itens Mais Vendidos (30 dias)
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Item
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Qtd
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Receita
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {menuStats.slice(0, 10).map((stat, i) => (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="px-4 py-2 font-medium text-gray-900">
                        {stat.name}
                      </td>
                      <td className="px-4 py-2 text-gray-600">
                        {stat.quantity}
                      </td>
                      <td className="px-4 py-2 font-semibold text-primary-600">
                        {formatCurrency(stat.revenue)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Pedidos Pendentes e Recentes */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Card de Pedidos Pendentes */}
          {stats && (
            <div className="card-modern p-6 border-l-4 border-accent-500 hover:scale-105 transition-transform duration-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 font-display">
                  {getOrdersLabel(user)} Pendentes
                </h3>
                <div className="bg-gradient-to-br from-accent-100 to-accent-50 rounded-xl p-3 shadow-sm">
                  <svg
                    className="w-6 h-6 text-accent-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
              </div>
              <div className="text-center">
                <p className="text-5xl font-bold text-accent-600 mb-2 font-display">
                  {stats.pendingOrders}
                </p>
                <p className="text-sm text-gray-600 font-medium">
                  Aguardando processamento
                </p>
              </div>
            </div>
          )}

          {/* Total de Restaurantes (apenas para super admin) */}
          {stats?.totalRestaurants !== undefined && (
            <div className="card-modern p-6 border-l-4 border-indigo-500 hover:scale-105 transition-transform duration-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 font-display">
                  Restaurantes
                </h3>
                <div className="bg-gradient-to-br from-indigo-100 to-indigo-50 rounded-xl p-3 shadow-sm">
                  <svg
                    className="w-6 h-6 text-indigo-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                    />
                  </svg>
                </div>
              </div>
              <div className="text-center">
                <p className="text-5xl font-bold text-indigo-600 mb-2 font-display">
                  {stats.totalRestaurants}
                </p>
                <p className="text-sm text-gray-600 font-medium">
                  Restaurantes ativos
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Restaurantes (apenas para super admin) */}
        {stats?.totalRestaurants !== undefined && tenants.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Restaurantes</h2>
              <a
                href="/admin/clientes"
                className="text-blue-600 hover:text-blue-700 font-medium text-sm"
              >
                Gerenciar todos →
              </a>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {tenants.slice(0, 6).map((tenant) => (
                <div
                  key={tenant.id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-gray-900">
                      {tenant.name}
                    </h3>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        tenant.is_active
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {tenant.is_active ? "Ativo" : "Inativo"}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mb-3">{tenant.slug}</p>
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center text-gray-600">
                      <svg
                        className="w-4 h-4 mr-1"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                      {tenant._count?.orders || 0} pedidos
                    </div>
                    <div className="flex items-center text-gray-600">
                      <svg
                        className="w-4 h-4 mr-1"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                        />
                      </svg>
                      {tenant._count?.users || 0} usuários
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Pedidos Recentes */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              {getOrdersLabel(user)} Recentes
            </h2>
            <a
              href="/dashboard/stream"
              className="text-blue-600 hover:text-blue-700 font-medium text-sm"
            >
              Ver todos →
            </a>
          </div>

          {ordersLoading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : ordersError ? (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              Erro ao carregar pedidos. Tente novamente.
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">Nenhum {getOrdersLabel(user).toLowerCase()} encontrado</p>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.slice(0, 5).map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  onReprint={handleReprint}
                  onPrint={handlePrint}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
