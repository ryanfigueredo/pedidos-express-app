"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { OrderCard } from "@/components/OrderCard";
import { getOrdersLabel } from "@/lib/business-type-helper";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

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
    // Abre página de impressão para usar impressora normal do PC
    window.open(`/dashboard/imprimir/${orderId}`, "_blank", "noopener");
  };

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

        {!isLoading && !error && orders && orders.length > 0 && (
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
      </div>
    </div>
  );
}
