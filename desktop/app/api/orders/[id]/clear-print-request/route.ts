import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Limpa a solicitação de impressão (chamado pelo app-admin após imprimir).
 */
export async function PATCH(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const orderId = params.id;

  try {
    await prisma.order.update({
      where: { id: orderId },
      data: { print_requested_at: null },
    });

    return NextResponse.json(
      { message: "Solicitação de impressão limpa" },
      { status: 200 }
    );
  } catch (error) {
    console.error(`[CLEAR-PRINT-REQUEST] Erro - ID: ${orderId}`, error);
    return NextResponse.json(
      { message: "Erro ao limpar solicitação", error: String(error) },
      { status: 500 }
    );
  }
}
