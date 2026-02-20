/**
 * Slots de agendamento (barbeiro, etc.)
 * Gera horários padrão 9h–18h, 30 min, e consulta disponibilidade.
 */

import { prisma } from "@/lib/prisma";

const DEFAULT_START_HOUR = 9;
const DEFAULT_END_HOUR = 18;
const SLOT_MINUTES = 30;

/** Gera slots para um dia (9h–18h, 30 min) se ainda não existirem. */
export async function ensureSlotsForDate(
  tenantId: string,
  date: Date
): Promise<void> {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  const existing = await prisma.slot.count({
    where: {
      tenant_id: tenantId,
      start_time: { gte: startOfDay, lte: endOfDay },
    },
  });
  if (existing > 0) return;

  const slots: { tenant_id: string; start_time: Date; end_time: Date }[] = [];
  for (let h = DEFAULT_START_HOUR; h < DEFAULT_END_HOUR; h++) {
    for (let m = 0; m < 60; m += SLOT_MINUTES) {
      const start = new Date(date);
      start.setHours(h, m, 0, 0);
      const end = new Date(start);
      end.setMinutes(end.getMinutes() + SLOT_MINUTES);
      if (end.getHours() > DEFAULT_END_HOUR) break;
      slots.push({
        tenant_id: tenantId,
        start_time: start,
        end_time: end,
      });
    }
  }

  await prisma.slot.createMany({
    data: slots.map((s) => ({ ...s, status: "available" })),
  });
}

/** Retorna slots disponíveis para tenant na data (gera se não existir). */
export async function getAvailableSlots(
  tenantId: string,
  date: Date
): Promise<{ id: string; start_time: string; end_time: string }[]> {
  await ensureSlotsForDate(tenantId, date);

  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  const now = new Date();
  const slots = await prisma.slot.findMany({
    where: {
      tenant_id: tenantId,
      status: "available",
      start_time: { gte: startOfDay, lte: endOfDay },
      end_time: { gt: now }, // não mostrar slots já passados
    },
    orderBy: { start_time: "asc" },
  });

  return slots.map((s) => ({
    id: s.id,
    start_time: s.start_time.toISOString(),
    end_time: s.end_time.toISOString(),
  }));
}

/** Marca slot como ocupado e vincula ao pedido (appointment). */
export async function bookSlot(
  slotId: string,
  orderId: string
): Promise<boolean> {
  const updated = await prisma.slot.updateMany({
    where: { id: slotId, status: "available" },
    data: { status: "booked", order_id: orderId },
  });
  return updated.count > 0;
}

/** Retorna o slot por ID (para obter start_time/end_time ao criar order). */
export async function getSlotById(slotId: string) {
  return prisma.slot.findUnique({
    where: { id: slotId },
  });
}
