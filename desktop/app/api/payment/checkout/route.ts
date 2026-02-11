import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createAsaasCustomer, createAsaasSubscription, getAsaasCustomer, updateAsaasCustomer, createAsaasPayment, getAsaasPaymentPixQrCode, PLAN_PRICES } from "@/lib/asaas";

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

    if (!planType || !paymentMethod) {
      return NextResponse.json(
        { success: false, error: "Plano e método de pagamento são obrigatórios" },
        { status: 400 }
      );
    }

    // Buscar tenant e usuário completo
    const tenant = await prisma.tenant.findUnique({
      where: { id: authUser.tenant_id! },
      select: {
        id: true,
        name: true,
        slug: true,
        asaas_customer_id: true,
        asaas_subscription_id: true,
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

    // Verificar se tem CPF/CNPJ (obrigatório para Asaas)
    if (!tenant.customer_cpf_cnpj) {
      return NextResponse.json(
        {
          success: false,
          error: "Dados incompletos",
          missingFields: ["customer_cpf_cnpj"],
          redirectTo: "/dashboard/perfil?redirect=/dashboard/pagamento",
        },
        { status: 400 }
      );
    }

    // Buscar usuário completo para obter email
    const user = await prisma.user.findUnique({
      where: { id: authUser.id },
      select: { username: true },
    });

    // Criar ou atualizar cliente no Asaas
    let customerId = tenant.asaas_customer_id;
    const cpfCnpjCleaned = tenant.customer_cpf_cnpj.replace(/\D/g, "");

    if (!customerId) {
      // Criar cliente no Asaas com dados completos
      const asaasCustomer = await createAsaasCustomer({
        name: tenant.name,
        email: user?.username || `tenant-${tenant.id}@pedidosexpress.com`,
        cpfCnpj: cpfCnpjCleaned,
        phone: tenant.customer_phone || undefined,
        mobilePhone: tenant.customer_phone || undefined,
        postalCode: tenant.customer_postal_code?.replace(/\D/g, "") || undefined,
        address: tenant.customer_address || undefined,
        addressNumber: tenant.customer_address_number || undefined,
        complement: tenant.customer_address_complement || undefined,
        province: tenant.customer_province || undefined,
        city: tenant.customer_city || undefined,
        state: tenant.customer_state || undefined,
      });

      customerId = asaasCustomer.id;

      // Salvar customer_id no tenant
      await prisma.tenant.update({
        where: { id: tenant.id },
        data: { asaas_customer_id: customerId },
      });
    } else {
      // Cliente já existe - verificar se tem CPF/CNPJ e atualizar se necessário
      try {
        const existingCustomer = await getAsaasCustomer(customerId);
        
        // Se não tem CPF/CNPJ no Asaas, atualizar com os dados completos
        if (!existingCustomer.cpfCnpj || existingCustomer.cpfCnpj.replace(/\D/g, "") !== cpfCnpjCleaned) {
          console.log("[Payment Checkout] Atualizando cliente no Asaas com dados completos...");
          
          await updateAsaasCustomer(customerId, {
            name: tenant.name,
            email: user?.username || `tenant-${tenant.id}@pedidosexpress.com`,
            cpfCnpj: cpfCnpjCleaned,
            phone: tenant.customer_phone || undefined,
            mobilePhone: tenant.customer_phone || undefined,
            postalCode: tenant.customer_postal_code?.replace(/\D/g, "") || undefined,
            address: tenant.customer_address || undefined,
            addressNumber: tenant.customer_address_number || undefined,
            complement: tenant.customer_address_complement || undefined,
            province: tenant.customer_province || undefined,
            city: tenant.customer_city || undefined,
            state: tenant.customer_state || undefined,
          });
          
          console.log("[Payment Checkout] Cliente atualizado com sucesso no Asaas");
        }
      } catch (error: any) {
        // Se der erro ao buscar cliente (pode não existir mais), criar um novo
        console.warn("[Payment Checkout] Erro ao buscar cliente existente, criando novo:", error.message);
        
        const asaasCustomer = await createAsaasCustomer({
          name: tenant.name,
          email: user?.username || `tenant-${tenant.id}@pedidosexpress.com`,
          cpfCnpj: cpfCnpjCleaned,
          phone: tenant.customer_phone || undefined,
          mobilePhone: tenant.customer_phone || undefined,
          postalCode: tenant.customer_postal_code?.replace(/\D/g, "") || undefined,
          address: tenant.customer_address || undefined,
          addressNumber: tenant.customer_address_number || undefined,
          complement: tenant.customer_address_complement || undefined,
          province: tenant.customer_province || undefined,
          city: tenant.customer_city || undefined,
          state: tenant.customer_state || undefined,
        });

        customerId = asaasCustomer.id;

        // Atualizar customer_id no tenant
        await prisma.tenant.update({
          where: { id: tenant.id },
          data: { asaas_customer_id: customerId },
        });
      }
    }

    // Calcular data de vencimento (30 dias a partir de hoje)
    const nextDueDate = new Date();
    nextDueDate.setDate(nextDueDate.getDate() + 30);
    const nextDueDateStr = nextDueDate.toISOString().split("T")[0];

    // Criar assinatura no Asaas
    const subscriptionData: any = {
      customer: customerId,
      billingType: paymentMethod === "pix" ? "PIX" : "CREDIT_CARD",
      value: PLAN_PRICES[planType as keyof typeof PLAN_PRICES],
      nextDueDate: nextDueDateStr,
      cycle: "MONTHLY",
      description: `Assinatura ${planType} - Pedidos Express`,
      externalReference: tenant.id,
    };

    // Se for cartão, adicionar dados do cartão
    if (paymentMethod === "credit_card" && cardData) {
      subscriptionData.creditCard = {
        holderName: cardData.holderName,
        number: cardData.number.replace(/\s/g, ""),
        expiryMonth: cardData.expiryMonth.padStart(2, "0"),
        expiryYear: cardData.expiryYear,
        ccv: cardData.ccv,
      };

      const cpfCnpjCleaned = tenant.customer_cpf_cnpj?.replace(/\D/g, "") || "";
      
      subscriptionData.creditCardHolderInfo = {
        name: cardData.holderName,
        email: user?.username || `tenant-${tenant.id}@pedidosexpress.com`,
        cpfCnpj: cpfCnpjCleaned,
        postalCode: tenant.customer_postal_code?.replace(/\D/g, "") || "",
        addressNumber: tenant.customer_address_number || "",
        addressComplement: tenant.customer_address_complement || undefined,
        phone: tenant.customer_phone?.replace(/\D/g, "") || "",
      };
    }

    const asaasSubscription = await createAsaasSubscription(subscriptionData);

    // Atualizar tenant com subscription_id (SEM atualizar plan_type até pagamento confirmado)
    await prisma.tenant.update({
      where: { id: tenant.id },
      data: {
        asaas_subscription_id: asaasSubscription.id,
        // NÃO atualizar plan_type aqui - só após pagamento confirmado via webhook
        subscription_status: "pending",
      },
    });

    // Se for PIX, criar primeiro pagamento manualmente e obter QR Code
    if (paymentMethod === "pix") {
      try {
        // Criar primeiro pagamento manualmente
        const firstPayment = await createAsaasPayment({
          customer: customerId,
          billingType: "PIX",
          value: PLAN_PRICES[planType as keyof typeof PLAN_PRICES],
          dueDate: nextDueDateStr,
          description: `Primeiro pagamento - Assinatura ${planType} - Pedidos Express`,
          subscription: asaasSubscription.id,
          externalReference: tenant.id,
        });

        console.log("[Payment Checkout] Primeiro pagamento PIX criado:", firstPayment.id);

        // Buscar QR Code do pagamento
        try {
          const qrCodeData = await getAsaasPaymentPixQrCode(firstPayment.id);
          
          return NextResponse.json({
            success: true,
            paymentId: firstPayment.id,
            subscriptionId: asaasSubscription.id,
            pixQrCode: qrCodeData.payload,
            pixQrCodeBase64: qrCodeData.encodedImage,
            pixCopiaECola: qrCodeData.payload,
            paymentValue: PLAN_PRICES[planType as keyof typeof PLAN_PRICES],
            dueDate: firstPayment.dueDate,
          });
        } catch (qrError: any) {
          console.error("[Payment Checkout] Erro ao buscar QR Code:", qrError);
          // Retornar mesmo sem QR Code, o frontend pode buscar depois
          return NextResponse.json({
            success: true,
            paymentId: firstPayment.id,
            subscriptionId: asaasSubscription.id,
            paymentValue: PLAN_PRICES[planType as keyof typeof PLAN_PRICES],
            dueDate: firstPayment.dueDate,
            note: "Pagamento criado, aguarde alguns segundos e recarregue para ver o QR Code",
          });
        }
      } catch (error: any) {
        console.error("[Payment Checkout] Erro ao criar pagamento PIX:", error);
        // Se der erro, retornar subscription_id mesmo assim
        return NextResponse.json({
          success: true,
          subscriptionId: asaasSubscription.id,
          paymentValue: PLAN_PRICES[planType as keyof typeof PLAN_PRICES],
          note: "Assinatura criada. O primeiro pagamento será gerado em breve.",
        });
      }
    }

    // Se for cartão, retornar subscription_id
    return NextResponse.json({
      success: true,
      subscriptionId: asaasSubscription.id,
      status: asaasSubscription.status,
    });
  } catch (error: any) {
    console.error("[Payment Checkout] Erro:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Erro ao processar pagamento",
      },
      { status: 500 }
    );
  }
}
