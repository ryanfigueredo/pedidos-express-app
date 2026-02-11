import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { updateWhatsAppClientNome } from "@/lib/whatsapp-dynamodb";

/**
 * GET - Retorna perfil do tenant (nome, logo_url) do usuário autenticado
 */
export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) {
      return NextResponse.json(
        { success: false, error: "Não autenticado" },
        { status: 401 }
      );
    }

    // Master não tem tenant - retornar null
    if (!authUser.tenant_id) {
      return NextResponse.json({
        success: true,
        profile: null,
      });
    }

    const tenant = await prisma.tenant.findUnique({
      where: { id: authUser.tenant_id },
      select: { id: true, name: true, logo_url: true, slug: true },
    });

    if (!tenant) {
      return NextResponse.json({
        success: true,
        profile: null,
      });
    }

    return NextResponse.json({
      success: true,
      profile: {
        id: tenant.id,
        name: tenant.name,
        logo_url: tenant.logo_url,
        slug: tenant.slug,
      },
    });
  } catch (error) {
    console.error("[tenant-profile] GET Erro:", error);
    return NextResponse.json(
      { success: false, error: "Erro ao buscar perfil" },
      { status: 500 }
    );
  }
}

/**
 * PATCH - Atualiza nome da loja (e sincroniza com bot/DynamoDB)
 */
export async function PATCH(request: NextRequest) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) {
      return NextResponse.json(
        { success: false, error: "Não autenticado" },
        { status: 401 }
      );
    }

    if (!authUser.tenant_id) {
      return NextResponse.json(
        { success: false, error: "Master não possui tenant" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name } = body;

    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json(
        { success: false, error: "Nome é obrigatório" },
        { status: 400 }
      );
    }

    const tenant = await prisma.tenant.update({
      where: { id: authUser.tenant_id },
      data: { name: name.trim() },
    });

    // Sincronizar nome com DynamoDB (bot usa nome_do_cliente nas mensagens)
    const phoneNumberId = process.env.PHONE_NUMBER_ID;
    if (phoneNumberId) {
      await updateWhatsAppClientNome(phoneNumberId, tenant.name);
    }

    return NextResponse.json({
      success: true,
      profile: {
        id: tenant.id,
        name: tenant.name,
        logo_url: tenant.logo_url,
      },
    });
  } catch (error) {
    console.error("[tenant-profile] PATCH Erro:", error);
    return NextResponse.json(
      { success: false, error: "Erro ao atualizar perfil" },
      { status: 500 }
    );
  }
}
