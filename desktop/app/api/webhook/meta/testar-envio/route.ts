/**
 * Testa envio direto via Meta API - identifica se o problema é:
 * - DynamoDB (config não encontrada)
 * - Token (erro ao enviar)
 * - Webhook (Meta não envia para nós)
 *
 * GET: /api/webhook/meta/testar-envio?to=5521997624873
 */
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const GRAPH_VERSION = process.env.WHATSAPP_GRAPH_VERSION || "v21.0";
const PHONE_NUMBER_ID = "983471751512371";

export async function GET(request: NextRequest) {
  const to = request.nextUrl.searchParams.get("to") || "5521997624873";

  const result: Record<string, unknown> = {
    ok: false,
    passo: "",
    erro: "",
    meta_status: null as number | null,
    meta_error: null as string | null,
  };

  try {
    // 1. Buscar config no DynamoDB
    const { getWhatsAppClientConfig } = await import("@/lib/whatsapp-dynamodb");
    const config = await getWhatsAppClientConfig(PHONE_NUMBER_ID);

    if (!config?.token_api_meta) {
      result.passo = "DynamoDB";
      result.erro =
        "Config não encontrada. Rode: cd bot && DYNAMODB_TABLE_NAME=bot-delivery node add-tamboril-client.js";
      return NextResponse.json(result);
    }

    // 2. Tentar enviar mensagem via Meta API
    const phone = String(to).replace(/\D/g, "");
    const res = await fetch(
      `https://graph.facebook.com/${GRAPH_VERSION}/${PHONE_NUMBER_ID}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${config.token_api_meta}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: phone,
          type: "text",
          text: {
            body: "✅ Teste do bot Tamboril - se você recebeu, o backend está OK!",
          },
        }),
      }
    );

    const body = await res.text();
    let parsed: Record<string, unknown> = {};
    try {
      parsed = JSON.parse(body);
    } catch (_) {}

    result.meta_status = res.status;
    result.meta_error = body.slice(0, 500);

    if (res.ok) {
      result.ok = true;
      result.passo = "sucesso";
      result.erro = null;
      result.mensagem =
        "Mensagem enviada! Se você recebeu no WhatsApp = token e Meta API OK. Se o bot não responde ao 'oi' = Meta não está enviando webhooks para nossa URL.";
      return NextResponse.json(result);
    }

    result.passo = "Meta API";
    result.erro = (parsed as any)?.error?.message || body;
  } catch (e: unknown) {
    result.passo = "exceção";
    result.erro = (e as Error).message;
  }

  return NextResponse.json(result);
}
