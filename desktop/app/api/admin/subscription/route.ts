import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { PLAN_LIMITS, type PlanType } from "@/lib/message-limits";

/**
 * GET - Retorna informações de assinatura do tenant
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

    if (!authUser.tenant_id) {
      return NextResponse.json({
        success: true,
        subscription: null,
      });
    }

    const tenant = await prisma.tenant.findUnique({
      where: { id: authUser.tenant_id },
      select: {
        plan_type: true,
        plan_message_limit: true,
        subscription_payment_date: true,
        subscription_expires_at: true,
        subscription_status: true,
        asaas_subscription_id: true,
        asaas_customer_id: true,
      },
    });

    if (!tenant) {
      return NextResponse.json({
        success: true,
        subscription: null,
      });
    }

    const planType = (tenant.plan_type || "basic") as PlanType;
    const planLimit = PLAN_LIMITS[planType];

    // Calcular dias restantes até vencimento
    let daysUntilExpiration: number | null = null;
    let isExpired = false;
    let isExpiringSoon = false;

    if (tenant.subscription_expires_at) {
      const now = new Date();
      const expiresAt = new Date(tenant.subscription_expires_at);
      const diffTime = expiresAt.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      daysUntilExpiration = diffDays;
      isExpired = diffDays < 0;
      isExpiringSoon = diffDays >= 0 && diffDays <= 7; // Avisar se faltam 7 dias ou menos
    }

    // URL para pagamento (redireciona para página de pagamento no desktop)
    const paymentUrl = tenant.asaas_subscription_id
      ? `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/dashboard/pagamento?subscription_id=${tenant.asaas_subscription_id}`
      : `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/dashboard/pagamento`;

    return NextResponse.json({
      success: true,
      subscription: {
        planType: planType,
        planName: planLimit.name,
        planMessageLimit: tenant.plan_message_limit || planLimit.messages,
        paymentDate: tenant.subscription_payment_date?.toISOString() || null,
        expiresAt: tenant.subscription_expires_at?.toISOString() || null,
        status: tenant.subscription_status || "active",
        daysUntilExpiration,
        isExpired,
        isExpiringSoon,
        paymentUrl,
        asaasSubscriptionId: tenant.asaas_subscription_id,
        asaasCustomerId: tenant.asaas_customer_id,
      },
    });
  } catch (error) {
    console.error("[subscription] GET Erro:", error);
    return NextResponse.json(
      { success: false, error: "Erro ao buscar assinatura" },
      { status: 500 }
    );
  }
}
