import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PLAN_PRICES } from "@/lib/asaas";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser || !authUser.tenant_id) {
      return NextResponse.json(
        { success: false, error: "Não autenticado" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const paymentId = searchParams.get("payment_id");
    const subscriptionId = searchParams.get("subscription_id");

    if (!paymentId && !subscriptionId) {
      return NextResponse.json(
        { success: false, error: "ID de pagamento ou assinatura necessário" },
        { status: 400 }
      );
    }

    // Buscar dados do tenant
    const tenant = await prisma.tenant.findUnique({
      where: { id: authUser.tenant_id },
      select: {
        plan_type: true,
        subscription_status: true,
        subscription_payment_date: true,
        subscription_expires_at: true,
        asaas_subscription_id: true,
      },
    });

    if (!tenant) {
      return NextResponse.json(
        { success: false, error: "Tenant não encontrado" },
        { status: 404 }
      );
    }

    // Se tiver payment_id específico, buscar esse pagamento diretamente
    if (paymentId) {
      try {
        // Buscar pagamento específico
        const paymentResponse = await fetch(
          `${process.env.ASAAS_API_URL || "https://www.asaas.com/api/v3"}/payments/${paymentId}`,
          {
            headers: {
              "Content-Type": "application/json",
              access_token: process.env.ASAAS_API_KEY || "",
            },
          }
        );

        if (paymentResponse.ok) {
          const paymentData = await paymentResponse.json();

          // Se for PIX, buscar QR Code
          let pixQrCodeBase64 = null;
          let pixCopiaECola = null;
          
          if (paymentData.billingType === "PIX") {
            try {
              const qrCodeResponse = await fetch(
                `${process.env.ASAAS_API_URL || "https://www.asaas.com/api/v3"}/payments/${paymentId}/pixQrCode`,
                {
                  headers: {
                    "Content-Type": "application/json",
                    access_token: process.env.ASAAS_API_KEY || "",
                  },
                }
              );

              if (qrCodeResponse.ok) {
                const qrCodeData = await qrCodeResponse.json();
                pixQrCodeBase64 = qrCodeData.encodedImage;
                pixCopiaECola = qrCodeData.payload;
              }
            } catch (qrError) {
              console.error("[Payment Status] Erro ao buscar QR Code:", qrError);
            }
          }

          // Determinar nome do plano baseado no valor
          const planValue = paymentData.value || 0;
          let planName = "Básico";
          if (planValue >= PLAN_PRICES.premium) {
            planName = "Premium";
          } else if (planValue >= PLAN_PRICES.complete) {
            planName = "Completo";
          }

          return NextResponse.json({
            success: true,
            payment: {
              id: paymentData.id,
              status: paymentData.status,
              value: paymentData.value,
              planName,
              dueDate: paymentData.dueDate,
              pixQrCodeBase64,
              pixCopiaECola: pixCopiaECola || paymentData.pixCopiaECola,
              pixQrCode: pixCopiaECola || paymentData.pixQrCode,
            },
          });
        }
      } catch (error) {
        console.error("[Payment Status] Erro ao buscar pagamento:", error);
      }
    }

    // Se tiver subscription_id, buscar dados da assinatura no Asaas
    const asaasSubscriptionId = subscriptionId || tenant.asaas_subscription_id;

    if (asaasSubscriptionId) {
      try {
        const asaasResponse = await fetch(
          `${process.env.ASAAS_API_URL || "https://www.asaas.com/api/v3"}/subscriptions/${asaasSubscriptionId}`,
          {
            headers: {
              "Content-Type": "application/json",
              access_token: process.env.ASAAS_API_KEY || "",
            },
          }
        );

        if (asaasResponse.ok) {
          const asaasData = await asaasResponse.json();

          // Buscar último pagamento da assinatura
          const paymentsResponse = await fetch(
            `${process.env.ASAAS_API_URL || "https://www.asaas.com/api/v3"}/subscriptions/${asaasSubscriptionId}/payments?limit=1`,
            {
              headers: {
                "Content-Type": "application/json",
                access_token: process.env.ASAAS_API_KEY || "",
              },
            }
          );

          let lastPayment = null;
          if (paymentsResponse.ok) {
            const paymentsData = await paymentsResponse.json();
            lastPayment = paymentsData.data?.[0] || null;
            
            // Se tiver pagamento PIX, buscar QR Code
            if (lastPayment && lastPayment.billingType === "PIX") {
              try {
                const qrCodeResponse = await fetch(
                  `${process.env.ASAAS_API_URL || "https://www.asaas.com/api/v3"}/payments/${lastPayment.id}/pixQrCode`,
                  {
                    headers: {
                      "Content-Type": "application/json",
                      access_token: process.env.ASAAS_API_KEY || "",
                    },
                  }
                );

                if (qrCodeResponse.ok) {
                  const qrCodeData = await qrCodeResponse.json();
                  lastPayment.pixQrCodeBase64 = qrCodeData.encodedImage;
                  lastPayment.pixCopiaECola = qrCodeData.payload;
                }
              } catch (qrError) {
                console.error("[Payment Status] Erro ao buscar QR Code:", qrError);
              }
            }
          }

          return NextResponse.json({
            success: true,
            payment: {
              id: asaasData.id,
              status: lastPayment?.status || asaasData.status,
              value: lastPayment?.value || asaasData.value,
              planName: tenant.plan_type === "premium" ? "Premium" : tenant.plan_type === "complete" ? "Completo" : "Básico",
              nextDueDate: asaasData.nextDueDate,
              pixQrCodeBase64: lastPayment?.pixQrCodeBase64,
              pixCopiaECola: lastPayment?.pixCopiaECola,
              dueDate: lastPayment?.dueDate,
            },
          });
        }
      } catch (error) {
        console.error("[Payment Status] Erro ao buscar no Asaas:", error);
      }
    }

    // Retornar dados do banco local
    return NextResponse.json({
      success: true,
      payment: {
        status: tenant.subscription_status?.toUpperCase() || "PENDING",
        planName: tenant.plan_type === "premium" ? "Premium" : tenant.plan_type === "complete" ? "Completo" : "Básico",
        paymentDate: tenant.subscription_payment_date,
        expiresAt: tenant.subscription_expires_at,
      },
    });
  } catch (error: any) {
    console.error("[Payment Status] Erro:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Erro ao buscar status do pagamento" },
      { status: 500 }
    );
  }
}
