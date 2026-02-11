import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { PLAN_PRICES, updateAsaasSubscription } from "@/lib/asaas";

const ASAAS_API_URL = process.env.ASAAS_API_URL || "https://www.asaas.com/api/v3";
const ASAAS_API_KEY = process.env.ASAAS_API_KEY;

/**
 * Webhook do Asaas para receber notificações de pagamento
 * Documentação: https://docs.asaas.com/docs/webhook
 */
export async function POST(request: NextRequest) {
  try {
    // Verificar token do webhook
    const webhookToken = request.headers.get("asaas-access-token");
    const expectedToken = process.env.ASAAS_WEBHOOK_TOKEN;

    if (!expectedToken || webhookToken !== expectedToken) {
      console.warn("[Asaas Webhook] Token inválido ou não configurado");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const event = body.event;
    const payment = body.payment;
    const subscription = body.subscription;

    console.log(`[Asaas Webhook] Evento recebido: ${event}`, {
      paymentId: payment?.id,
      subscriptionId: payment?.subscription || subscription?.id,
      status: payment?.status || subscription?.status,
    });

    // Buscar tenant pelo externalReference ou subscription_id
    let tenant = null;
    const subscriptionId = payment?.subscription || subscription?.id;
    let pendingPlanType: string | null = null;

    if (subscriptionId) {
      tenant = await prisma.tenant.findFirst({
        where: { asaas_subscription_id: subscriptionId },
      });
    }

    // Verificar se externalReference contém plano pendente (formato: "tenant_id|planType")
    if (payment?.externalReference) {
      const externalRefParts = payment.externalReference.split("|");
      if (externalRefParts.length === 2) {
        // Formato: tenant_id|planType (upgrade de plano)
        const tenantId = externalRefParts[0];
        pendingPlanType = externalRefParts[1];
        tenant = await prisma.tenant.findUnique({
          where: { id: tenantId },
        });
      } else {
        // Formato normal: apenas tenant_id
        tenant = await prisma.tenant.findUnique({
          where: { id: payment.externalReference },
        });
      }
    }

    if (!tenant && subscription?.externalReference) {
      tenant = await prisma.tenant.findUnique({
        where: { id: subscription.externalReference },
      });
    }

    if (!tenant) {
      console.warn("[Asaas Webhook] Tenant não encontrado", {
        subscriptionId: payment?.subscription,
        externalReference: payment?.externalReference,
      });
      return NextResponse.json({ success: true, message: "Tenant não encontrado" });
    }

    switch (event) {
      case "PAYMENT_CONFIRMED":
      case "PAYMENT_RECEIVED":
        // Pagamento confirmado - atualizar tenant e PLANO
        let planTypeToActivate = tenant.plan_type || "basic";
        
        // Se tem plano pendente no externalReference, usar esse plano
        if (pendingPlanType) {
          planTypeToActivate = pendingPlanType;
          console.log(`[Asaas Webhook] Plano pendente encontrado: ${pendingPlanType}`);
        } else if (subscriptionId) {
          // Caso contrário, buscar assinatura para determinar o plano baseado no valor
          try {
            const subscriptionResponse = await fetch(
              `${ASAAS_API_URL}/subscriptions/${subscriptionId}`,
              {
                headers: {
                  "Content-Type": "application/json",
                  access_token: ASAAS_API_KEY || "",
                },
              }
            );
            
            if (subscriptionResponse.ok) {
              const subscriptionData = await subscriptionResponse.json();
              const subscriptionValue = subscriptionData.value || 0;
              
              // Determinar plano baseado no valor
              if (subscriptionValue >= PLAN_PRICES.premium) {
                planTypeToActivate = "premium";
              } else if (subscriptionValue >= PLAN_PRICES.complete) {
                planTypeToActivate = "complete";
              } else {
                planTypeToActivate = "basic";
              }
            }
          } catch (error) {
            console.error("[Asaas Webhook] Erro ao buscar assinatura:", error);
            // Usar plano atual do tenant se não conseguir buscar
          }
        }
        
        // Atualizar assinatura no Asaas com novo valor APENAS após pagamento confirmado
        if (subscriptionId && pendingPlanType) {
          try {
            const newValue = PLAN_PRICES[pendingPlanType as keyof typeof PLAN_PRICES];
            await updateAsaasSubscription(subscriptionId, {
              value: newValue,
              description: `Assinatura ${pendingPlanType} - Pedidos Express`,
            });
            console.log(`[Asaas Webhook] Assinatura atualizada no Asaas para plano: ${pendingPlanType}`);
          } catch (error) {
            console.error("[Asaas Webhook] Erro ao atualizar assinatura no Asaas:", error);
          }
        }
        
        await prisma.tenant.update({
          where: { id: tenant.id },
          data: {
            plan_type: planTypeToActivate, // ATUALIZAR PLANO APENAS AQUI (após pagamento confirmado)
            subscription_status: "active",
            subscription_payment_date: payment.paymentDate
              ? new Date(payment.paymentDate)
              : new Date(),
            subscription_expires_at: payment.dueDate
              ? new Date(payment.dueDate)
              : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 dias
            is_active: true, // Ativar tenant após pagamento confirmado
          },
        });
        console.log(`[Asaas Webhook] Pagamento confirmado para tenant: ${tenant.id}, plano ativado: ${planTypeToActivate}`);
        break;

      case "PAYMENT_OVERDUE":
        // Pagamento vencido
        await prisma.tenant.update({
          where: { id: tenant.id },
          data: {
            subscription_status: "expired",
          },
        });
        console.log(`[Asaas Webhook] Pagamento vencido para tenant: ${tenant.id}`);
        break;

      case "PAYMENT_REFUNDED":
        // Pagamento estornado
        await prisma.tenant.update({
          where: { id: tenant.id },
          data: {
            subscription_status: "cancelled",
          },
        });
        console.log(`[Asaas Webhook] Pagamento estornado para tenant: ${tenant.id}`);
        break;

      case "SUBSCRIPTION_DELETED":
        // Assinatura cancelada
        await prisma.tenant.update({
          where: { id: tenant.id },
          data: {
            subscription_status: "cancelled",
          },
        });
        console.log(`[Asaas Webhook] Assinatura cancelada para tenant: ${tenant.id}`);
        break;

      case "SUBSCRIPTION_UPDATED":
        // Assinatura atualizada (mudança de plano, valor, etc.)
        // IMPORTANTE: NÃO atualizar o plano aqui - só atualizar quando PAYMENT_CONFIRMED chegar
        // Isso evita que o plano seja ativado antes do pagamento ser confirmado
        if (subscription) {
          // Apenas atualizar status e datas, mas NÃO o plan_type
          await prisma.tenant.update({
            where: { id: tenant.id },
            data: {
              // NÃO atualizar plan_type aqui - só após pagamento confirmado
              subscription_status: subscription.status === "ACTIVE" ? "active" : tenant.subscription_status || "pending",
              subscription_expires_at: subscription.nextDueDate
                ? new Date(subscription.nextDueDate)
                : tenant.subscription_expires_at,
            },
          });
          console.log(`[Asaas Webhook] Assinatura atualizada para tenant: ${tenant.id} - aguardando pagamento para ativar novo plano`);
        }
        break;

      case "SUBSCRIPTION_INACTIVATED":
        // Assinatura inativada
        await prisma.tenant.update({
          where: { id: tenant.id },
          data: {
            subscription_status: "cancelled",
          },
        });
        console.log(`[Asaas Webhook] Assinatura inativada para tenant: ${tenant.id}`);
        break;

      case "SUBSCRIPTION_CREATED":
        // Assinatura criada - APENAS salvar subscription_id, NÃO atualizar plano ainda
        if (subscription) {
          await prisma.tenant.update({
            where: { id: tenant.id },
            data: {
              asaas_subscription_id: subscription.id,
              subscription_status: "pending", // Sempre pending até pagamento confirmado
              // NÃO atualizar plan_type aqui - só após PAYMENT_CONFIRMED
              subscription_expires_at: subscription.nextDueDate
                ? new Date(subscription.nextDueDate)
                : null,
            },
          });
          console.log(`[Asaas Webhook] Assinatura criada para tenant: ${tenant.id} - aguardando pagamento`);
        }
        break;

      default:
        console.log(`[Asaas Webhook] Evento não tratado: ${event}`);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[Asaas Webhook] Erro:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
