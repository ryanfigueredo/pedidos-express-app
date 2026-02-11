/**
 * GET /api/admin/inbox/conversations/[phone]
 * Retorna o histórico de mensagens da conversa com o cliente.
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
  const first = await prisma.tenant.findFirst({
    where: { is_active: true },
    select: { id: true },
  });
  return first?.id ?? null;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ phone: string }> }
) {
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

    const { phone: phoneParam } = await params;
    const phone = decodeURIComponent(phoneParam || "").replace(/\D/g, "");
    if (!phone) {
      return NextResponse.json({ error: "Telefone inválido" }, { status: 400 });
    }

    const tenantId = await getEffectiveTenantId(request);
    if (!tenantId) {
      return NextResponse.json({ messages: [] }, { status: 200 });
    }

    const phoneAlt =
      phone.length === 11 && /^[1-9]/.test(phone)
        ? "55" + phone
        : phone.length === 13 && phone.startsWith("55")
          ? phone.slice(2)
          : null;
    const phonesToMatch = phoneAlt && phoneAlt !== phone ? [phone, phoneAlt] : [phone];

    const messages = await prisma.botMessage.findMany({
      where: {
        tenant_id: tenantId,
        ...(phonesToMatch.length === 1
          ? { customer_phone: phonesToMatch[0] }
          : { customer_phone: { in: phonesToMatch } }),
      },
      orderBy: { created_at: "asc" },
      take: 200,
      select: {
        id: true,
        direction: true,
        body: true,
        created_at: true,
        attendant_name: true,
      },
    });

    const body = {
      messages: messages.map((m) => ({
        id: m.id,
        direction: m.direction as "in" | "out",
        body: m.body,
        created_at: m.created_at.toISOString(),
        attendant_name: m.attendant_name ?? null,
      })),
    };

    return new NextResponse(JSON.stringify(body), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store, max-age=0",
      },
    });
  } catch (e) {
    console.error("[Inbox messages]", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Erro ao carregar mensagens" },
      { status: 500 }
    );
  }
}
