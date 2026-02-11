import { NextRequest, NextResponse } from "next/server";
import { validateApiKey, validateBasicAuth } from "@/lib/auth";
import { getSession } from "@/lib/auth-session";

/**
 * API para listar conversas prioritárias (clientes que pediram atendente)
 * O bot armazena essas conversas e esta API busca do bot
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

    // Buscar conversas prioritárias do DynamoDB (persistido pelo webhook Meta)
    const phoneNumberId = process.env.PHONE_NUMBER_ID || null;
    let rawConversations: Array<{
      remetente: string;
      tempoEsperaMin?: number;
      timestamp?: number;
      ultimaMensagem?: number;
    }> = [];

    try {
      const { listPriorityConversations } = await import(
        "@/lib/whatsapp-bot/prioridade-dynamodb"
      );
      rawConversations = await listPriorityConversations(phoneNumberId);
    } catch (fetchError: any) {
      console.error(
        "Erro ao buscar conversas prioritárias (DynamoDB):",
        fetchError?.message
      );
    }

    // Formatar dados para o app (ordem: mais recente primeiro)
    const formatted = (rawConversations || []).map((conv: any) => ({
      phone: conv.remetente || conv.phone,
      phoneFormatted: formatPhoneForDisplay(conv.remetente || conv.phone),
      whatsappUrl: `https://wa.me/${formatPhoneForWhatsApp(
        conv.remetente || conv.phone
      )}`,
      waitTime: conv.tempoEsperaMin ?? conv.tempoEspera ?? 0,
      timestamp: conv.timestamp || Date.now(),
      lastMessage: conv.ultimaMensagem || conv.timestamp || Date.now(),
    }));
    const conversations = formatted.sort(
      (a, b) => (b.timestamp || 0) - (a.timestamp || 0)
    );

    return NextResponse.json(
      {
        conversations,
        total: conversations.length,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Erro ao buscar conversas prioritárias:", error);
    console.error("Detalhes do erro:", {
      message: error?.message,
      stack: error?.stack,
    });
    // Retorna lista vazia em caso de erro
    return NextResponse.json({ conversations: [], total: 0 }, { status: 200 });
  }
}

/**
 * Formata telefone para exibição (ex: (21) 99762-4873)
 */
function formatPhoneForDisplay(phone: string): string {
  // Remove @s.whatsapp.net se tiver
  let clean = phone.replace("@s.whatsapp.net", "").replace(/\D/g, "");

  // Remove código do país (55) se tiver
  if (clean.startsWith("55") && clean.length > 11) {
    clean = clean.substring(2);
  }

  // Formata: (XX) XXXXX-XXXX
  if (clean.length === 11) {
    return `(${clean.substring(0, 2)}) ${clean.substring(
      2,
      7
    )}-${clean.substring(7)}`;
  } else if (clean.length === 10) {
    return `(${clean.substring(0, 2)}) ${clean.substring(
      2,
      6
    )}-${clean.substring(6)}`;
  }

  return clean;
}

/**
 * Formata telefone para URL do WhatsApp (ex: 5521997624873)
 */
function formatPhoneForWhatsApp(phone: string): string {
  // Remove @s.whatsapp.net se tiver
  let clean = phone.replace("@s.whatsapp.net", "").replace(/\D/g, "");

  // Adiciona código do país se não tiver
  if (!clean.startsWith("55") && clean.length >= 10) {
    clean = `55${clean}`;
  }

  return clean;
}
