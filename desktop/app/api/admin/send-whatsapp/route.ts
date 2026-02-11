import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-session";
import { validateApiKey, validateBasicAuth } from "@/lib/auth";
import { checkMessageLimit, incrementMessageUsage } from "@/lib/message-limits";
import { prisma } from "@/lib/prisma";

const GRAPH_VERSION = process.env.WHATSAPP_GRAPH_VERSION || "v21.0";

/**
 * Envia mensagem WhatsApp via Meta Cloud API
 * Usado pelo atendimento (desktop e app) para responder clientes
 */
export async function POST(request: NextRequest) {
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
      return NextResponse.json(
        { success: false, error: "Não autenticado" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { phone, message, attendant_name: attendantName } = body;
    if (!phone || !message) {
      return NextResponse.json(
        { success: false, error: "phone e message são obrigatórios" },
        { status: 400 }
      );
    }

    // Identificar tenant
    let tenantId: string | null = null;
    if (session) {
      const user = await prisma.user.findUnique({
        where: { id: session.id },
        select: { tenant_id: true }
      });
      tenantId = user?.tenant_id || null;
    } else {
      const apiValidation = await validateApiKey(request);
      if (apiValidation.isValid && apiValidation.tenant) {
        tenantId = apiValidation.tenant.id;
      } else {
        const basicAuth = await validateBasicAuth(request);
        if (basicAuth.isValid && basicAuth.user?.tenant_id) {
          tenantId = basicAuth.user.tenant_id;
        }
      }
    }

    // Verificar limite de mensagens
    if (tenantId) {
      try {
        const limitCheck = await checkMessageLimit(tenantId);
        if (!limitCheck.allowed) {
          return NextResponse.json(
            {
              success: false,
              error: `Limite de mensagens excedido. Plano: ${limitCheck.planName} (${limitCheck.current}/${limitCheck.limit} mensagens usadas). Entre em contato para fazer upgrade.`,
              limit_info: {
                current: limitCheck.current,
                limit: limitCheck.limit,
                plan: limitCheck.planName,
                percentage: limitCheck.percentage
              }
            },
            { status: 429 }
          );
        }
      } catch (error) {
        console.error("[SendWhatsApp] Erro ao verificar limite:", error);
        // Não bloqueia se houver erro na verificação, mas loga
      }
    }

    const token = process.env.TOKEN_API_META;
    const phoneNumberId = process.env.PHONE_NUMBER_ID;
    if (!token || !phoneNumberId) {
      return NextResponse.json(
        {
          success: false,
          error: "TOKEN_API_META e PHONE_NUMBER_ID não configurados",
        },
        { status: 500 }
      );
    }

    let whatsappPhone = String(phone).replace(/\D/g, "");
    if (!whatsappPhone.startsWith("55") && whatsappPhone.length >= 10) {
      whatsappPhone = `55${whatsappPhone}`;
    }

    const url = `https://graph.facebook.com/${GRAPH_VERSION}/${phoneNumberId}/messages`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: whatsappPhone,
        type: "text",
        text: { body: String(message).slice(0, 4096) },
      }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      console.error("[SendWhatsApp] Meta API erro:", res.status, data);
      return NextResponse.json(
        { success: false, error: data?.error?.message || "Erro ao enviar" },
        { status: res.status }
      );
    }

    // Incrementar contador de mensagens se envio foi bem-sucedido
    if (tenantId) {
      try {
        await incrementMessageUsage(tenantId, 1);
      } catch (error) {
        console.error("[SendWhatsApp] Erro ao incrementar uso:", error);
        // Não falha a operação, apenas loga
      }
      // Persistir no histórico do atendimento (inbox)
      try {
        const { storeBotMessage } = await import("@/lib/bot-messages");
        await storeBotMessage({
          tenantId,
          phoneNumberId: phoneNumberId!,
          customerPhone: whatsappPhone,
          direction: "out",
          body: String(message).slice(0, 4096),
          attendantName: attendantName ?? null,
        });
      } catch (storeErr) {
        console.error("[SendWhatsApp] Erro ao salvar no histórico:", storeErr);
      }
    }

    return NextResponse.json({ success: true });
  } catch (e: any) {
    console.error("[SendWhatsApp] Erro:", e);
    return NextResponse.json(
      { success: false, error: e?.message || "Erro interno" },
      { status: 500 }
    );
  }
}
