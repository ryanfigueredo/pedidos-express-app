/**
 * Intervalo de datas para agenda/esteira: hoje e amanhã (ou range de X dias).
 * Usado para filtrar pedidos com appointment_date no range ou pedidos sem agendamento recentes.
 * Usa data local (servidor) para "hoje" e "amanhã".
 */

const DEFAULT_DAYS_AHEAD = 2; // hoje + amanhã

function startOfDayLocal(d: Date): Date {
  const r = new Date(d);
  r.setHours(0, 0, 0, 0);
  return r;
}

function addDays(d: Date, days: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + days);
  return r;
}

/**
 * Retorna início de hoje, fim do último dia do range (exclusive) e "2 dias atrás" (local).
 * appointment_date no banco geralmente em UTC; comparação com esses limites cobre hoje/amanhã no fuso local.
 */
export function getAgendaDateRange(daysAhead: number = DEFAULT_DAYS_AHEAD): {
  startOfToday: Date;
  endOfRange: Date;
  twoDaysAgo: Date;
} {
  const now = new Date();
  const startOfToday = startOfDayLocal(now);
  const endOfRange = addDays(startOfToday, daysAhead); // exclusive end
  const twoDaysAgo = addDays(startOfToday, -2);
  return { startOfToday, endOfRange, twoDaysAgo };
}
