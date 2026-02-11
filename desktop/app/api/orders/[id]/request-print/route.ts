import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Solicita impressão do pedido. O app-admin na próxima atualização
 * vê print_requested_at e imprime, depois chama clear-print-request.
 */
export async function PATCH(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const orderId = params.id;

  try {
    const existingOrder = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!existingOrder) {
      return NextResponse.json(
        { message: "Pedido não encontrado" },
        { status: 404 }
      );
    }

    await prisma.order.update({
      where: { id: orderId },
      data: { print_requested_at: new Date() },
    });

    console.log(`[REQUEST-PRINT] Pedido ${orderId} solicitado para impressão`);

    return NextResponse.json(
      { message: "Impressão solicitada. O app vai imprimir em breve." },
      { status: 200 }
    );
  } catch (error) {
    console.error(`[REQUEST-PRINT] Erro - ID: ${orderId}`, error);
    return NextResponse.json(
      { message: "Erro ao solicitar impressão", error: String(error) },
      { status: 500 }
    );
  }
}
