"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

interface OrderData {
  id: string;
  display_id: string;
  customer_name: string;
  customer_phone: string;
  order_type: string;
  delivery_address: string | null;
  payment_method: string | null;
  items: { name: string; quantity: number; price: number }[];
  total_price: number;
  created_at: string;
}

export default function ImprimirPedidoPage() {
  const router = useRouter();
  const params = useParams();
  const orderId = params?.orderId as string;
  const [order, setOrder] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(true);
  const [marking, setMarking] = useState(false);
  const [marked, setMarked] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Verificar se é super admin e redirecionar
  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.user && !data.user.tenant_id) {
          router.push("/admin");
        }
      })
      .catch(() => {});
  }, [router]);

  useEffect(() => {
    if (!orderId) return;
    fetch(`/api/orders/${orderId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success && data.order) {
          setOrder(data.order);
        } else {
          setError("Pedido não encontrado");
        }
      })
      .catch(() => setError("Erro ao carregar pedido"))
      .finally(() => setLoading(false));
  }, [orderId]);

  const handlePrint = () => {
    window.print();
  };

  const handleMarkPrinted = async () => {
    if (!orderId || marking) return;
    setMarking(true);
    try {
      const [markRes, notifyRes] = await Promise.all([
        fetch(`/api/orders/${orderId}/mark-printed`, { method: "PATCH" }),
        fetch(`/api/orders/${orderId}/notify-printed`, { method: "POST" }),
      ]);
      if (markRes.ok) {
        setMarked(true);
      }
      if (!notifyRes.ok) {
        console.warn("Cliente pode não ter sido notificado");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setMarking(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatPrice = (v: number) =>
    v.toFixed(2).replace(".", ",");

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Carregando pedido...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-red-600">{error || "Pedido não encontrado"}</p>
        <a href="/dashboard" className="ml-4 text-blue-600 hover:underline">
          Voltar
        </a>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white p-8 print:p-4">
      {/* Botões: visíveis só na tela, ocultos na impressão */}
      <div className="flex gap-4 mb-8 print:hidden">
        <button
          onClick={handlePrint}
          className="bg-primary-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-primary-700"
        >
          Imprimir (impressora do PC)
        </button>
        {!marked && (
          <button
            onClick={handleMarkPrinted}
            disabled={marking}
            className="bg-green-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50"
          >
            {marking ? "Marcando..." : "Marcar como impresso e notificar cliente"}
          </button>
        )}
        {marked && (
          <span className="text-green-600 font-semibold py-2">
            ✓ Marcado e cliente notificado
          </span>
        )}
        <a
          href="/dashboard"
          className="text-gray-600 hover:text-gray-900 py-2"
        >
          ← Voltar
        </a>
      </div>

      {/* Conteúdo do pedido para impressão em papel A4 */}
      <div className="max-w-md mx-auto border-2 border-gray-200 rounded-lg p-6 print:border-none print:max-w-none">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">
          Pedido {order.display_id}
        </h1>
        <p className="text-sm text-gray-500 mb-4">
          {formatDate(order.created_at)}
        </p>
        <hr className="border-gray-200 my-4" />

        <p className="font-semibold text-gray-900">{order.customer_name}</p>
        <p className="text-gray-600">{order.customer_phone}</p>
        {order.order_type === "delivery" && order.delivery_address && (
          <p className="text-gray-700 mt-2">{order.delivery_address}</p>
        )}
        <hr className="border-gray-200 my-4" />

        <h2 className="font-bold text-gray-900 mb-2">Itens</h2>
        <ul className="space-y-1">
          {order.items.map((item, i) => (
            <li key={i} className="flex justify-between">
              <span>
                {item.quantity}x {item.name}
              </span>
              <span>R$ {formatPrice((item.quantity || 1) * (item.price || 0))}</span>
            </li>
          ))}
        </ul>
        <hr className="border-gray-200 my-4" />

        <div className="flex justify-between font-bold text-lg">
          <span>Total</span>
          <span>R$ {formatPrice(order.total_price)}</span>
        </div>
        <p className="text-sm text-gray-500 mt-2">
          Pagamento: {order.payment_method || "Não informado"}
        </p>
      </div>
    </div>
  );
}
