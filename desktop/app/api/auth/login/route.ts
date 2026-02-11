import { NextRequest, NextResponse } from "next/server";
import { verifyCredentials, createSession } from "@/lib/auth-session";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json(
        { success: false, error: "Username e senha são obrigatórios" },
        { status: 400 }
      );
    }

    // Verificar credenciais
    const user = await verifyCredentials(username, password);

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Credenciais inválidas" },
        { status: 401 }
      );
    }

    // Criar sessão
    await createSession(user.id);

    // Buscar informações do tenant para incluir business_type
    let tenantInfo: any = null
    if (user.tenant_id) {
      try {
        const { prisma } = await import('@/lib/prisma')
        tenantInfo = await prisma.tenant.findUnique({
          where: { id: user.tenant_id },
          select: {
            id: true,
            name: true,
            slug: true,
            business_type: true,
            show_prices_on_bot: true,
          },
        })
      } catch (tenantError) {
        console.error('Erro ao buscar tenant:', tenantError)
      }
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role,
        tenant_id: user.tenant_id,
        business_type: tenantInfo?.business_type || 'RESTAURANTE',
        show_prices_on_bot: tenantInfo?.show_prices_on_bot ?? true,
        tenant_name: tenantInfo?.name,
        tenant_slug: tenantInfo?.slug,
      },
    });
  } catch (error: unknown) {
    console.error("Erro no login:", error);
    const message =
      error &&
      typeof error === "object" &&
      "message" in error &&
      typeof (error as { message?: string }).message === "string"
        ? (error as { message: string }).message
        : "";
    const isDbUnreachable =
      message.includes("Can't reach database") ||
      message.includes("PrismaClientInitializationError") ||
      message.includes("ECONNREFUSED") ||
      message.includes("ETIMEDOUT");
    const userError = isDbUnreachable
      ? "Serviço temporariamente indisponível. O banco de dados pode estar pausado (Neon) ou fora do ar. Tente novamente em instantes."
      : "Erro ao conectar. Tente novamente.";
    return NextResponse.json(
      { success: false, error: userError },
      { status: 500 }
    );
  }
}
