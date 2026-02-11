/**
 * Helper para obter labels dinâmicos baseados no tipo de negócio
 */

export interface UserWithBusinessType {
  business_type?: string | null;
}

export function getLabel(
  user: UserWithBusinessType | null | undefined,
  defaultLabel: string,
  dentistaLabel: string
): string {
  if (!user || !user.business_type) {
    return defaultLabel;
  }
  return user.business_type === "DENTISTA" ? dentistaLabel : defaultLabel;
}

// Labels principais
export function getOrdersLabel(user: UserWithBusinessType | null | undefined): string {
  return getLabel(user, "Pedidos", "Agendamentos");
}

export function getMenuLabel(user: UserWithBusinessType | null | undefined): string {
  return getLabel(user, "Cardápio", "Procedimentos");
}

export function getOrderLabel(user: UserWithBusinessType | null | undefined): string {
  return getLabel(user, "Pedido", "Agendamento");
}

export function getOrdersTodayLabel(user: UserWithBusinessType | null | undefined): string {
  return getLabel(user, "Pedidos Hoje", "Agendamentos Hoje");
}

export function getItemsLabel(user: UserWithBusinessType | null | undefined): string {
  return getLabel(user, "Itens", "Procedimentos");
}

export function getItemLabel(user: UserWithBusinessType | null | undefined): string {
  return getLabel(user, "Item", "Procedimento");
}
