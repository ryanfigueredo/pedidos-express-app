/**
 * Diagnóstico do webhook WhatsApp - identifica por que o bot não responde
 * GET: https://SEU-DOMINIO.vercel.app/api/webhook/meta/diagnostico
 */
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  // Número de produção Tamboril (+55 21 99904-4219)
  const phoneNumberId = process.env.PHONE_NUMBER_ID || "983471751512371";
  const result: Record<string, unknown> = {
    ok: false,
    timestamp: new Date().toISOString(),
    checks: {} as Record<string, unknown>,
  };

  // 1. Variáveis de ambiente
  const hasAwsKey = !!process.env.AWS_ACCESS_KEY_ID;
  const hasAwsSecret = !!process.env.AWS_SECRET_ACCESS_KEY;
  const hasVerifyToken = !!(
    process.env.WHATSAPP_VERIFY_TOKEN || process.env.WEBHOOK_VERIFY_TOKEN
  );
  const tableName = process.env.DYNAMODB_TABLE_NAME || "bot-delivery";

  result.checks = {
    aws_configured: hasAwsKey && hasAwsSecret,
    aws_key_set: hasAwsKey,
    aws_secret_set: hasAwsSecret,
    verify_token_set: hasVerifyToken,
    dynamodb_table: tableName,
    phone_number_id_env: phoneNumberId,
  };

  if (!hasAwsKey || !hasAwsSecret) {
    result.ok = false;
    result.erro =
      "AWS_ACCESS_KEY_ID ou AWS_SECRET_ACCESS_KEY não configurados na Vercel";
    return NextResponse.json(result);
  }

  // 2. Buscar config no DynamoDB
  try {
    const { getClientConfig } = await import("@/lib/whatsapp-bot/dynamodb");
    const config = await getClientConfig(phoneNumberId);
    (result.checks as Record<string, unknown>).config_encontrada = !!config;
    (result.checks as Record<string, unknown>).config_restaurante = !!(
      config?.tenant_slug && config?.tenant_api_key
    );

    if (!config) {
      result.ok = false;
      result.erro =
        `Config NÃO encontrada no DynamoDB para phone_number_id=${phoneNumberId}. ` +
        `Rode: cd bot && DYNAMODB_TABLE_NAME=bot-delivery node add-tamboril-client.js`;
      return NextResponse.json(result);
    }

    result.ok = true;
    result.mensagem =
      "Tudo OK! Se o bot ainda não responde, verifique: " +
      "1) Webhook na Meta aponta para a URL correta; " +
      "2) Campo 'messages' está marcado; " +
      "3) App em modo Live (não Development) para números BR";
  } catch (e: unknown) {
    const err = e as Error;
    result.ok = false;
    result.erro = `Erro DynamoDB: ${err.message}`;
  }

  return NextResponse.json(result);
}
