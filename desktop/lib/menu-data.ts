/**
 * Dados do cardápio - compartilhado entre admin e bot.
 * Futuramente migrar para banco (model MenuItem com tenant_id).
 *
 * Onde alterar nomes (ex: "Hamb. Bovino Simples"):
 * - Este arquivo: edite o array MENU_ITEMS abaixo.
 * - Admin: PUT /api/admin/menu altera em memória; alterações se perdem ao reiniciar o servidor.
 */

export interface MenuItemData {
  id: string;
  name: string;
  price: number;
  category: string;
  available: boolean;
  order: number;
}

// Cardápio em memória (por enquanto global; futuramente por tenant)
let MENU_ITEMS: MenuItemData[] = [
  {
    id: "hamburguer_bovino_simples",
    name: "Hamb. Bovino Simples",
    price: 18,
    category: "hamburguer",
    available: true,
    order: 1,
  },
  {
    id: "hamburguer_bovino_duplo",
    name: "Hamb. Bovino Duplo",
    price: 28,
    category: "hamburguer",
    available: true,
    order: 2,
  },
  {
    id: "hamburguer_suino_simples",
    name: "Hamb. Suíno Simples",
    price: 20,
    category: "hamburguer",
    available: true,
    order: 3,
  },
  {
    id: "hamburguer_suino_duplo",
    name: "Hamb. Suíno Duplo",
    price: 30,
    category: "hamburguer",
    available: true,
    order: 4,
  },
  {
    id: "refrigerante_coca",
    name: "Coca-Cola",
    price: 5,
    category: "bebida",
    available: true,
    order: 1,
  },
  {
    id: "refrigerante_pepsi",
    name: "Pepsi",
    price: 5,
    category: "bebida",
    available: true,
    order: 2,
  },
  {
    id: "refrigerante_guarana",
    name: "Guaraná",
    price: 5,
    category: "bebida",
    available: true,
    order: 3,
  },
  {
    id: "refrigerante_fanta",
    name: "Fanta",
    price: 5,
    category: "bebida",
    available: true,
    order: 4,
  },
  {
    id: "suco_laranja",
    name: "Suco de Laranja",
    price: 6,
    category: "bebida",
    available: true,
    order: 5,
  },
  {
    id: "suco_maracuja",
    name: "Suco de Maracujá",
    price: 6,
    category: "bebida",
    available: true,
    order: 6,
  },
  {
    id: "suco_limao",
    name: "Suco de Limão",
    price: 6,
    category: "bebida",
    available: true,
    order: 7,
  },
  {
    id: "suco_abacaxi",
    name: "Suco de Abacaxi",
    price: 6,
    category: "bebida",
    available: true,
    order: 8,
  },
  {
    id: "agua",
    name: "Água",
    price: 3,
    category: "bebida",
    available: true,
    order: 9,
  },
  {
    id: "batata_frita",
    name: "Porção de Batata Frita",
    price: 10,
    category: "acompanhamento",
    available: true,
    order: 1,
  },
];

/**
 * Retorna itens do cardápio ordenados por categoria e order.
 * @param tenantId - Futuramente filtrar por tenant; hoje ignora.
 */
export function getMenuItems(_tenantId?: string): MenuItemData[] {
  return [...MENU_ITEMS].sort((a, b) => {
    if (a.category !== b.category) return a.category.localeCompare(b.category);
    return a.order - b.order;
  });
}

/**
 * Atualiza um item do cardápio (usado pelo admin).
 */
export function updateMenuItem(
  id: string,
  updates: Partial<MenuItemData>,
): MenuItemData | null {
  const idx = MENU_ITEMS.findIndex((i) => i.id === id);
  if (idx === -1) return null;
  MENU_ITEMS[idx] = { ...MENU_ITEMS[idx], ...updates };
  return MENU_ITEMS[idx];
}

/**
 * Adiciona item ao cardápio.
 */
export function addMenuItem(item: Omit<MenuItemData, "order">): MenuItemData {
  const maxOrder = MENU_ITEMS.filter(
    (i) => i.category === item.category,
  ).reduce((m, i) => Math.max(m, i.order), 0);
  const newItem: MenuItemData = { ...item, order: maxOrder + 1 };
  MENU_ITEMS.push(newItem);
  return newItem;
}

/**
 * Remove item do cardápio.
 */
export function removeMenuItem(id: string): boolean {
  const idx = MENU_ITEMS.findIndex((i) => i.id === id);
  if (idx === -1) return false;
  MENU_ITEMS.splice(idx, 1);
  return true;
}

/**
 * Retorna referência interna (para admin que precisa mutar).
 * Evitar usar fora do admin.
 */
export function getMenuItemsRef(): MenuItemData[] {
  return MENU_ITEMS;
}
