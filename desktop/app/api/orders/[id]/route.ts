import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { getAuthUser } from "@/lib/auth";

/** Obtém tenant_id para autorização: sessão/Basic Auth ou X-API-Key/X-Tenant-Id (app mobile). */
async function getTenantIdForOrder(
  request: NextRequest
): Promise<string | null> {
  const authUser = await getAuthUser(request);
  if (authUser?.tenant_id) return authUser.tenant_id;
  const apiKey =
    request.headers.get("x-api-key") || request.headers.get("X-API-Key");
  if (apiKey) {
    try {
      const { getTenantByApiKey } = await import("@/lib/tenant");
      const tenant = await getTenantByApiKey(apiKey);
      if (tenant) return tenant.id;
    } catch (_) {}
  }
  const tenantIdHeader =
    request.headers.get("x-tenant-id") || request.headers.get("X-Tenant-Id");
  if (tenantIdHeader) {
    if (
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        tenantIdHeader
      )
    )
      return tenantIdHeader;
    try {
      const { getTenantByApiKey } = await import("@/lib/tenant");
      const tenant = await getTenantByApiKey(tenantIdHeader);
      if (tenant) return tenant.id;
    } catch (_) {}
  }
  return null;
}

/**
 * GET - Retorna um pedido por ID (para impressão no desktop)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: orderId } = await params;
  try {
    const tenantId = await getTenantIdForOrder(request);
    if (!tenantId) {
      return NextResponse.json(
        { success: false, error: "Não autenticado" },
        { status: 401 }
      );
    }
    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });
    if (!order) {
      return NextResponse.json(
        { success: false, error: "Pedido não encontrado" },
        { status: 404 }
      );
    }
    if (order.tenant_id !== tenantId) {
      return NextResponse.json(
        { success: false, error: "Acesso negado" },
        { status: 403 }
      );
    }
    const items = Array.isArray(order.items)
      ? (order.items as { name: string; quantity: number; price: number }[])
      : [];
    return NextResponse.json({
      success: true,
      order: {
        id: order.id,
        display_id: order.display_id || `#${order.daily_sequence ?? "?"}`,
        customer_name: order.customer_name,
        customer_phone: order.customer_phone,
        order_type: order.order_type,
        delivery_address: order.delivery_address,
        payment_method: order.payment_method,
        items,
        total_price: Number(order.total_price),
        created_at: order.created_at.toISOString(),
      },
    });
  } catch (error) {
    console.error("[GET Order] Erro:", error);
    return NextResponse.json(
      { success: false, error: "Erro ao buscar pedido" },
      { status: 500 }
    );
  }
}

/**
 * PATCH - Atualiza pedido (itens, endereço)
 * Usado pelo app-admin para editar pedidos antes/depois de imprimir
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: orderId } = await params;

  try {
    const tenantId = await getTenantIdForOrder(request);
    if (!tenantId) {
      return NextResponse.json(
        { success: false, error: "Não autenticado" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { items, delivery_address } = body;

    const existingOrder = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!existingOrder) {
      return NextResponse.json(
        { success: false, error: "Pedido não encontrado" },
        { status: 404 }
      );
    }

    if (existingOrder.tenant_id !== tenantId) {
      return NextResponse.json(
        { success: false, error: "Acesso negado a este pedido" },
        { status: 403 }
      );
    }

    const updateData: Record<string, unknown> = {};

    if (items && Array.isArray(items) && items.length > 0) {
      const validItems = items
        .filter(
          (i: any) =>
            i &&
            typeof i.name === "string" &&
            typeof i.quantity === "number" &&
            i.quantity > 0 &&
            typeof i.price === "number"
        )
        .map((i: any) => ({
          name: String(i.name),
          quantity: Math.floor(i.quantity) || 1,
          price: Number(i.price) || 0,
        }));

      if (validItems.length === 0) {
        return NextResponse.json(
          { success: false, error: "Itens inválidos" },
          { status: 400 }
        );
      }

      const total = validItems.reduce(
        (sum: number, i: { quantity: number; price: number }) =>
          sum + i.quantity * i.price,
        0
      );

      updateData.items = validItems as unknown as Prisma.InputJsonValue;
      updateData.total_price = new Prisma.Decimal(total);
    }

    if (delivery_address !== undefined) {
      updateData.delivery_address =
        delivery_address === null || delivery_address === ""
          ? null
          : String(delivery_address);
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { success: false, error: "Nenhum dado para atualizar" },
        { status: 400 }
      );
    }

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      order: {
        id: updatedOrder.id,
        items: updatedOrder.items,
        total_price: Number(updatedOrder.total_price),
        delivery_address: updatedOrder.delivery_address,
      },
    });
  } catch (error) {
    console.error("[PATCH Order] Erro:", error);
    return NextResponse.json(
      { success: false, error: "Erro ao atualizar pedido" },
      { status: 500 }
    );
  }
}
