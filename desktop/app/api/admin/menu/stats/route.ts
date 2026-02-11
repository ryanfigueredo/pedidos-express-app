import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth-session";
import { validateApiKey } from "@/lib/auth";

export async function GET(request: NextRequest) {
  // Permitir acesso via sessão (web), API key ou Basic Auth (app)
  const session = await getSession();
  const authValidation = await validateApiKey(request);
  const { validateBasicAuth } = await import("@/lib/auth");
  const basicAuth = await validateBasicAuth(request);

  if (!session && !authValidation.isValid && !basicAuth.isValid) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  try {
    let tenantId: string | null = null;
    if (session) {
      const user = await prisma.user.findUnique({
        where: { id: session.id },
      });
      if (user?.tenant_id) tenantId = user.tenant_id;
    } else if (authValidation.isValid && authValidation.tenant) {
      tenantId = authValidation.tenant.id;
    } else if (basicAuth.isValid && basicAuth.user?.tenant_id) {
      tenantId = basicAuth.user.tenant_id;
    }

    if (!tenantId) {
      return NextResponse.json(
        { error: "Tenant não identificado" },
        { status: 400 }
      );
    }

    // Buscar pedidos do tenant
    const orders = await prisma.order.findMany({
      where: {
        tenant_id: tenantId,
        created_at: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Últimos 30 dias
        },
      },
      select: {
        items: true,
        created_at: true,
      },
    });

    // Contar vendas por item
    const itemStats: Record<
      string,
      { name: string; quantity: number; revenue: number }
    > = {};

    orders.forEach((order) => {
      let items: any[] = [];

      if (typeof order.items === "string") {
        try {
          items = JSON.parse(order.items);
        } catch {
          items = [];
        }
      } else if (Array.isArray(order.items)) {
        items = order.items;
      }

      items.forEach((item: any) => {
        const itemName = item.name || item.item || "";
        const quantity = item.quantity || 1;
        const price = parseFloat(item.price || 0);
        const revenue = quantity * price;

        if (itemStats[itemName]) {
          itemStats[itemName].quantity += quantity;
          itemStats[itemName].revenue += revenue;
        } else {
          itemStats[itemName] = {
            name: itemName,
            quantity,
            revenue,
          };
        }
      });
    });

    // Converter para array e ordenar por quantidade
    const stats = Object.values(itemStats)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 20); // Top 20

    return NextResponse.json(
      {
        success: true,
        stats,
        period: "30 dias",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Erro ao buscar estatísticas:", error);
    return NextResponse.json(
      { error: "Erro ao buscar estatísticas", message: String(error) },
      { status: 500 }
    );
  }
}
