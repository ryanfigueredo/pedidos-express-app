import { NextRequest, NextResponse } from "next/server";
import { validateApiKey, validateBasicAuth } from "@/lib/auth";
import { getSession } from "@/lib/auth-session";

/**
 * API para buscar histórico de mensagens de uma conversa
 * GET /api/admin/conversation-history?phone=5521997624873
 */
export async function GET(request: NextRequest) {
  try {
    // Verificar autenticação: pode ser por sessão (web), API_KEY (app) ou Basic Auth (app mobile)
    const session = await getSession();
    let authValidation: { isValid: boolean; tenant?: any; response?: any } = {
      isValid: false,
    };
    let basicAuth: { isValid: boolean; user?: any } = { isValid: false };

    try {
      authValidation = await validateApiKey(request);
    } catch (error) {
      console.log("Erro ao validar API key:", error);
      authValidation = { isValid: false };
    }

    try {
      basicAuth = await validateBasicAuth(request);
    } catch (error) {
      console.log("Erro ao validar Basic Auth:", error);
      basicAuth = { isValid: false };
    }

    // Se não tem sessão, API_KEY válida nem Basic Auth válida, retorna erro
    if (!session && !authValidation.isValid && !basicAuth.isValid) {
      return (
        authValidation.response ||
        NextResponse.json(
          { success: false, error: "Não autenticado" },
          { status: 401 }
        )
      );
    }

    const { searchParams } = new URL(request.url);
    const phone = searchParams.get("phone");

    if (!phone) {
      return NextResponse.json(
        { success: false, error: "Parâmetro 'phone' é obrigatório" },
        { status: 400 }
      );
    }

    // Por enquanto, retornar lista vazia
    // TODO: Implementar busca de histórico de mensagens do DynamoDB ou banco de dados
    // As mensagens podem estar armazenadas em:
    // 1. DynamoDB na tabela bot-delivery (conversation_states ou similar)
    // 2. Banco de dados PostgreSQL (se implementarmos tabela de mensagens)
    // 3. API da Meta (Graph API) para buscar histórico

    return NextResponse.json(
      {
        success: true,
        messages: [],
        total: 0,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Erro ao buscar histórico de conversa:", error);
    return NextResponse.json(
      { success: false, error: "Erro ao buscar histórico" },
      { status: 500 }
    );
  }
}
