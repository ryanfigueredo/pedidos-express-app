import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

/**
 * GET - Retorna dados do perfil do tenant
 */
export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser || !authUser.tenant_id) {
      return NextResponse.json(
        { success: false, error: "Não autenticado" },
        { status: 401 }
      );
    }

    const tenant = await prisma.tenant.findUnique({
      where: { id: authUser.tenant_id },
      select: {
        customer_cpf_cnpj: true,
        customer_phone: true,
        customer_postal_code: true,
        customer_address: true,
        customer_address_number: true,
        customer_address_complement: true,
        customer_province: true,
        customer_city: true,
        customer_state: true,
      },
    });

    if (!tenant) {
      return NextResponse.json(
        { success: false, error: "Tenant não encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      profile: tenant,
    });
  } catch (error: any) {
    console.error("[Profile] GET Erro:", error);
    return NextResponse.json(
      { success: false, error: "Erro ao buscar perfil" },
      { status: 500 }
    );
  }
}

/**
 * PUT - Atualiza dados do perfil do tenant
 */
export async function PUT(request: NextRequest) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser || !authUser.tenant_id) {
      return NextResponse.json(
        { success: false, error: "Não autenticado" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      customer_cpf_cnpj,
      customer_phone,
      customer_postal_code,
      customer_address,
      customer_address_number,
      customer_address_complement,
      customer_province,
      customer_city,
      customer_state,
    } = body;

    // Validar CPF/CNPJ
    if (customer_cpf_cnpj) {
      const cleaned = customer_cpf_cnpj.replace(/\D/g, "");
      if (cleaned.length !== 11 && cleaned.length !== 14) {
        return NextResponse.json(
          { success: false, error: "CPF deve ter 11 dígitos ou CNPJ deve ter 14 dígitos" },
          { status: 400 }
        );
      }
    }

    const tenant = await prisma.tenant.update({
      where: { id: authUser.tenant_id },
      data: {
        customer_cpf_cnpj: customer_cpf_cnpj || null,
        customer_phone: customer_phone || null,
        customer_postal_code: customer_postal_code || null,
        customer_address: customer_address || null,
        customer_address_number: customer_address_number || null,
        customer_address_complement: customer_address_complement || null,
        customer_province: customer_province || null,
        customer_city: customer_city || null,
        customer_state: customer_state || null,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Dados atualizados com sucesso",
      profile: {
        customer_cpf_cnpj: tenant.customer_cpf_cnpj,
        customer_phone: tenant.customer_phone,
        customer_postal_code: tenant.customer_postal_code,
        customer_address: tenant.customer_address,
        customer_address_number: tenant.customer_address_number,
        customer_address_complement: tenant.customer_address_complement,
        customer_province: tenant.customer_province,
        customer_city: tenant.customer_city,
        customer_state: tenant.customer_state,
      },
    });
  } catch (error: any) {
    console.error("[Profile] PUT Erro:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Erro ao atualizar perfil" },
      { status: 500 }
    );
  }
}
