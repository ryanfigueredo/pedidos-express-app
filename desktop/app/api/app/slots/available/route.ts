import { NextRequest, NextResponse } from "next/server";
import { getAvailableSlots } from "@/lib/slots";

/**
 * GET /api/app/slots/available?date=YYYY-MM-DD
 * Retorna horários LIVRES para o tenant do usuário logado (Basic Auth).
 * Usado pelo app do barbeiro para exibir "Horários livres".
 */
export async function GET(request: NextRequest) {
  try {
    let tenantId: string | null = null;
    const authHeader =
      request.headers.get("authorization") ||
      request.headers.get("Authorization");
    if (authHeader?.startsWith("Basic ")) {
      try {
        const base64Credentials = authHeader.split(" ")[1];
        const credentials = Buffer.from(base64Credentials, "base64").toString("utf-8");
        const [username, password] = credentials.split(":");
        if (username && password) {
          const { verifyCredentials } = await import("@/lib/auth-session");
          const user = await verifyCredentials(username, password);
          if (user?.tenant_id) tenantId = user.tenant_id;
        }
      } catch (_) {}
    }
    if (!tenantId) {
      return NextResponse.json(
        { error: "Não autorizado. Faça login no app." },
        { status: 401 }
      );
    }

    const dateParam = request.nextUrl.searchParams.get("date");
    const date = dateParam ? new Date(dateParam) : new Date();
    if (Number.isNaN(date.getTime())) {
      return NextResponse.json(
        { error: "Parâmetro date inválido. Use YYYY-MM-DD" },
        { status: 400 }
      );
    }

    const slots = await getAvailableSlots(tenantId, date);
    return NextResponse.json(
      { slots, date: date.toISOString().slice(0, 10) },
      { status: 200 }
    );
  } catch (error) {
    console.error("Erro ao buscar slots no app:", error);
    return NextResponse.json(
      { error: "Erro ao buscar horários" },
      { status: 500 }
    );
  }
}
