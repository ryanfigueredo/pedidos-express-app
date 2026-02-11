import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const startTime = Date.now();
  const { id: orderId } = await params;

  try {
    const authUser = await getAuthUser(request);
    if (!authUser) {
      return NextResponse.json(
        { message: "Não autenticado" },
        { status: 401 }
      );
    }

    // Verifica se o pedido existe
    const existingOrder = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!existingOrder) {
      const responseTime = Date.now() - startTime;
      console.log(
        `[MARK-PRINTED] Pedido não encontrado - ID: ${orderId} - Tempo: ${responseTime}ms`
      );
      return NextResponse.json(
        { message: "Pedido não encontrado" },
        { status: 404 }
      );
    }

    if (authUser.tenant_id && existingOrder.tenant_id !== authUser.tenant_id) {
      return NextResponse.json({ message: "Acesso negado" }, { status: 403 });
    }

    // Atualiza o status do pedido para 'printed' e limpa solicitação de impressão
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: { status: "printed", print_requested_at: null },
    });

    const responseTime = Date.now() - startTime;

    // Log detalhado para monitoramento
    console.log(`[MARK-PRINTED] Pedido atualizado com sucesso`);
    console.log(`  - ID: ${orderId}`);
    console.log(`  - Status anterior: ${existingOrder.status}`);
    console.log(`  - Status novo: ${updatedOrder.status}`);
    console.log(`  - Tempo de resposta: ${responseTime}ms`);
    console.log(`  - Timestamp: ${new Date().toISOString()}`);

    return NextResponse.json(
      {
        message: "Pedido marcado como impresso",
        order: updatedOrder,
        responseTime: `${responseTime}ms`,
      },
      { status: 200 }
    );
  } catch (error) {
    const responseTime = Date.now() - startTime;

    console.error(
      `[MARK-PRINTED] Erro ao atualizar pedido - ID: ${orderId} - Tempo de resposta: ${responseTime}ms`
    );
    console.error("Erro detalhado:", error);

    return NextResponse.json(
      {
        message: "Erro ao atualizar status do pedido",
        error: String(error),
        responseTime: `${responseTime}ms`,
      },
      { status: 500 }
    );
  }
}
