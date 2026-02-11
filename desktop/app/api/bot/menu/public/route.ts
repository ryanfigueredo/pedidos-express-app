import { NextRequest, NextResponse } from "next/server";
import { getTenantByApiKey } from "@/lib/tenant";
import { getMenuItems } from "@/lib/menu-data";

/**
 * API pública de cardápio para o bot WhatsApp.
 * Aceita X-API-Key ou api_key (query). Se inválido ou ausente, retorna menu padrão (público).
 */
export async function GET(request: NextRequest) {
  try {
    const apiKey =
      request.headers.get("x-api-key") ||
      request.headers.get("X-API-Key") ||
      request.nextUrl.searchParams.get("api_key");

    if (apiKey) {
      const tenant = await getTenantByApiKey(apiKey);
      if (tenant) {
        const items = getMenuItems(tenant.id);
        return NextResponse.json(
          { items, tenant_id: tenant.id, tenant_slug: tenant.slug },
          { status: 200 }
        );
      }
    }

    // Sem API key ou inválida: retorna menu padrão (cardápio é público)
    const items = getMenuItems();
    return NextResponse.json(
      { items, tenant_id: null, tenant_slug: null },
      { status: 200 }
    );
  } catch (error) {
    console.error("Erro ao buscar menu público:", error);
    return NextResponse.json(
      { error: "Erro ao buscar cardápio" },
      { status: 500 }
    );
  }
}
