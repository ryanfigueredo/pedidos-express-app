import { NextRequest, NextResponse } from "next/server";
import { getTenantByApiKey } from "@/lib/tenant";
import { getAvailableSlots } from "@/lib/slots";

/**
 * GET /api/bot/slots/available?date=YYYY-MM-DD
 * Retorna horários disponíveis para agendamento (barbeiro).
 * Requer X-API-Key do tenant.
 */
export async function GET(request: NextRequest) {
  try {
    const apiKey =
      request.headers.get("x-api-key") ||
      request.headers.get("X-API-Key") ||
      request.nextUrl.searchParams.get("api_key");
    const dateParam = request.nextUrl.searchParams.get("date");

    if (!apiKey) {
      return NextResponse.json(
        { error: "X-API-Key ou api_key é obrigatório" },
        { status: 401 }
      );
    }

    const tenant = await getTenantByApiKey(apiKey);
    if (!tenant) {
      return NextResponse.json(
        { error: "Tenant não encontrado" },
        { status: 404 }
      );
    }

    const date = dateParam ? new Date(dateParam) : new Date();
    if (Number.isNaN(date.getTime())) {
      return NextResponse.json(
        { error: "Parâmetro date inválido. Use YYYY-MM-DD" },
        { status: 400 }
      );
    }

    const slots = await getAvailableSlots(tenant.id, date);
    return NextResponse.json(
      { slots, date: date.toISOString().slice(0, 10) },
      { status: 200 }
    );
  } catch (error) {
    console.error("Erro ao buscar slots disponíveis:", error);
    return NextResponse.json(
      { error: "Erro ao buscar horários" },
      { status: 500 }
    );
  }
}
