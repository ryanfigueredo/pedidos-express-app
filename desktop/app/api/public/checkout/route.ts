import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  createAsaasCustomer,
  createAsaasSubscription,
  createAsaasPayment,
  getAsaasPaymentPixQrCode,
} from "@/lib/asaas";
import { getPlanPricing, PLAN_PRICES_MONTHLY, PLAN_PRICES_YEARLY } from "@/lib/plan-pricing";
import bcrypt from "bcryptjs";

export const dynamic = "force-dynamic";

/**
 * POST /api/public/checkout
 * Cria novo tenant, usuário admin e processa pagamento
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      planType,
      business_name,
      business_slug,
      business_type,
      admin_name,
      admin_email,
      admin_password,
      customer_name,
      customer_cpf_cnpj,
      customer_phone,
      customer_postal_code,
      customer_address,
      customer_address_number,
      customer_address_complement,
      customer_province,
      customer_city,
      customer_state,
      billing_cycle,
      payment_day,
      payment_method,
      installments,
      cardData,
    } = body;

    // Validações básicas
    if (!planType || !business_name || !business_slug || !admin_email || !admin_password) {
      return NextResponse.json(
        { success: false, error: "Dados obrigatórios faltando" },
        { status: 400 }
      );
    }

    if (!customer_cpf_cnpj || !customer_phone) {
      return NextResponse.json(
        { success: false, error: "CPF/CNPJ e telefone são obrigatórios para pagamento" },
        { status: 400 }
      );
    }

    // Verificar se slug já existe
    const existingTenant = await prisma.tenant.findUnique({
      where: { slug: business_slug },
    });

    if (existingTenant) {
      return NextResponse.json(
        { success: false, error: "Este nome de negócio já está em uso. Escolha outro." },
        { status: 400 }
      );
    }

    // Verificar se email já existe
    const existingUser = await prisma.user.findFirst({
      where: { username: admin_email },
    });

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: "Este e-mail já está cadastrado" },
        { status: 400 }
      );
    }

    // Criar tenant
    const tenant = await prisma.tenant.create({
      data: {
        name: business_name,
        slug: business_slug,
        business_type: business_type || "RESTAURANTE",
        is_active: false, // Ativar após pagamento confirmado
        plan_type: planType,
        plan_message_limit:
          planType === "basic"
            ? 1000
            : planType === "complete"
            ? 2500
            : -1, // -1 = ilimitado
        subscription_status: "pending",
        // Dados do cliente para pagamento
        customer_cpf_cnpj: customer_cpf_cnpj.replace(/\D/g, ""),
        customer_phone: customer_phone.replace(/\D/g, ""),
        customer_postal_code: customer_postal_code?.replace(/\D/g, ""),
        customer_address,
        customer_address_number,
        customer_address_complement,
        customer_province,
        customer_city,
        customer_state,
        // Gerar API key única
        api_key: `pk_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      },
    });

    // Criar usuário admin
    const hashedPassword = await bcrypt.hash(admin_password, 10);
    const adminUser = await prisma.user.create({
      data: {
        tenant_id: tenant.id,
        username: admin_email,
        password: hashedPassword,
        name: admin_name,
        role: "admin",
      },
    });

    // Criar cliente no Asaas
    const cpfCnpjCleaned = customer_cpf_cnpj.replace(/\D/g, "");
    const phoneCleaned = customer_phone.replace(/\D/g, "");
    const postalCodeCleaned = customer_postal_code?.replace(/\D/g, "") || "";

    let asaasCustomer;
    try {
      asaasCustomer = await createAsaasCustomer({
        name: customer_name || business_name,
        email: admin_email,
        cpfCnpj: cpfCnpjCleaned,
        phone: phoneCleaned,
        mobilePhone: phoneCleaned,
        postalCode: postalCodeCleaned,
        address: customer_address,
        addressNumber: customer_address_number,
        complement: customer_address_complement,
        province: customer_province,
        city: customer_city,
        state: customer_state,
      });
    } catch (error: any) {
      console.error("[Public Checkout] Erro ao criar cliente Asaas:", error);
      // Se falhar, deletar tenant e usuário criados
      await prisma.user.delete({ where: { id: adminUser.id } });
      await prisma.tenant.delete({ where: { id: tenant.id } });
      return NextResponse.json(
        {
          success: false,
          error: "Erro ao criar cliente no sistema de pagamento. Tente novamente.",
        },
        { status: 500 }
      );
    }

    // Atualizar tenant com customer_id
    await prisma.tenant.update({
      where: { id: tenant.id },
      data: { asaas_customer_id: asaasCustomer.id },
    });

    // Determinar preço baseado no ciclo
    const cycle = billing_cycle || "monthly";
    const pricing = getPlanPricing(planType as "basic" | "complete" | "premium", cycle);
    const planPrice = cycle === "yearly" ? pricing.yearlyPrice : pricing.monthlyPrice;
    
    // Calcular dia de pagamento
    const paymentDay = parseInt(payment_day || new Date().getDate().toString());
    const validPaymentDay = Math.min(Math.max(1, paymentDay), 28); // Entre 1 e 28

    // Calcular próxima data de vencimento baseada no dia escolhido
    const now = new Date();
    let nextDueDate = new Date(now.getFullYear(), now.getMonth(), validPaymentDay);
    
    // Se o dia já passou este mês, usar o próximo mês
    if (nextDueDate < now) {
      nextDueDate = new Date(now.getFullYear(), now.getMonth() + 1, validPaymentDay);
    }
    
    // Se for anual, calcular para 12 meses à frente
    if (cycle === "yearly") {
      nextDueDate = new Date(now.getFullYear() + 1, now.getMonth(), validPaymentDay);
    }

    // Criar assinatura no Asaas
    let asaasSubscription;
    try {
      asaasSubscription = await createAsaasSubscription({
        customer: asaasCustomer.id,
        billingType: payment_method === "pix" ? "PIX" : "CREDIT_CARD",
        value: cycle === "yearly" ? planPrice : planPrice, // Valor total (anual ou mensal)
        nextDueDate: nextDueDate.toISOString().split("T")[0],
        cycle: cycle === "yearly" ? "YEARLY" : "MONTHLY",
        description: `Pedidos Express - Plano ${planType} (${cycle === "yearly" ? "Anual" : "Mensal"})`,
      });
    } catch (error: any) {
      console.error("[Public Checkout] Erro ao criar assinatura Asaas:", error);
      return NextResponse.json(
        {
          success: false,
          error: "Erro ao criar assinatura. Tente novamente.",
        },
        { status: 500 }
      );
    }

    // Calcular data de expiração
    const expiresAt = cycle === "yearly" 
      ? new Date(now.getFullYear() + 1, now.getMonth(), validPaymentDay)
      : new Date(now.getFullYear(), now.getMonth() + 1, validPaymentDay);

    // Atualizar tenant com subscription_id
    await prisma.tenant.update({
      where: { id: tenant.id },
      data: {
        asaas_subscription_id: asaasSubscription.id,
        subscription_expires_at: expiresAt,
      },
    });

    // Criar pagamento inicial
    let payment;
    let pixQrCode = null;
    let pixCopiaECola = null;
    
    // Parcelamento: apenas para anual + cartão. PIX sempre à vista.
    const installmentsCount = cycle === "yearly" && payment_method === "credit_card" && installments 
      ? parseInt(installments) 
      : 1;
    
    // Valor do pagamento: se PIX anual, sempre valor cheio. Se cartão anual parcelado, valor total (será parcelado pelo Asaas)
    const paymentValue = planPrice;

    try {
      if (payment_method === "pix") {
        // Para PIX, sempre pagamento à vista (mesmo se anual)
        payment = await createAsaasPayment({
          customer: asaasCustomer.id,
          billingType: "PIX",
          value: paymentValue, // Valor cheio (anual ou mensal)
          dueDate: nextDueDate.toISOString().split("T")[0],
          description: `Pedidos Express - Plano ${planType} - ${cycle === "yearly" ? "Anual (à vista)" : "Primeira mensalidade"}`,
          externalReference: `${tenant.id}|${planType}`,
        });

        // Obter QR code do PIX
        if (payment.id) {
          try {
            const pixData = await getAsaasPaymentPixQrCode(payment.id);
            pixQrCode = pixData.encodedImage;
            pixCopiaECola = pixData.payload;
          } catch (pixError) {
            console.error("[Public Checkout] Erro ao obter QR code PIX:", pixError);
            // Continuar mesmo sem QR code, pode ser obtido depois
          }
        }
      } else {
        // Para cartão, criar pagamento com dados do cartão
        const paymentData: any = {
          customer: asaasCustomer.id,
          billingType: "CREDIT_CARD",
          value: paymentValue, // Valor total (será parcelado se installmentsCount > 1)
          dueDate: nextDueDate.toISOString().split("T")[0],
          description: `Pedidos Express - Plano ${planType} - ${cycle === "yearly" ? `Anual${installmentsCount > 1 ? ` (${installmentsCount}x)` : " (à vista)"}` : "Primeira mensalidade"}`,
          externalReference: `${tenant.id}|${planType}`,
          creditCardHolderInfo: {
            name: cardData?.cardName || customer_name || business_name,
            email: admin_email,
            cpfCnpj: cpfCnpjCleaned,
            postalCode: postalCodeCleaned,
            addressNumber: customer_address_number,
            addressComplement: customer_address_complement,
            phone: phoneCleaned,
          },
        };

        // Adicionar dados do cartão
        if (cardData?.cardNumber) {
          paymentData.creditCard = cardData.cardNumber.replace(/\D/g, "");
        }
        if (cardData?.cardToken) {
          paymentData.creditCardToken = cardData.cardToken;
        }

        // Adicionar parcelamento apenas se for anual e tiver mais de 1 parcela
        if (cycle === "yearly" && installmentsCount > 1) {
          paymentData.installmentCount = installmentsCount;
        }

        payment = await createAsaasPayment(paymentData);
      }
    } catch (error: any) {
      console.error("[Public Checkout] Erro ao criar pagamento:", error);
      return NextResponse.json(
        {
          success: false,
          error: "Erro ao processar pagamento. Verifique os dados e tente novamente.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      tenant_id: tenant.id,
      user_id: adminUser.id,
      payment_id: payment?.id,
      subscription_id: asaasSubscription.id,
      pix_qr_code: pixQrCode,
      pix_copia_e_cola: pixCopiaECola,
      message: "Checkout realizado com sucesso. Aguarde confirmação do pagamento.",
    });
  } catch (error: any) {
    console.error("[Public Checkout] Erro geral:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Erro ao processar checkout",
      },
      { status: 500 }
    );
  }
}
