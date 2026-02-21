import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getStoreStatus } from "@/lib/store-status";
import { Prisma } from "@prisma/client";

// Forçar rota dinâmica (não pode ser renderizada estaticamente)
export const dynamic = "force-dynamic";

/** Lê sessão do cookie da requisição (fallback quando next/headers não reflete o request). */
function getSessionFromCookieHeader(cookieHeader: string | null): { id: string; tenant_id?: string | null } | null {
  if (!cookieHeader) return null;
  try {
    const match = cookieHeader.match(/\bsession=([^;]+)/);
    let value = match?.[1]?.trim();
    if (!value) return null;
    if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1).replace(/\\"/g, '"');
    const decoded = decodeURIComponent(value);
    const parsed = JSON.parse(decoded) as { id?: string; tenant_id?: string | null };
    return parsed?.id ? { id: parsed.id, tenant_id: parsed.tenant_id } : null;
  } catch {
    return null;
  }
}

/** Obtém tenant_id a partir da sessão (web), headers (Basic Auth, X-Tenant-Id, X-API-Key). Usado por GET e POST. */
async function getTenantIdFromRequest(
  request: NextRequest
): Promise<string | null> {
  let tenantId: string | null = null;

  // 1) Sessão (cookie) – dashboard web logado vê só pedidos do seu tenant
  // Ler do header Cookie diretamente para garantir que usamos o request que chegou (evita bug em edge/worker)
  const cookieHeader = request.headers.get("cookie");
  let session: { id: string; tenant_id?: string | null } | null = getSessionFromCookieHeader(cookieHeader);
  if (!session) {
    try {
      const { getSession } = await import("@/lib/auth-session");
      session = await getSession();
    } catch (_) {}
  }
  if (session?.id) {
    if (session.tenant_id) {
      return session.tenant_id;
    }
    // Cookie antigo pode não ter tenant_id: buscar no banco
    const user = await prisma.user.findUnique({
      where: { id: session.id },
      select: { tenant_id: true },
    });
    if (user?.tenant_id) {
      return user.tenant_id;
    }
    // Super admin sem tenant: não usar fallback aqui
  }

  const authHeader =
    request.headers.get("authorization") ||
    request.headers.get("Authorization");
  if (authHeader?.startsWith("Basic ")) {
    try {
      const base64Credentials = authHeader.split(" ")[1];
      const credentials = Buffer.from(base64Credentials, "base64").toString(
        "utf-8"
      );
      const [username, password] = credentials.split(":");
      if (username && password) {
        const { verifyCredentials } = await import("@/lib/auth-session");
        const user = await verifyCredentials(username, password);
        if (user?.tenant_id) tenantId = user.tenant_id;
        else if (user) {
          const users = await prisma.$queryRawUnsafe<
            Array<{ tenant_id: string | null }>
          >(`SELECT tenant_id FROM users WHERE id = $1 LIMIT 1`, user.id);
          if (users.length > 0 && users[0].tenant_id)
            tenantId = users[0].tenant_id;
          else {
            const slug =
              request.headers.get("x-tenant-id") || "tamboril-burguer";
            const tenants = await prisma.$queryRawUnsafe<Array<{ id: string }>>(
              `SELECT id FROM tenants WHERE slug = $1 LIMIT 1`,
              slug
            );
            if (tenants.length > 0) tenantId = tenants[0].id;
          }
        }
      }
    } catch (_) {}
  }
  if (!tenantId) {
    const tenantIdHeader =
      request.headers.get("x-tenant-id") ||
      request.headers.get("X-Tenant-Id");
    if (tenantIdHeader) {
      if (
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
          tenantIdHeader
        )
      ) {
        tenantId = tenantIdHeader;
      } else {
        try {
          const { getTenantByApiKey } = await import("@/lib/tenant");
          const tenant = await getTenantByApiKey(tenantIdHeader);
          if (tenant) tenantId = tenant.id;
          else {
            const tenants = await prisma.$queryRawUnsafe<Array<{ id: string }>>(
              `SELECT id FROM tenants WHERE slug = $1 LIMIT 1`,
              tenantIdHeader
            );
            if (tenants.length > 0) tenantId = tenants[0].id;
          }
        } catch (_) {}
      }
    } else {
      const apiKey =
        request.headers.get("x-api-key") || request.headers.get("X-API-Key");
      if (apiKey) {
        try {
          const { getTenantByApiKey } = await import("@/lib/tenant");
          const tenant = await getTenantByApiKey(apiKey);
          if (tenant) tenantId = tenant.id;
        } catch (_) {}
      }
    }
  }
  if (!tenantId) {
    try {
      const defaultTenants = await prisma.$queryRawUnsafe<Array<{ id: string }>>(
        `SELECT id FROM tenants WHERE slug = 'tamboril-burguer' LIMIT 1`
      );
      if (defaultTenants.length > 0) tenantId = defaultTenants[0].id;
    } catch (_) {}
  }
  return tenantId;
}

