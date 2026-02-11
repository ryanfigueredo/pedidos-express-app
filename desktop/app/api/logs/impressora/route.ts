import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";

// Armazenar logs em memória (últimas 1000 entradas)
// Em produção, você pode usar Redis ou banco de dados
const logs: Array<{
  id: string;
  timestamp: string;
  level: "info" | "warn" | "error" | "success";
  message: string;
  details?: any;
  deviceId?: string;
  orderId?: string;
}> = [];

// Limitar a 1000 logs
const MAX_LOGS = 1000;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { level, message, details, deviceId, orderId } = body;

    // Aceitar logs sem autenticação (vindos do app mobile)
    // Ou verificar API Key se presente
    const apiKey = request.headers.get("X-API-Key");
    const tenantId = request.headers.get("X-Tenant-Id");

    const logEntry = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      level: level || "info",
      message: message || "",
      details,
      deviceId,
      orderId,
    };

    logs.push(logEntry);

    // Manter apenas os últimos MAX_LOGS
    if (logs.length > MAX_LOGS) {
      logs.shift();
    }

    console.log(
      `[PrinterLog] ${level.toUpperCase()}: ${message}`,
      details || ""
    );

    return NextResponse.json({ success: true, id: logEntry.id });
  } catch (error: any) {
    console.error("Erro ao salvar log:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticação
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "100");
    const level = searchParams.get("level") as
      | "info"
      | "warn"
      | "error"
      | "success"
      | null;

    let filteredLogs = [...logs];

    // Filtrar por nível se especificado
    if (level) {
      filteredLogs = filteredLogs.filter((log) => log.level === level);
    }

    // Ordenar por timestamp (mais recentes primeiro) e limitar
    filteredLogs = filteredLogs
      .sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      )
      .slice(0, limit);

    return NextResponse.json({
      success: true,
      logs: filteredLogs,
      total: logs.length,
    });
  } catch (error: any) {
    console.error("Erro ao buscar logs:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
