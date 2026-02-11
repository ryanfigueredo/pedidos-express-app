/**
 * Sequência diária de pedidos por horário de Brasília (00h BRT = novo dia).
 * display_id: 01, 02, ... 99, 100, 101 (sem #).
 */

/** Retorna [início do dia, fim do dia] em Brasília (America/Sao_Paulo) como Date. */
export function getTodayBRTBounds(): { start: Date; end: Date } {
  const now = new Date()
  const brtDateStr = now.toLocaleDateString("en-CA", {
    timeZone: "America/Sao_Paulo",
  })
  const [y, m, d] = brtDateStr.split("-").map(Number)
  // 00:00 BRT = 03:00 UTC (America/Sao_Paulo UTC-3)
  const start = new Date(Date.UTC(y, m - 1, d, 3, 0, 0, 0))
  const end = new Date(Date.UTC(y, m - 1, d + 1, 2, 59, 59, 999)) // 23:59:59.999 BRT
  return { start, end }
}

/** Formata sequência: 1–99 com 2 dígitos (01..99), 100+ sem zero à esquerda. */
export function formatDisplayId(sequence: number): string {
  if (sequence <= 0) return "01"
  if (sequence <= 99) return String(sequence).padStart(2, "0")
  return String(sequence)
}
