/**
 * Biblioteca para integração com Asaas API
 * Documentação: https://docs.asaas.com
 */

const ASAAS_API_URL = process.env.ASAAS_API_URL || 'https://www.asaas.com/api/v3';
const ASAAS_API_KEY = process.env.ASAAS_API_KEY;

if (!ASAAS_API_KEY) {
  console.warn('[Asaas] ASAAS_API_KEY não configurada nas variáveis de ambiente');
}

export interface AsaasCustomer {
  id?: string;
  name: string;
  email: string;
  cpfCnpj?: string;
  phone?: string;
  mobilePhone?: string;
  postalCode?: string;
  address?: string;
  addressNumber?: string;
  complement?: string;
  province?: string;
  city?: string;
  state?: string;
}

export interface AsaasSubscription {
  customer: string; // ID do cliente
  billingType: 'CREDIT_CARD' | 'PIX' | 'BOLETO' | 'DEBIT_CARD';
  value: number;
  nextDueDate: string; // YYYY-MM-DD
  cycle: 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'SEMIANNUALLY' | 'YEARLY';
  description?: string;
  externalReference?: string;
  creditCard?: {
    holderName: string;
    number: string;
    expiryMonth: string;
    expiryYear: string;
    ccv: string;
  };
  creditCardHolderInfo?: {
    name: string;
    email: string;
    cpfCnpj: string;
    postalCode: string;
    addressNumber: string;
    addressComplement?: string;
    phone: string;
  };
}

export interface AsaasSubscriptionResponse {
  id: string;
  customer: string;
  billingType: string;
  value: number;
  nextDueDate: string;
  cycle: string;
  description: string;
  status: string;
  pixQrCode?: string;
  pixQrCodeBase64?: string;
  pixCopiaECola?: string;
  [key: string]: any;
}

export interface AsaasPayment {
  id: string;
  customer: string;
  subscription?: string;
  value: number;
  netValue: number;
  originalValue: number;
  interestValue: number;
  description: string;
  billingType: string;
  status: string;
  dueDate: string;
  paymentDate?: string;
  clientPaymentDate?: string;
  installmentNumber?: number;
  invoiceUrl?: string;
  bankSlipUrl?: string;
  transactionReceiptUrl?: string;
  invoiceNumber?: string;
  externalReference?: string;
}

/**
 * Cria um cliente no Asaas
 */
