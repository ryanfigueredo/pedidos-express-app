/**
 * GET /api/admin/inbox/conversations
 * Lista todas as conversas do WhatsApp (clientes que já trocaram mensagem com o bot).
 * Sempre disponível; não só quando o cliente pede atendente.
 */

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-session";
import { validateApiKey, validateBasicAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

async function getEffectiveTenantId(request: NextRequest): Promise<string | null> {
  const session = await getSession();
  if (session?.id) {
    const user = await prisma.user.findUnique({
      where: { id: session.id },
      select: { tenant_id: true },
    });
    if (user?.tenant_id) return user.tenant_id;
  }
  try {
    const apiValidation = await validateApiKey(request);
    if (apiValidation.isValid && apiValidation.tenant) return apiValidation.tenant.id;
  } catch (_) {}
  try {
    const basicAuth = await validateBasicAuth(request);
    if (basicAuth.isValid && basicAuth.user?.tenant_id) return basicAuth.user.tenant_id;
  } catch (_) {}
  // Super admin sem tenant: usar primeiro tenant ativo
  const first = await prisma.tenant.findFirst({
    where: { is_active: true },
    select: { id: true },
  });
  return first?.id ?? null;
}

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    let apiValid = false;
    let basicValid = false;
    try {
      const r = await validateApiKey(request);
      apiValid = r.isValid;
    } catch (_) {}
    try {
      const r = await validateBasicAuth(request);
      basicValid = r.isValid;
    } catch (_) {}
    if (!session && !apiValid && !basicValid) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const tenantId = await getEffectiveTenantId(request);
    if (!tenantId) {
      return NextResponse.json({ conversations: [], total: 0 }, { status: 200 });
    }

    const rows = await prisma.botMessage.groupBy({
      by: ["customer_phone"],
      where: { tenant_id: tenantId },
      _max: { created_at: true },
      _count: { id: true },
    });

    const conversations = await Promise.all(
      rows.slice(0, 100).map(async (r) => {
        const lastMsg = await prisma.botMessage.findFirst({
          where: { tenant_id: tenantId, customer_phone: r.customer_phone },
          orderBy: { created_at: "desc" },
          select: { body: true, direction: true },
        });
        const customerName = await prisma.order.findFirst({
          where: {
            tenant_id: tenantId,
            customer_phone: { contains: r.customer_phone.slice(-8) },
          },
          orderBy: { created_at: "desc" },
          select: { customer_name: true },
        });
        return {
          customer_phone: r.customer_phone,
          customer_name: customerName?.customer_name ?? null,
          last_message_at: r._max.created_at?.toISOString() ?? null,
          last_message: lastMsg?.body ?? null,
          last_direction: lastMsg?.direction ?? "in",
          message_count: r._count.id,
        };
      })
    );

    conversations.sort((a, b) => {
      const ta = a.last_message_at ? new Date(a.last_message_at).getTime() : 0;
      const tb = b.last_message_at ? new Date(b.last_message_at).getTime() : 0;
      return tb - ta;
    });

    return NextResponse.json({
      conversations,
      total: conversations.length,
    });
  } catch (e) {
    console.error("[Inbox conversations]", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Erro ao listar conversas" },
      { status: 500 }
    );
  }
}
