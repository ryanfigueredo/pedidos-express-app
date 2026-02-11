import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { upsertDynamoDBConfig, isDynamoDBEnabled } from "@/lib/dynamodb-admin";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) {
      return NextResponse.json(
        { success: false, error: "Não autenticado" },
        { status: 401 }
      );
    }

    if (authUser.tenant_id) {
      return NextResponse.json(
        { success: false, error: "Acesso negado. Apenas super admin." },
        { status: 403 }
      );
    }

    if (!isDynamoDBEnabled()) {
      return NextResponse.json(
        {
          success: false,
          error:
            "DynamoDB não está configurado. Configure AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY e DYNAMODB_TABLE_NAME.",
        },
        { status: 400 }
      );
    }

    const tenantId = params.id;
    const body = await request.json();

    const {
      phone_number_id,
      business_account_id,
      token_api_meta,
      meta_verify_token,
      desktop_api_url,
    } = body;

    if (!phone_number_id || !token_api_meta) {
      return NextResponse.json(
        {
          success: false,
          error: "phone_number_id e token_api_meta são obrigatórios",
        },
        { status: 400 }
      );
    }

    // Buscar tenant
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      return NextResponse.json(
        { success: false, error: "Tenant não encontrado" },
        { status: 404 }
      );
    }

    // Criar/atualizar no DynamoDB
    const result = await upsertDynamoDBConfig({
      phone_number_id,
      business_account_id,
      token_api_meta,
      meta_verify_token,
      tenant_slug: tenant.slug,
      tenant_api_key: tenant.api_key,
      desktop_api_url:
        desktop_api_url ||
        process.env.NEXT_PUBLIC_API_URL ||
        process.env.DESKTOP_API_URL ||
        "https://pedidos-express-api.vercel.app",
      nome_do_cliente: tenant.name,
      business_type: tenant.business_type || "RESTAURANTE",
      show_prices_on_bot: tenant.show_prices_on_bot !== false,
    });

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      );
    }

    // Atualizar tenant com informações do Meta (opcional)
    await prisma.tenant.update({
      where: { id: tenantId },
      data: {
        meta_phone_number_id: phone_number_id,
        meta_access_token: token_api_meta, // Pode ser criptografado depois
        meta_verify_token: meta_verify_token || undefined,
        meta_business_account_id: business_account_id || undefined,
        bot_configured: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Configuração do DynamoDB salva com sucesso",
    });
  } catch (error: any) {
    console.error("Erro ao salvar configuração DynamoDB:", error);
    return NextResponse.json(
      { success: false, error: "Erro ao salvar configuração" },
      { status: 500 }
    );
  }
}