export async function createAsaasCustomer(
  customerData: AsaasCustomer
): Promise<{ id: string; [key: string]: any }> {
  if (!ASAAS_API_KEY) {
    throw new Error('ASAAS_API_KEY não configurada');
  }

  const response = await fetch(`${ASAAS_API_URL}/customers`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      access_token: ASAAS_API_KEY,
    },
    body: JSON.stringify(customerData),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Erro ao criar cliente no Asaas: ${JSON.stringify(error)}`);
  }

  return response.json();
}

/**
 * Busca um cliente no Asaas pelo ID
 */
export async function getAsaasCustomer(
  customerId: string
): Promise<AsaasCustomer & { id: string }> {
  if (!ASAAS_API_KEY) {
    throw new Error('ASAAS_API_KEY não configurada');
  }

  const response = await fetch(`${ASAAS_API_URL}/customers/${customerId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      access_token: ASAAS_API_KEY,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Erro ao buscar cliente no Asaas: ${JSON.stringify(error)}`);
  }

  return response.json();
}

/**
 * Atualiza um cliente no Asaas
 */
export async function updateAsaasCustomer(
  customerId: string,
  customerData: Partial<AsaasCustomer>
): Promise<{ id: string; [key: string]: any }> {
  if (!ASAAS_API_KEY) {
    throw new Error('ASAAS_API_KEY não configurada');
  }

  const response = await fetch(`${ASAAS_API_URL}/customers/${customerId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      access_token: ASAAS_API_KEY,
    },
    body: JSON.stringify(customerData),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Erro ao atualizar cliente no Asaas: ${JSON.stringify(error)}`);
  }

  return response.json();
}

/**
 * Cria uma assinatura no Asaas
 */
export async function createAsaasSubscription(
  subscriptionData: AsaasSubscription
): Promise<AsaasSubscriptionResponse> {
  if (!ASAAS_API_KEY) {
    throw new Error('ASAAS_API_KEY não configurada');
  }

  const response = await fetch(`${ASAAS_API_URL}/subscriptions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      access_token: ASAAS_API_KEY,
    },
    body: JSON.stringify(subscriptionData),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Erro ao criar assinatura no Asaas: ${JSON.stringify(error)}`);
  }

  const subscription = await response.json();

  // Se for PIX, buscar dados do primeiro pagamento para obter QR Code
  if (subscriptionData.billingType === 'PIX' && subscription.id) {
    try {
      const paymentsResponse = await fetch(
        `${ASAAS_API_URL}/subscriptions/${subscription.id}/payments?limit=1`,
        {
          headers: {
            'Content-Type': 'application/json',
            access_token: ASAAS_API_KEY,
          },
        }
      );

      if (paymentsResponse.ok) {
        const paymentsData = await paymentsResponse.json();
        const firstPayment = paymentsData.data?.[0];
        
        if (firstPayment) {
          subscription.pixQrCode = firstPayment.pixQrCode;
          subscription.pixQrCodeBase64 = firstPayment.pixQrCodeBase64;
          subscription.pixCopiaECola = firstPayment.pixCopiaECola;
        }
      }
    } catch (error) {
      console.warn('[Asaas] Erro ao buscar QR Code PIX:', error);
    }
  }

  return subscription;
}

/**
 * Busca uma assinatura no Asaas pelo ID
 */
export async function getAsaasSubscription(
  subscriptionId: string
): Promise<any> {
  if (!ASAAS_API_KEY) {
    throw new Error('ASAAS_API_KEY não configurada');
  }

  const response = await fetch(`${ASAAS_API_URL}/subscriptions/${subscriptionId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      access_token: ASAAS_API_KEY,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Erro ao buscar assinatura no Asaas: ${JSON.stringify(error)}`);
  }

  return response.json();
}

/**
 * Atualiza uma assinatura no Asaas (mudança de plano, valor, etc.)
 */
export async function updateAsaasSubscription(
  subscriptionId: string,
  updates: {
    value?: number;
    billingType?: 'CREDIT_CARD' | 'PIX' | 'BOLETO' | 'DEBIT_CARD';
    cycle?: 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'SEMIANNUALLY' | 'YEARLY';
    description?: string;
  }
): Promise<any> {
  if (!ASAAS_API_KEY) {
    throw new Error('ASAAS_API_KEY não configurada');
  }

  const response = await fetch(`${ASAAS_API_URL}/subscriptions/${subscriptionId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      access_token: ASAAS_API_KEY,
    },
    body: JSON.stringify(updates),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Erro ao atualizar assinatura no Asaas: ${JSON.stringify(error)}`);
  }

  return response.json();
}

/**
 * Cancela uma assinatura no Asaas
 */
export async function cancelAsaasSubscription(
  subscriptionId: string
): Promise<any> {
  if (!ASAAS_API_KEY) {
    throw new Error('ASAAS_API_KEY não configurada');
  }

  const response = await fetch(`${ASAAS_API_URL}/subscriptions/${subscriptionId}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      access_token: ASAAS_API_KEY,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Erro ao cancelar assinatura no Asaas: ${JSON.stringify(error)}`);
  }

  return response.json();
}

/**
 * Cria um pagamento manualmente (útil para primeiro pagamento de assinatura PIX ou upgrade de plano)
 */
export async function createAsaasPayment(paymentData: {
  customer: string;
  billingType: 'PIX' | 'CREDIT_CARD' | 'BOLETO' | 'DEBIT_CARD';
  value: number;
  dueDate: string; // YYYY-MM-DD
  description?: string;
  subscription?: string;
  externalReference?: string;
  installmentCount?: number; // Número de parcelas (1-12)
  creditCard?: string; // Número do cartão ou token
  creditCardToken?: string; // Token do cartão (se disponível)
  creditCardHolderInfo?: {
    name: string;
    email: string;
    cpfCnpj: string;
    postalCode: string;
    addressNumber: string;
    addressComplement?: string;
    phone: string;
  };
}): Promise<any> {
  if (!ASAAS_API_KEY) {
    throw new Error('ASAAS_API_KEY não configurada');
  }

  const response = await fetch(`${ASAAS_API_URL}/payments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      access_token: ASAAS_API_KEY,
    },
    body: JSON.stringify(paymentData),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Erro ao criar pagamento no Asaas: ${JSON.stringify(error)}`);
  }

  return response.json();
}

/**
 * Busca QR Code PIX de um pagamento
 */
export async function getAsaasPaymentPixQrCode(paymentId: string): Promise<{
  encodedImage: string;
  payload: string;
  expirationDate: string;
}> {
  if (!ASAAS_API_KEY) {
    throw new Error('ASAAS_API_KEY não configurada');
  }

  const response = await fetch(`${ASAAS_API_URL}/payments/${paymentId}/pixQrCode`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      access_token: ASAAS_API_KEY,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Erro ao buscar QR Code PIX: ${JSON.stringify(error)}`);
  }

  return response.json();
}

/**
 * Lista pagamentos de uma assinatura
 */
export async function getAsaasSubscriptionPayments(
  subscriptionId: string
): Promise<AsaasPayment[]> {
  if (!ASAAS_API_KEY) {
    throw new Error('ASAAS_API_KEY não configurada');
  }

  const response = await fetch(
    `${ASAAS_API_URL}/subscriptions/${subscriptionId}/payments`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        access_token: ASAAS_API_KEY,
      },
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Erro ao listar pagamentos no Asaas: ${JSON.stringify(error)}`);
  }

  const data = await response.json();
  return data.data || [];
}

/**
 * Configuração de preços dos planos
 * Valores da página /vendas
 */
export const PLAN_PRICES = {
  basic: 297.00,
  complete: 497.00,
  premium: 797.00,
} as const;

/**
 * Gera link de checkout do Asaas
 */
export function generateAsaasCheckoutLink(
  subscriptionId: string,
  customerId: string
): string {
  return `https://www.asaas.com/c/${customerId}/subscription/${subscriptionId}`;
}
