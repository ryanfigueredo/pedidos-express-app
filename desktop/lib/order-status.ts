/**
 * Consulta status do pedido mais recente pelo wa_id (customer_phone).
 */

import { prisma } from "./prisma";

const STATUS_MAP: Record<string, string> = {
  pending: "⏳ Preparando",
  printed: "🍳 Na chapa",
  out_for_delivery: "🚚 Saiu para entrega",
  finished: "✅ Entregue/Finalizado",
};

export async function getOrderStatus(
  waId: string,
  tenantSlug?: string
): Promise<string> {
  const fallback =
    "Não foi possível consultar o status. Tente novamente ou fale com um atendente.";
  try {
    const phone = String(waId || "").replace(/\D/g, "");
    if (!phone) return "Você não possui pedidos ativos no momento.";

    let tenantId: string | null = null;
    if (tenantSlug && String(tenantSlug).trim()) {
      try {
        const tenant = await prisma.tenant.findUnique({
          where: { slug: String(tenantSlug).trim() },
          select: { id: true },
        });
        tenantId = tenant?.id ?? null;
      } catch {
        // tenant não encontrado ou Prisma lento - continua sem filtro
      }
    }

    const phoneClean = phone.replace(/\D/g, "");
    const phoneSuffix =
      phoneClean.length >= 11 ? phoneClean.slice(-11) : phoneClean;
    const phoneWithout55 =
      phoneClean.startsWith("55") && phoneClean.length > 11
        ? phoneClean.slice(2)
        : phoneClean;

    const orders = await prisma.order.findMany({
      where: {
        OR: [
          { customer_phone: phoneClean },
          { customer_phone: phoneSuffix },
          { customer_phone: phoneWithout55 },
          { customer_phone: { contains: phoneClean } },
          { customer_phone: { contains: phoneSuffix } },
        ],
        ...(tenantId && { tenant_id: tenantId }),
      },
      orderBy: { created_at: "desc" },
      take: 3,
    });

    if (orders.length === 0)
      return "Você ainda não possui pedidos. Faça um pedido pelo cardápio!";

    const lines: string[] = ["📦 *Seus pedidos recentes:*\n"];
    for (const order of orders) {
      const statusLabel =
        STATUS_MAP[order.status] || order.status || "Em processamento";
      const displayId =
        order.display_id ||
        `#${String(order.order_number || order.id.slice(0, 8))}`;
      const items =
        (order.items as Array<{ name?: string; quantity?: number }>) || [];
      const itemsStr = items
        .slice(0, 5)
        .map((i) => `${i.quantity || 1}x ${i.name || "Item"}`)
        .join(", ");
      const total = Number(order.total_price) || 0;
      const addr =
        order.order_type === "delivery" && order.delivery_address
          ? `\n📍 ${order.delivery_address}`
          : "";
      lines.push(
        `${displayId} • ${statusLabel}\n` +
          `${itemsStr || "Pedido"}\n` +
          `💰 R$ ${total.toFixed(2).replace(".", ",")}${addr}\n`
      );
    }
    lines.push("\nEm caso de dúvidas, fale com um atendente.");
    return lines.join("\n");
  } catch (e) {
    console.error("[OrderStatus] Erro:", e);
    return fallback;
  }
}
