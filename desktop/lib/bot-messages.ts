/**
 * Armazena e busca mensagens do WhatsApp para o inbox do atendimento (histórico).
 */

import { prisma } from "@/lib/prisma";

export async function getTenantIdFromConfig(slug?: string | null, apiKey?: string | null): Promise<string | null> {
  if (!slug && !apiKey) return getFirstTenantId();
  try {
    const tenant = await prisma.tenant.findFirst({
      where: {
        OR: [
          ...(slug ? [{ slug: slug.trim() }] : []),
          ...(apiKey ? [{ api_key: apiKey.trim() }] : []),
        ].filter(Boolean) as Array<{ slug?: string; api_key?: string }>,
        is_active: true,
      },
      select: { id: true },
    });
    return tenant?.id ?? getFirstTenantId();
  } catch {
    return getFirstTenantId();
  }
}

/** Primeiro tenant ativo (para single-tenant: sempre salvar mensagem no inbox). */
export async function getFirstTenantId(): Promise<string | null> {
  try {
    const tenant = await prisma.tenant.findFirst({
      where: { is_active: true },
      select: { id: true },
    });
    return tenant?.id ?? null;
  } catch {
    return null;
  }
}

export async function storeBotMessage(params: {
  tenantId: string;
  phoneNumberId: string;
  customerPhone: string;
  direction: "in" | "out";
  body: string;
  wamid?: string | null;
  attendantName?: string | null;
}): Promise<void> {
  try {
    const cleanPhone = String(params.customerPhone).replace(/\D/g, "");
    if (!cleanPhone) return;
    await prisma.botMessage.create({
      data: {
        tenant_id: params.tenantId,
        phone_number_id: params.phoneNumberId || null,
        customer_phone: cleanPhone,
        direction: params.direction,
        body: params.body,
        wamid: params.wamid ?? null,
        attendant_name: params.attendantName ?? null,
      },
    });
  } catch (e) {
    console.error("[BotMessages] Erro ao salvar:", e);
  }
}
