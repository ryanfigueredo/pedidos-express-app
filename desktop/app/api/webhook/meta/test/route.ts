/**
 * Teste: confirma se o webhook está recebendo requests.
 * GET: curl "https://pedidos-express-api.vercel.app/api/webhook/meta/test"
 * POST: simula o que a Meta envia
 */
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  console.log("[Meta Webhook TEST] GET recebido - webhook está funcionando!");
  return NextResponse.json({
    ok: true,
    message: "Webhook está ativo. Se viu este log, o deploy está OK.",
    timestamp: new Date().toISOString(),
  });
}

export async function POST(request: NextRequest) {
  console.log("[Meta Webhook TEST] POST recebido!");
  try {
    const body = await request.json();
    const phoneId =
      body?.entry?.[0]?.changes?.[0]?.value?.metadata?.phone_number_id;
    console.log(
      "[Meta Webhook TEST] phone_number_id:",
      phoneId,
      "body keys:",
      Object.keys(body || {})
    );
    return NextResponse.json({ ok: true, phone_number_id: phoneId });
  } catch (e) {
    console.error("[Meta Webhook TEST] Erro:", e);
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
