/**
 * Configuração de entregas (endereço do restaurante e valores).
 * Em produção pode ser movido para banco (tenant) ou cache.
 */

export interface DeliveryConfig {
  /** Endereço completo do restaurante (para cálculo de distância) */
  restaurantAddress: string;
  /** Taxa fixa de entrega em R$ */
  deliveryBaseFee: number;
  /** Valor por km adicional em R$ (opcional) */
  deliveryFeePerKm: number;
  /** Raio máximo de entrega em km (0 = sem limite) */
  maxDeliveryKm: number;
  lastUpdated: string;
}

const defaults: DeliveryConfig = {
  restaurantAddress: "",
  deliveryBaseFee: 0,
  deliveryFeePerKm: 0,
  maxDeliveryKm: 0,
  lastUpdated: new Date().toISOString(),
};

let state: DeliveryConfig = { ...defaults };

export function getDeliveryConfig(): DeliveryConfig {
  return { ...state };
}

export function updateDeliveryConfig(
  partial: Partial<Omit<DeliveryConfig, "lastUpdated">>
): DeliveryConfig {
  state = {
    ...state,
    ...partial,
    lastUpdated: new Date().toISOString(),
  };
  return { ...state };
}
