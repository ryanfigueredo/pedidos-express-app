/**
 * Estado compartilhado do status da loja
 * Em produção, isso deveria ser armazenado em banco de dados ou cache Redis
 */

export interface StoreStatus {
  isOpen: boolean
  nextOpenTime: string | null // Formato: "HH:mm" ou null se não vai abrir hoje
  message: string | null // Mensagem customizada (opcional)
  lastUpdated: string // ISO timestamp
}

// Estado em memória (compartilhado entre endpoints)
let storeStatus: StoreStatus = {
  isOpen: true, // Por padrão, loja está aberta
  nextOpenTime: null,
  message: null,
  lastUpdated: new Date().toISOString()
}

export function getStoreStatus(): StoreStatus {
  return { ...storeStatus } // Retorna cópia para evitar mutação
}

export function updateStoreStatus(status: {
  isOpen: boolean
  nextOpenTime?: string | null
  message?: string | null
}): StoreStatus {
  storeStatus = {
    isOpen: status.isOpen,
    nextOpenTime: status.nextOpenTime ?? null,
    message: status.message ?? null,
    lastUpdated: new Date().toISOString()
  }
  return { ...storeStatus }
}
