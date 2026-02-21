"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { OrderCard } from "@/components/OrderCard";
import { getOrdersLabel } from "@/lib/business-type-helper";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

const START_HOUR = 8;
const END_HOUR = 21;
const POINTS_PER_HOUR = 60;
const DEFAULT_DURATION_MIN = 30;

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
  appointment_date?: string | null;
  order_type?: string | null;
  estimated_time?: number | null;
}

export default function DashboardStreamPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Buscar informações do usuário para obter business_type
  const { data: userData } = useSWR<{ success: boolean; user: any }>("/api/auth/me", fetcher);
  const user = userData?.user;

  // Verificar se é super admin e redirecionar
  useEffect(() => {
    if (userData?.success && userData?.user && !userData.user.tenant_id) {
      router.push("/admin");
    }
  }, [userData, router]);

  useEffect(() => {
    // Usar Server-Sent Events para atualização em tempo real
    const eventSource = new EventSource("/api/orders/stream");

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === "initial" || data.type === "update") {
          setOrders(data.orders || []);
          setIsLoading(false);
          setError(null);
        } else if (data.type === "error") {
          setError(data.message);
          setIsLoading(false);
        }
      } catch (err) {
        console.error("Erro ao processar SSE:", err);
      }
    };

    eventSource.onerror = (err) => {
      console.error("Erro no SSE:", err);
      eventSource.close();
      // Fallback para polling se SSE falhar
      setIsLoading(false);
      setError("Conexão perdida. Recarregue a página.");
    };

    return () => {
      eventSource.close();
    };
  }, []);

  const handleReprint = async (orderId: string) => {
    try {
      const response = await fetch(`/api/orders/${orderId}/reprint`, {
        method: "PATCH",
      });
      if (!response.ok) console.error("Erro ao reimprimir pedido");
    } catch (error) {
      console.error("Erro ao reimprimir pedido:", error);
    }
  };

  const handlePrint = (orderId: string) => {
    window.open(`/dashboard/imprimir/${orderId}`, "_blank", "noopener");
  };

  const isBarber = user?.business_type === "BARBEIRO";

  const { todayOrders, tomorrowOrders } = useMemo(() => {
    const today = new Date();
    const todayStart = new Date(today);
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(todayStart);
    todayEnd.setDate(todayEnd.getDate() + 1);
    const tomorrowEnd = new Date(todayStart);
    tomorrowEnd.setDate(tomorrowEnd.getDate() + 2);
    const withAppointment = orders.filter((o) => o.appointment_date);
    const todayOrders = withAppointment.filter((o) => {
      const d = new Date(o.appointment_date!);
      return d >= todayStart && d < todayEnd;
    });
    const tomorrowOrders = withAppointment.filter((o) => {
      const d = new Date(o.appointment_date!);
      return d >= todayEnd && d < tomorrowEnd;
    });
    const toMinutes = (date: Date) => date.getHours() * 60 + date.getMinutes();
    const byTime = (a: Order, b: Order) =>
      toMinutes(new Date(a.appointment_date!)) - toMinutes(new Date(b.appointment_date!));
    todayOrders.sort(byTime);
    tomorrowOrders.sort(byTime);
    return { todayOrders, tomorrowOrders };
  }, [orders]);

  const [agendaDay, setAgendaDay] = useState<"hoje" | "amanha">("hoje");
  const agendaOrders = agendaDay === "hoje" ? todayOrders : tomorrowOrders;

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Dashboard de {getOrdersLabel(user)}
          </h1>
          <p className="text-gray-600">
            Atualização em tempo real via Server-Sent Events
          </p>
        </div>

        {isLoading && (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        {!isLoading && !error && orders && orders.length === 0 && (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-500 text-lg">Nenhum {getOrdersLabel(user).toLowerCase()} encontrado</p>
          </div>
        )}

        {!isLoading && !error && orders && orders.length > 0 && isBarber && (
          <>
            <div className="flex gap-2 mb-4">
              <button
                type="button"
                onClick={() => setAgendaDay("hoje")}
                className={`px-4 py-2 rounded-lg font-medium ${
                  agendaDay === "hoje"
                    ? "bg-primary-600 text-white"
                    : "bg-white border border-gray-300 text-gray-700"
                }`}
              >
                Hoje
              </button>
              <button
                type="button"
                onClick={() => setAgendaDay("amanha")}
                className={`px-4 py-2 rounded-lg font-medium ${
                  agendaDay === "amanha"
                    ? "bg-primary-600 text-white"
                    : "bg-white border border-gray-300 text-gray-700"
                }`}
              >
                Amanhã
              </button>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="flex min-h-[520px]">
                <div className="w-16 shrink-0 border-r border-gray-200 bg-gray-50/80 py-2">
                  {Array.from({ length: END_HOUR - START_HOUR }, (_, i) => START_HOUR + i).map(
                    (h) => (
                      <div
                        key={h}
                        className="h-[60px] flex items-start justify-end pr-2 text-sm text-gray-500 font-medium"
                        style={{ height: POINTS_PER_HOUR }}
                      >
                        {String(h).padStart(2, "0")}:00
                      </div>
                    )
                  )}
                </div>
                <div className="flex-1 relative min-h-[520px]" style={{ height: (END_HOUR - START_HOUR) * POINTS_PER_HOUR }}>
                  {agendaOrders.map((order) => {
                    const d = new Date(order.appointment_date!);
                    const startMinutes = (d.getHours() - START_HOUR) * 60 + d.getMinutes();
                    const duration = order.estimated_time ?? DEFAULT_DURATION_MIN;
                    const top = (startMinutes / 60) * POINTS_PER_HOUR;
                    const height = Math.max(44, (duration / 60) * POINTS_PER_HOUR);
                    return (
                      <div
                        key={order.id}
                        className="absolute left-2 right-2 rounded-xl shadow-md border border-gray-200 bg-white overflow-hidden flex flex-col"
                        style={{
                          top: top + 2,
                          height: height - 4,
                          minHeight: 44,
                        }}
                      >
                        <div className="p-2 flex-1 flex flex-col min-0">
                          <div className="font-semibold text-gray-900 truncate text-sm">
                            {order.customer_name}
                          </div>
                          <div className="text-xs text-gray-500 truncate">
                            {order.items?.[0]?.name ?? order.display_id ?? ""}
                          </div>
                          {height >= 56 && (
                            <div className="text-xs font-medium text-primary-600 mt-auto">
                              {new Intl.DateTimeFormat("pt-BR", {
                                hour: "2-digit",
                                minute: "2-digit",
                              }).format(d)}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </>
        )}

        {!isLoading && !error && orders && orders.length > 0 && !isBarber && (
          <div className="space-y-4">
            {orders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                onReprint={handleReprint}
                onPrint={handlePrint}
              />
            ))}
          </div>
        )}

        {!isLoading && !error && orders && orders.length > 0 && isBarber && (
          <div className="mt-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Lista</h2>
            <div className="space-y-4">
              {orders.map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  onReprint={handleReprint}
                  onPrint={handlePrint}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
