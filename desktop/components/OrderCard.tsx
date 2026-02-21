"use client";

interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
}

interface Order {
  id: string;
  customer_name: string;
  customer_phone: string;
  items: OrderItem[];
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

interface OrderCardProps {
  order: Order;
  onReprint: (orderId: string) => void;
  onPrint?: (orderId: string) => void;
}

export function OrderCard({ order, onReprint, onPrint }: OrderCardProps) {
  const isPending = order.status === "pending";
  const isPrinted = order.status === "printed";

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  const formatPrice = (price: number | string) => {
    const numPrice = typeof price === "string" ? parseFloat(price) : price;
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(numPrice);
  };

  const scheduledLabel = (): string | null => {
    if (!order.appointment_date) return null;
    const d = new Date(order.appointment_date);
    const today = new Date();
    const isToday =
      d.getDate() === today.getDate() &&
      d.getMonth() === today.getMonth() &&
      d.getFullYear() === today.getFullYear();
    if (isToday) return null;
    const dayLabel =
      d.getDate() === today.getDate() + 1 &&
      d.getMonth() === today.getMonth() &&
      d.getFullYear() === today.getFullYear()
        ? "Amanhã"
        : new Intl.DateTimeFormat("pt-BR", {
            weekday: "short",
            day: "numeric",
            month: "short",
          }).format(d);
    const time = new Intl.DateTimeFormat("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(d);
    return `Agendado: ${dayLabel} às ${time}`;
  };

  const scheduledText = scheduledLabel();

  return (
    <div
      className={`card-modern p-6 transition-all duration-300 hover:scale-[1.02] ${
        isPending
          ? "bg-gradient-to-br from-yellow-50 to-yellow-100 border-l-4 border-yellow-500 shadow-yellow-100"
          : isPrinted
          ? "bg-gradient-to-br from-primary-50 to-primary-100 border-l-4 border-primary-500 shadow-primary-100"
          : "bg-white border-l-4 border-gray-300"
      }`}
    >
      <div className="flex justify-between items-start mb-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h2 className="text-xl font-bold text-gray-900">
              {order.display_id ||
                `Pedido #${order.daily_sequence || order.id.slice(0, 8)}`}
            </h2>
            {order.daily_sequence && (
              <span className="badge badge-info">
                {order.daily_sequence}º do dia
              </span>
            )}
            {scheduledText && (
              <span className="badge bg-indigo-100 text-indigo-800 border border-indigo-200">
                {scheduledText}
              </span>
            )}
            <span
              className={`badge ${
                isPending
                  ? "badge-warning"
                  : isPrinted
                  ? "badge-success"
                  : "bg-gray-200 text-gray-700"
              }`}
            >
              {isPending ? "Pendente" : isPrinted ? "Impresso" : "Finalizado"}
            </span>
          </div>
          <p className="text-sm text-gray-600">
            {formatDate(order.created_at)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isPending && onPrint && (
            <button
              onClick={() => onPrint(order.id)}
              className="btn-primary text-sm px-4 py-2"
            >
              Imprimir
            </button>
          )}
          {isPrinted && (
            <button
              onClick={() => onReprint(order.id)}
              className="btn-primary text-sm px-4 py-2"
            >
              Reimprimir
            </button>
          )}
        </div>
      </div>

      <div className="mb-4 bg-white/50 rounded-lg p-3">
        <h3 className="text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">
          Cliente
        </h3>
        <p className="text-gray-900 font-semibold text-lg">
          {order.customer_name}
        </p>
        <p className="text-sm text-gray-600 mt-1">{order.customer_phone}</p>
        {order.customer_total_orders && order.customer_total_orders > 0 && (
          <p className="text-xs text-gray-700 mt-2 font-medium">
            🎉 {order.customer_total_orders}º pedido deste cliente
          </p>
        )}
      </div>

      <div className="mb-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">
          Itens do Pedido
        </h3>
        <div className="space-y-2">
          {order.items.map((item, index) => (
            <div
              key={item.id || index}
              className="flex justify-between items-center bg-white/70 rounded-lg p-3 border border-gray-100 hover:bg-white transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="bg-primary-100 text-primary-600 font-bold px-2 py-1 rounded text-sm">
                  {item.quantity}x
                </span>
                <span className="text-gray-900 font-medium">{item.name}</span>
              </div>
              <span className="text-gray-700 font-semibold">
                {formatPrice(item.price)}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="pt-4 border-t-2 border-gray-200">
        <div className="flex justify-between items-center bg-gradient-to-r from-primary-50 to-transparent rounded-lg p-3">
          <span className="text-lg font-semibold text-gray-900 uppercase tracking-wide">
            Total
          </span>
          <span className="text-2xl font-bold text-primary-600 font-display">
            {formatPrice(order.total_price)}
          </span>
        </div>
      </div>
    </div>
  );
}
