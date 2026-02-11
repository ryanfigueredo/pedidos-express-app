/**
 * Preços e cálculos dos planos
 */

export const PLAN_PRICES_MONTHLY = {
  basic: 297,
  complete: 497,
  premium: 797,
};

// Preços mensais equivalentes com desconto anual (15% de desconto)
// Calculado: preço mensal × 0.85 (desconto de 15%)
export const PLAN_PRICES_YEARLY_MONTHLY = {
  basic: Math.round(297 * 0.85), // R$ 252,45 → R$ 252/mês
  complete: Math.round(497 * 0.85), // R$ 422,45 → R$ 422/mês
  premium: Math.round(797 * 0.85), // R$ 677,45 → R$ 677/mês
};

// Preços anuais totais (mensal equivalente × 12)
export const PLAN_PRICES_YEARLY = {
  basic: PLAN_PRICES_YEARLY_MONTHLY.basic * 12, // R$ 3.024/ano
  complete: PLAN_PRICES_YEARLY_MONTHLY.complete * 12, // R$ 5.064/ano
  premium: PLAN_PRICES_YEARLY_MONTHLY.premium * 12, // R$ 8.124/ano
};

export type PlanType = "basic" | "complete" | "premium";
export type BillingCycle = "monthly" | "yearly";

export interface PlanPricing {
  planType: PlanType;
  cycle: BillingCycle;
  monthlyPrice: number;
  yearlyPrice: number;
  monthlyEquivalent: number; // Preço mensal equivalente (para anual)
  discount?: number; // Desconto percentual
}

export function getPlanPricing(
  planType: PlanType,
  cycle: BillingCycle
): PlanPricing {
  const monthlyPrice = PLAN_PRICES_MONTHLY[planType];
  const yearlyPrice = PLAN_PRICES_YEARLY[planType];
  const monthlyEquivalent = PLAN_PRICES_YEARLY_MONTHLY[planType];

  if (cycle === "yearly") {
    const discount = Math.round(
      ((monthlyPrice * 12 - yearlyPrice) / (monthlyPrice * 12)) * 100
    );
    return {
      planType,
      cycle,
      monthlyPrice,
      yearlyPrice,
      monthlyEquivalent,
      discount,
    };
  }

  return {
    planType,
    cycle,
    monthlyPrice,
    yearlyPrice,
    monthlyEquivalent,
  };
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}