export async function GET(request: NextRequest) {
  try {
    // Verificar se tabela orders existe
    let ordersTableExists = false;
    try {
      const tableCheck = await prisma.$queryRawUnsafe<
        Array<{ table_name: string }>
      >(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'orders'
        LIMIT 1
      `);
      ordersTableExists = tableCheck.length > 0;
    } catch (error) {
      console.log("Erro ao verificar tabela orders:", error);
      ordersTableExists = false;
    }

    if (!ordersTableExists) {
      // Tabela orders não existe, retornar lista vazia
      return NextResponse.json(
        {
          orders: [],
          pagination: {
            page: 1,
            limit: 20,
            total: 0,
            totalPages: 0,
            hasMore: false,
          },
        },
        { status: 200 }
      );
    }

    // Obter tenant_id do header, API key ou Basic Auth
    let tenantId: string | null = null;

    // Verificar Basic Auth primeiro (para apps mobile com login)
    const authHeader =
      request.headers.get("authorization") ||
      request.headers.get("Authorization");
    if (authHeader && authHeader.startsWith("Basic ")) {
      try {
        const base64Credentials = authHeader.split(" ")[1];
        const credentials = Buffer.from(base64Credentials, "base64").toString(
          "utf-8"
        );
        const [username, password] = credentials.split(":");

        if (username && password) {
          const { verifyCredentials } = await import("@/lib/auth-session");
          const user = await verifyCredentials(username, password);
          if (user) {
            console.log(
              "✅ Usuário autenticado via Basic Auth:",
              user.id,
              "tenant_id:",
              user.tenant_id
            );
            // Usar tenant_id do user retornado (já vem do verifyCredentials)
            if (user.tenant_id) {
              tenantId = user.tenant_id;
            } else {
              // Se não tem no user, buscar do banco usando SQL direto (fallback)
              try {
                const users = await prisma.$queryRawUnsafe<
                  Array<{ tenant_id: string | null }>
                >(
                  `
                  SELECT tenant_id FROM users WHERE id = $1 LIMIT 1
                `,
                  user.id
                );
                if (users.length > 0 && users[0].tenant_id) {
                  tenantId = users[0].tenant_id;
                  console.log("✅ Tenant_id obtido do banco:", tenantId);
                }
              } catch (dbError: any) {
                console.error("Erro ao buscar tenant_id do usuário:", dbError);
                // Se der erro P2022, tentar buscar sem tenant_id (pode não existir a coluna ainda)
                if (dbError?.code === "P2022") {
                  console.log(
                    "⚠️  Coluna tenant_id não existe, tentando buscar tenant pelo slug..."
                  );
                  // Buscar tenant pelo slug do app
                  const tenantSlug =
                    request.headers.get("x-tenant-id") || "tamboril-burguer";
                  try {
                    const tenants = await prisma.$queryRawUnsafe<
                      Array<{ id: string }>
                    >(
                      `
                      SELECT id FROM tenants WHERE slug = $1 LIMIT 1
                    `,
                      tenantSlug
                    );
                    if (tenants.length > 0) {
                      tenantId = tenants[0].id;
                      console.log("✅ Tenant_id obtido pelo slug:", tenantId);
                    }
                  } catch (tenantError) {
                    console.error(
                      "Erro ao buscar tenant pelo slug:",
                      tenantError
                    );
                  }
                }
              }
            }
          } else {
            console.log("❌ Credenciais inválidas no Basic Auth");
          }
        }
      } catch (error) {
        console.error("Erro ao processar Basic Auth:", error);
        // Ignorar erro de parsing
      }
    }

    // Se não conseguiu pelo Basic Auth, tentar header ou API key
    if (!tenantId) {
      const tenantIdHeader =
        request.headers.get("x-tenant-id") ||
        request.headers.get("X-Tenant-Id");
      if (tenantIdHeader) {
        // Se for um UUID, usar diretamente. Se for slug, buscar o ID
        if (
          tenantIdHeader.match(
            /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
          )
        ) {
          tenantId = tenantIdHeader;
        } else {
          // É um slug, buscar o ID do tenant
          try {
            const { getTenantByApiKey } = await import("@/lib/tenant");
            const tenant = await getTenantByApiKey(tenantIdHeader);
            if (tenant) {
              tenantId = tenant.id;
            } else {
              // Tentar buscar pelo slug diretamente
              const tenants = await prisma.$queryRawUnsafe<
                Array<{ id: string }>
              >(
                `
                SELECT id FROM tenants WHERE slug = $1 LIMIT 1
              `,
                tenantIdHeader
              );
              if (tenants.length > 0) {
                tenantId = tenants[0].id;
              }
            }
          } catch (error) {
            console.error("Erro ao buscar tenant pelo header:", error);
          }
        }
      } else {
        // Tentar obter pela API key
        const apiKey =
          request.headers.get("x-api-key") || request.headers.get("X-API-Key");
        if (apiKey) {
          try {
            const { getTenantByApiKey } = await import("@/lib/tenant");
            const tenant = await getTenantByApiKey(apiKey);
            if (tenant) {
              tenantId = tenant.id;
            }
          } catch (error) {
            console.error("Erro ao buscar tenant pela API key:", error);
          }
        }
      }
    }

    // Último fallback: usar tenant padrão se não conseguir identificar
    if (!tenantId) {
      console.error("❌ Tenant não identificado. Headers:", {
        "x-tenant-id": request.headers.get("x-tenant-id"),
        "X-Tenant-Id": request.headers.get("X-Tenant-Id"),
        "x-api-key": request.headers.get("x-api-key") ? "presente" : "ausente",
        authorization: request.headers.get("authorization")
          ? "presente"
          : "ausente",
      });

      // Tentar buscar tenant padrão (tamboril-burguer) como último recurso
      try {
        const defaultTenants = await prisma.$queryRawUnsafe<
          Array<{ id: string }>
        >(`
          SELECT id FROM tenants WHERE slug = 'tamboril-burguer' LIMIT 1
        `);
        if (defaultTenants.length > 0) {
          tenantId = defaultTenants[0].id;
          console.log(
            "⚠️  Usando tenant padrão (tamboril-burguer) como fallback:",
            tenantId
          );
        } else {
          return NextResponse.json(
            {
              message:
                "Tenant não identificado. Forneça X-Tenant-Id no header, X-API-Key válida ou Basic Auth.",
            },
            { status: 400 }
          );
        }
      } catch (fallbackError: any) {
        // Se der erro, retornar lista vazia em vez de erro 500
        if (
          fallbackError?.code === "P2022" ||
          fallbackError?.code === "P2021"
        ) {
          console.log("⚠️  Tabela tenants não existe, retornando lista vazia");
          return NextResponse.json(
            {
              orders: [],
              pagination: {
                page: 1,
                limit: 20,
                total: 0,
                totalPages: 0,
                hasMore: false,
              },
            },
            { status: 200 }
          );
        }
        return NextResponse.json(
          {
            message:
              "Tenant não identificado. Forneça X-Tenant-Id no header, X-API-Key válida ou Basic Auth.",
          },
          { status: 400 }
        );
      }
    }

    console.log("✅ Tenant identificado:", tenantId);

    // Paginação
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;

    // Buscar todos os pedidos do tenant (todos os status) para app e dashboard
    // assim Rota (out_for_delivery) e Entregues (finished) aparecem no app
    let total = 0;
    let orders: any[] = [];

    try {
      total = await prisma.order.count({
        where: {
          tenant_id: tenantId,
        },
      });

      orders = await prisma.order.findMany({
        where: {
          tenant_id: tenantId,
        },
        orderBy: {
          created_at: "desc", // Mais recentes primeiro
        },
        skip,
        take: limit,
      });
    } catch (orderError: any) {
      console.error("Erro ao buscar pedidos:", orderError);
      if (orderError?.code === "P2022" || orderError?.code === "P2021") {
        // Tabela ou coluna não existe, retornar lista vazia
        return NextResponse.json(
          {
            orders: [],
            pagination: {
              page,
              limit,
              total: 0,
              totalPages: 0,
              hasMore: false,
            },
          },
          { status: 200 }
        );
      }
      throw orderError;
    }

    // Formatar os dados para o formato esperado pelo app
    const formattedOrders = orders.map((order) => {
      // Converter items de JSON para array se necessário
      let items = order.items;
      if (typeof items === "string") {
        try {
          items = JSON.parse(items);
        } catch (e) {
          items = [];
        }
      }
      if (!Array.isArray(items)) {
        items = [];
      }

      // Converter total_price para number se necessário
      let totalPrice: number = 0;
      const rawTotalPrice = order.total_price;

      if (typeof rawTotalPrice === "string") {
        totalPrice = parseFloat(rawTotalPrice);
      } else if (
        rawTotalPrice &&
        typeof rawTotalPrice === "object" &&
        "toNumber" in rawTotalPrice
      ) {
        totalPrice = (rawTotalPrice as any).toNumber();
      } else if (rawTotalPrice === null || rawTotalPrice === undefined) {
        totalPrice = 0;
      } else if (typeof rawTotalPrice === "number") {
        totalPrice = rawTotalPrice;
      }

      // Garantir que é um número válido
      if (typeof totalPrice !== "number" || isNaN(totalPrice)) {
        totalPrice = 0;
      }

      return {
        id: order.id,
        customer_name: order.customer_name,
        customer_phone: order.customer_phone,
        items: items.map((item: any) => ({
          id: item.id || item.name,
          name: item.name,
          quantity: item.quantity || 1,
          price:
            typeof item.price === "string"
              ? parseFloat(item.price)
              : item.price,
        })),
        total_price: totalPrice,
        status: order.status,
        created_at: order.created_at.toISOString(),
        display_id: order.display_id,
        daily_sequence: order.daily_sequence,
        order_type: order.order_type,
        appointment_date: (order as any).appointment_date?.toISOString?.() ?? null,
        delivery_address: order.delivery_address,
        payment_method: order.payment_method,
        estimated_time: order.estimated_time,
        print_requested_at:
          (order as any).print_requested_at?.toISOString?.() ?? null,
      };
    });

    return NextResponse.json(
      {
        orders: formattedOrders,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasMore: skip + limit < total,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Erro ao buscar pedidos:", error);
    console.error("Detalhes do erro:", {
      message: error?.message,
      code: error?.code,
      stack: error?.stack,
    });

    // SEMPRE retornar lista vazia em caso de erro (nunca erro 500 em produção)
    // Isso garante que o app não quebre mesmo se houver problemas no banco
    return NextResponse.json(
      {
        orders: [],
        pagination: {
          page: 1,
          limit: 20,
          total: 0,
          totalPages: 0,
          hasMore: false,
        },
      },
      { status: 200 }
    );
  }
}

/** Sanitiza itens para criação de pedido (local ou webhook). */
function sanitizeOrderItems(items: unknown): Array<{ id: string; name: string; quantity: number; price: number }> {
  if (!Array.isArray(items) || items.length === 0) return [];
  return items.map((item: any, index: number) => {
    const id =
      item?.id != null ? String(item.id).trim().substring(0, 100) || `item-${index}` : `item-${index}`;
    const name = String(item?.name ?? item?.nome ?? "").trim().substring(0, 500) || `Item ${index + 1}`;
    const quantity = Math.max(
      1,
      Math.min(1000, Math.floor(Number(item?.quantity ?? item?.quantidade ?? 1)) || 1)
    );
    const price = Math.max(
      0,
      Math.min(999999.99, Number(item?.price ?? item?.preco ?? 0) || 0)
    );
    return { id, name, quantity, price };
  });
}

export async function POST(request: NextRequest) {
  try {
    const tenantId = await getTenantIdFromRequest(request);
    if (!tenantId) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Tenant não identificado. Use X-Tenant-Id, X-API-Key ou Basic Auth.",
        },
        { status: 400 }
      );
    }

    const body = await request.json();
    const orderType =
      String(body?.order_type ?? "restaurante").trim().substring(0, 50);
    const slotId = typeof body?.slot_id === "string" ? body.slot_id.trim() : null;
    const isAppointment = orderType === "appointment" && slotId;

    // Agendamento (barbeiro): não exige loja aberta; valida slot e cria order + marca slot ocupado
    if (isAppointment) {
      const { getSlotById, bookSlot } = await import("@/lib/slots");
      const slot = await getSlotById(slotId!);
      if (!slot || slot.tenant_id !== tenantId || slot.status !== "available") {
        return NextResponse.json(
          { success: false, error: "Horário não disponível. Escolha outro." },
          { status: 400 }
        );
      }
      const customerName = String(body?.customer_name ?? "").trim().substring(0, 200);
      if (!customerName) {
        return NextResponse.json(
          { success: false, error: "Nome do cliente é obrigatório." },
          { status: 400 }
        );
      }
      let normalizedPhone = String(body?.customer_phone ?? "")
        .replace(/\D/g, "")
        .substring(0, 20);
      if (normalizedPhone.startsWith("55") && normalizedPhone.length > 11) {
        normalizedPhone = normalizedPhone.substring(2);
      }
      if (!normalizedPhone) {
        return NextResponse.json(
          { success: false, error: "Telefone do cliente é obrigatório." },
          { status: 400 }
        );
      }
      const rawItems = body?.items;
      const items = sanitizeOrderItems(rawItems);
      const totalPrice =
        typeof body?.total_price === "number"
          ? body.total_price
          : parseFloat(body?.total_price);
      const totalNum = Number.isFinite(totalPrice) && totalPrice >= 0 ? totalPrice : 0;
      const slotTime = new Date(slot.start_time);
      const displayId =
        String(slotTime.getHours()).padStart(2, "0") +
        ":" +
        String(slotTime.getMinutes()).padStart(2, "0");

      const order = await prisma.order.create({
        data: {
          tenant_id: tenantId,
          customer_name: customerName,
          customer_phone: normalizedPhone,
          items: (items.length ? items : [{ id: "servico", name: "Agendamento", quantity: 1, price: totalNum }]) as unknown as Prisma.InputJsonValue,
          total_price: new Prisma.Decimal(Math.max(0, totalNum)),
          status: "pending",
          payment_method: body?.payment_method ?? null,
          order_type: "appointment",
          appointment_date: slot.start_time,
          appointment_type: body?.appointment_type ?? "corte",
          display_id: displayId,
        },
      });
      await bookSlot(slotId!, order.id);
      const itemsFormatted = Array.isArray(order.items) ? (order.items as any[]) : [];
      return NextResponse.json(
        {
          success: true,
          order: {
            id: order.id,
            customer_name: order.customer_name,
            customer_phone: order.customer_phone,
            items: itemsFormatted,
            total_price: totalNum,
            status: order.status,
            created_at: order.created_at.toISOString(),
            display_id: order.display_id,
            appointment_date: slot.start_time.toISOString(),
            order_type: "appointment",
          },
        },
        { status: 201 }
      );
    }

    const storeStatus = getStoreStatus();
    if (!storeStatus.isOpen) {
      const message =
        storeStatus.message?.trim() ||
        (storeStatus.nextOpenTime
          ? `Loja fechada. Abre às ${storeStatus.nextOpenTime}.`
          : "Loja fechada no momento. Volte em breve.");
      return NextResponse.json(
        { success: false, error: message },
        { status: 403 }
      );
    }

    const customerName = String(body?.customer_name ?? "").trim().substring(0, 200);
    if (!customerName) {
      return NextResponse.json(
        { success: false, error: "Nome do cliente é obrigatório." },
        { status: 400 }
      );
    }

    const rawItems = body?.items;
    const items = sanitizeOrderItems(rawItems);
    if (items.length === 0) {
      return NextResponse.json(
        { success: false, error: "Informe ao menos um item no pedido." },
        { status: 400 }
      );
    }

    const totalPrice =
      typeof body?.total_price === "number"
        ? body.total_price
        : parseFloat(body?.total_price);
    if (!Number.isFinite(totalPrice) || totalPrice < 0) {
      return NextResponse.json(
        { success: false, error: "Preço total inválido." },
        { status: 400 }
      );
    }

    let normalizedPhone = String(body?.customer_phone ?? "")
      .replace(/\D/g, "")
      .substring(0, 20);
    if (normalizedPhone.startsWith("55") && normalizedPhone.length > 11) {
      normalizedPhone = normalizedPhone.substring(2);
    }
    if (!normalizedPhone) normalizedPhone = "local";

    const paymentMethod =
      String(body?.payment_method ?? "Não especificado").trim().substring(0, 100);
    const deliveryAddress =
      body?.delivery_address != null
        ? String(body.delivery_address).trim().substring(0, 500)
        : null;

    const ordersFromPhone = await prisma.order.count({
      where: {
        customer_phone: normalizedPhone,
        tenant_id: tenantId,
      },
    });
    const orderNumber = ordersFromPhone + 1;
    const customerTotalOrders = ordersFromPhone + 1;

    const { getTodayBRTBounds, formatDisplayId } = await import(
      "@/lib/order-display-id"
    );
    const { start: dayStart, end: dayEnd } = getTodayBRTBounds();
    const dailySequence =
      (await prisma.order.count({
        where: {
          tenant_id: tenantId,
          created_at: { gte: dayStart, lte: dayEnd },
        },
      })) + 1;
    const displayId = formatDisplayId(dailySequence);
    const estimatedTime = dailySequence * 20;

    const order = await prisma.order.create({
      data: {
        tenant_id: tenantId,
        customer_name: customerName,
        customer_phone: normalizedPhone,
        items: items as unknown as Prisma.InputJsonValue,
        total_price: new Prisma.Decimal(Math.max(0, Math.min(999999.99, totalPrice))),
        status: "pending",
        payment_method: paymentMethod,
        order_number: orderNumber,
        daily_sequence: dailySequence,
        display_id: displayId,
        customer_total_orders: customerTotalOrders,
        order_type: orderType,
        estimated_time: estimatedTime,
        delivery_address: deliveryAddress,
      },
    });

    let itemsFormatted = order.items as any[];
    if (typeof order.items === "string") {
      try {
        itemsFormatted = JSON.parse(order.items as string);
      } catch {
        itemsFormatted = [];
      }
    }
    if (!Array.isArray(itemsFormatted)) itemsFormatted = [];

    const rawTotal = order.total_price;
    let totalNum = 0;
    if (typeof rawTotal === "string") totalNum = parseFloat(rawTotal);
    else if (rawTotal && typeof rawTotal === "object" && "toNumber" in rawTotal)
      totalNum = (rawTotal as any).toNumber();
    else if (typeof rawTotal === "number") totalNum = rawTotal;

    return NextResponse.json(
      {
        success: true,
        order: {
          id: order.id,
          customer_name: order.customer_name,
          customer_phone: order.customer_phone,
          items: itemsFormatted.map((item: any) => ({
            id: item.id || item.name,
            name: item.name,
            quantity: item.quantity || 1,
            price:
              typeof item.price === "string"
                ? parseFloat(item.price)
                : item.price,
          })),
          total_price: totalNum,
          status: order.status,
          created_at: order.created_at.toISOString(),
          display_id: order.display_id,
          daily_sequence: order.daily_sequence,
          order_type: order.order_type,
          delivery_address: order.delivery_address,
          payment_method: order.payment_method,
          estimated_time: order.estimated_time,
          print_requested_at: (order as any).print_requested_at?.toISOString?.() ?? null,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Erro ao criar pedido (POST /api/orders):", error);
    if (error?.code === "P2002") {
      return NextResponse.json(
        { success: false, error: "Erro de duplicação no banco." },
        { status: 409 }
      );
    }
    if (error?.code === "P2003") {
      return NextResponse.json(
        {
          success: false,
          error:
            "Tenant ou referência inválida. Verifique se o tenant existe.",
        },
        { status: 400 }
      );
    }
    return NextResponse.json(
      {
        success: false,
        error: "Erro ao criar pedido.",
        details:
          process.env.NODE_ENV === "development" ? String(error?.message) : undefined,
      },
      { status: 500 }
    );
  }
}
