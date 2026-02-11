import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

const GRAPH_VERSION = process.env.WHATSAPP_GRAPH_VERSION || "v21.0";

/**
 * POST - Envia mensagem WhatsApp ao cliente informando que o pedido foi impresso
 * "Seu pedido foi impresso pela cozinha e já já estará na sua casa!"
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: orderId } = await params;

  try {
    const authUser = await getAuthUser(request);
    if (!authUser) {
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

    if (authUser.tenant_id && order.tenant_id !== authUser.tenant_id) {
      return NextResponse.json(
        { success: false, error: "Acesso negado" },
        { status: 403 }
      );
    }

    const token = process.env.TOKEN_API_META;
    const phoneNumberId = process.env.PHONE_NUMBER_ID;
    if (!token || !phoneNumberId) {
      return NextResponse.json(
        {
          success: false,
          error: "WhatsApp não configurado (TOKEN_API_META, PHONE_NUMBER_ID)",
        },
        { status: 500 }
      );
    }

    let phone = String(order.customer_phone).replace(/\D/g, "");
    if (!phone.startsWith("55") && phone.length >= 10) {
      phone = `55${phone}`;
    }

    const displayId = order.display_id || `#${order.daily_sequence || "?"}`;
    const message = `✅ *Pedido ${displayId} impresso!*\n\nSeu pedido foi impresso pela cozinha e já já estará na sua casa! 🍔🚀`;

    const url = `https://graph.facebook.com/${GRAPH_VERSION}/${phoneNumberId}/messages`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: phone,
        type: "text",
        text: { body: message },
      }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      console.error("[notify-printed] Meta API erro:", res.status, data);
      return NextResponse.json(
        { success: false, error: data?.error?.message || "Erro ao enviar" },
        { status: res.status }
      );
    }

    return NextResponse.json({ success: true });
  } catch (e: any) {
    console.error("[notify-printed] Erro:", e);
    return NextResponse.json(
      { success: false, error: e?.message || "Erro interno" },
      { status: 500 }
    );
  }
}
