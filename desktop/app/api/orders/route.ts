import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getStoreStatus } from "@/lib/store-status";
import { Prisma } from "@prisma/client";
import { getTenantIdFromRequest } from "@/lib/tenant-from-request";
import { getAgendaDateRange } from "@/lib/agenda-date-range";

// Forçar rota dinâmica (não pode ser renderizada estaticamente)
export const dynamic = "force-dynamic";

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

    // Obter tenant_id APENAS do usuário autenticado (sessão/Basic Auth) ou header/API key explícitos. NUNCA fallback para outro tenant.
    const tenantId = await getTenantIdFromRequest(request);

    // NUNCA retornar dados de outro tenant: se não identificou o tenant, retornar 403
    if (!tenantId) {
      console.error("❌ Tenant não identificado (multi-tenancy). Headers:", {
        "x-tenant-id": request.headers.get("x-tenant-id"),
        "X-Tenant-Id": request.headers.get("X-Tenant-Id"),
        "x-api-key": request.headers.get("x-api-key") ? "presente" : "ausente",
        authorization: request.headers.get("authorization")
          ? "presente"
          : "ausente",
      });
      return NextResponse.json(
        {
          message:
            "Tenant não identificado. Autentique-se com um usuário associado a um tenant ou forneça X-Tenant-Id/X-API-Key do seu tenant.",
          orders: [],
          pagination: {
            page: 1,
            limit: 20,
            total: 0,
            totalPages: 0,
            hasMore: false,
          },
        },
        { status: 403 }
      );
    }

    console.log("✅ Tenant identificado:", tenantId);

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 200);
    const skip = (page - 1) * limit;
    const agendaDays = searchParams.get("agenda_days");
    const useAgendaFilter = agendaDays != null && /^[1-9]\d*$/.test(agendaDays);
    const daysAhead = useAgendaFilter ? parseInt(agendaDays, 10) : 0;
    const { startOfToday, endOfRange, twoDaysAgo } = useAgendaFilter
      ? getAgendaDateRange(daysAhead)
      : { startOfToday: null, endOfRange: null, twoDaysAgo: null };

    let total = 0;
    let orders: any[] = [];

    try {
      const whereClause: Prisma.OrderWhereInput = {
        tenant_id: tenantId,
      };
      if (useAgendaFilter && startOfToday && endOfRange && twoDaysAgo) {
        whereClause.OR = [
          { appointment_date: null, created_at: { gte: twoDaysAgo } },
          { appointment_date: { gte: startOfToday, lt: endOfRange } },
        ];
      }
      total = await prisma.order.count({ where: whereClause });
      orders = await prisma.order.findMany({
        where: whereClause,
        orderBy: useAgendaFilter
          ? [{ appointment_date: "asc" }, { created_at: "desc" }]
          : { created_at: "desc" },
        skip: useAgendaFilter ? 0 : skip,
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

    // Agendamento manual (app iOS: barbeiro adiciona cliente pessoalmente, sem slot_id)
    const appointmentDateRaw = body?.appointment_date;
    const isManualAppointment =
      orderType === "appointment" &&
      !slotId &&
      appointmentDateRaw != null &&
      String(appointmentDateRaw).trim() !== "";

    if (isManualAppointment) {
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
      if (!normalizedPhone) normalizedPhone = "local";

      const rawItems = body?.items;
      const items = sanitizeOrderItems(rawItems);
      const totalPrice =
        typeof body?.total_price === "number"
          ? body.total_price
          : parseFloat(body?.total_price);
      const totalNum = Number.isFinite(totalPrice) && totalPrice >= 0 ? totalPrice : 0;

      let appointmentDate: Date;
      try {
        appointmentDate = new Date(appointmentDateRaw);
      } catch {
        return NextResponse.json(
          { success: false, error: "Data/hora do agendamento inválida." },
          { status: 400 }
        );
      }
      if (Number.isNaN(appointmentDate.getTime())) {
        return NextResponse.json(
          { success: false, error: "Data/hora do agendamento inválida." },
          { status: 400 }
        );
      }

      const displayId =
        String(appointmentDate.getHours()).padStart(2, "0") +
        ":" +
        String(appointmentDate.getMinutes()).padStart(2, "0");

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
          appointment_date: appointmentDate,
          appointment_type: body?.appointment_type ?? "corte",
          display_id: displayId,
        },
      });

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
            appointment_date: appointmentDate.toISOString(),
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
