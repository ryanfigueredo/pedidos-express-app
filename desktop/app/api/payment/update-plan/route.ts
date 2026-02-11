import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateAsaasSubscription, createAsaasPayment, getAsaasPaymentPixQrCode, PLAN_PRICES } from "@/lib/asaas";

export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser || !authUser.tenant_id) {
      return NextResponse.json(
        { success: false, error: "Não autenticado" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { planType, paymentMethod, cardData } = body;

    if (!planType || !["basic", "complete", "premium"].includes(planType)) {
      return NextResponse.json(
        { success: false, error: "Plano inválido" },
        { status: 400 }
      );
    }

    // Buscar tenant com dados completos
    const tenant = await prisma.tenant.findUnique({
      where: { id: authUser.tenant_id },
      select: {
        id: true,
        name: true,
        slug: true,
        asaas_subscription_id: true,
        asaas_customer_id: true,
        plan_type: true,
        customer_cpf_cnpj: true,
        customer_postal_code: true,
        customer_address_number: true,
        customer_address_complement: true,
        customer_phone: true,
      },
    });

    if (!tenant) {
      return NextResponse.json(
        { success: false, error: "Tenant não encontrado" },
        { status: 404 }
      );
    }

    // Se não tem assinatura, redirecionar para criar uma nova (não deve chegar aqui, mas por segurança)
    if (!tenant.asaas_subscription_id) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Assinatura não encontrada. Por favor, crie uma nova assinatura.",
          shouldCreateNew: true 
        },
        { status: 400 }
      );
    }

    // Verificar se já está no mesmo plano
    if (tenant.plan_type === planType) {
      return NextResponse.json(
        { success: false, error: "Você já está neste plano" },
        { status: 400 }
      );
    }

    const newValue = PLAN_PRICES[planType as keyof typeof PLAN_PRICES];
    const currentValue = PLAN_PRICES[tenant.plan_type as keyof typeof PLAN_PRICES] || 0;
    
    // Calcular diferença a pagar (se upgrade, cobrar diferença; se downgrade, pode ser pró-rata ou diferença)
    const amountToPay = Math.max(0, newValue - currentValue);
    
    // Se não precisa pagar nada (downgrade ou mesmo valor), apenas atualizar
    if (amountToPay === 0) {
      const updatedSubscription = await updateAsaasSubscription(
        tenant.asaas_subscription_id,
        {
          value: newValue,
          description: `Assinatura ${planType} - Pedidos Express`,
        }
      );

      await prisma.tenant.update({
        where: { id: tenant.id },
        data: {
          plan_type: planType,
        },
      });

      return NextResponse.json({
        success: true,
        message: "Plano atualizado com sucesso",
        planType,
        newValue,
      });
    }

    // Se precisa pagar, requer método de pagamento
    if (!paymentMethod) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Método de pagamento é obrigatório para atualizar o plano",
          requiresPayment: true,
          amountToPay,
        },
        { status: 400 }
      );
    }

    // Buscar usuário para email
    const user = await prisma.user.findUnique({
      where: { id: authUser.id },
      select: { username: true },
    });

    // Calcular data de vencimento (hoje)
    const dueDate = new Date();
    const dueDateStr = dueDate.toISOString().split("T")[0];

    // Criar pagamento imediato para diferença do plano
    // IMPORTANTE: NÃO atualizar assinatura no Asaas ainda - só após pagamento confirmado via webhook
    // O plano será atualizado quando PAYMENT_CONFIRMED chegar com o plano no externalReference
    if (paymentMethod === "pix") {
      // Criar pagamento PIX com plano pendente no externalReference
      const payment = await createAsaasPayment({
        customer: tenant.asaas_customer_id!,
        billingType: "PIX",
        value: amountToPay,
        dueDate: dueDateStr,
        description: `Upgrade de plano - Assinatura ${planType} - Pedidos Express`,
        subscription: tenant.asaas_subscription_id!,
        externalReference: `${tenant.id}|${planType}`, // Formato: "tenant_id|planType" para webhook saber qual plano ativar
      });

      // Buscar QR Code
      try {
        const qrCodeData = await getAsaasPaymentPixQrCode(payment.id);
        
        // NÃO atualizar assinatura no Asaas ainda - só após pagamento confirmado
        // A assinatura será atualizada automaticamente quando o pagamento for confirmado via webhook
        // Isso evita que o plano seja ativado antes do pagamento

        return NextResponse.json({
          success: true,
          paymentId: payment.id,
          subscriptionId: tenant.asaas_subscription_id,
          pixQrCode: qrCodeData.payload,
          pixQrCodeBase64: qrCodeData.encodedImage,
          pixCopiaECola: qrCodeData.payload,
          paymentValue: amountToPay,
          dueDate: payment.dueDate,
          planType,
          message: "Pagamento gerado. Após confirmação, o plano será atualizado.",
        });
      } catch (qrError: any) {
        console.error("[Update Plan] Erro ao buscar QR Code:", qrError);
        return NextResponse.json({
          success: true,
          paymentId: payment.id,
          subscriptionId: tenant.asaas_subscription_id,
          paymentValue: amountToPay,
          planType,
          note: "Pagamento criado, aguarde alguns segundos e recarregue para ver o QR Code",
        });
      }
    } else if (paymentMethod === "credit_card" && cardData) {
      // Criar pagamento com cartão
      const cpfCnpjCleaned = tenant.customer_cpf_cnpj?.replace(/\D/g, "") || "";
      
      const payment = await createAsaasPayment({
        customer: tenant.asaas_customer_id!,
        billingType: "CREDIT_CARD",
        value: amountToPay,
        dueDate: dueDateStr,
        description: `Upgrade de plano - Assinatura ${planType} - Pedidos Express`,
        subscription: tenant.asaas_subscription_id!,
        externalReference: `${tenant.id}|${planType}`, // Formato: "tenant_id|planType" para webhook saber qual plano ativar
        creditCard: cardData.number.replace(/\s/g, ""), // Número do cartão como string
        creditCardToken: cardData.token, // Token do cartão (se disponível)
        creditCardHolderInfo: {
          name: cardData.holderName,
          email: user?.username || `tenant-${tenant.id}@pedidosexpress.com`,
          cpfCnpj: cpfCnpjCleaned,
          postalCode: tenant.customer_postal_code?.replace(/\D/g, "") || "",
          addressNumber: tenant.customer_address_number || "",
          addressComplement: tenant.customer_address_complement || undefined,
          phone: tenant.customer_phone?.replace(/\D/g, "") || "",
        },
      });

      // NÃO atualizar assinatura no Asaas ainda - só após pagamento confirmado
      // A assinatura será atualizada automaticamente quando o pagamento for confirmado via webhook

      // Se pagamento com cartão, pode ser processado imediatamente
      // O webhook PAYMENT_CONFIRMED vai atualizar o plano
      return NextResponse.json({
        success: true,
        paymentId: payment.id,
        subscriptionId: tenant.asaas_subscription_id,
        paymentValue: amountToPay,
        planType,
        status: payment.status,
        message: "Pagamento processado. O plano será atualizado após confirmação.",
      });
    } else {
      return NextResponse.json(
        { 
          success: false, 
          error: "Dados do cartão são obrigatórios para pagamento com cartão de crédito" 
        },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error("[Update Plan] Erro:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Erro ao atualizar plano",
      },
      { status: 500 }
    );
  }
}
