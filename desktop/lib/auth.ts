import { NextRequest, NextResponse } from "next/server";
import { getTenantByApiKey, TenantInfo } from "./tenant";
import { verifyCredentials } from "./auth-session";

/**
 * Valida se a requisição contém a API_KEY válida no header e retorna o tenant
 * @param request - Requisição HTTP do Next.js
 * @returns Objeto com isValid, tenant (se válido) e response (se inválido)
 */
export async function validateApiKey(request: NextRequest): Promise<{
  isValid: boolean;
  tenant?: TenantInfo;
  response?: NextResponse;
}> {
  const apiKey =
    request.headers.get("x-api-key") || request.headers.get("X-API-Key");

  if (!apiKey) {
    return {
      isValid: false,
      response: NextResponse.json(
        {
          success: false,
          error: "Unauthorized",
          message: "API_KEY não fornecida no header. Use o header X-API-Key.",
        },
        { status: 401 }
      ),
    };
  }

  // Buscar tenant pelo API key
  const tenant = await getTenantByApiKey(apiKey);

  if (!tenant) {
    return {
      isValid: false,
      response: NextResponse.json(
        {
          success: false,
          error: "Unauthorized",
          message: "API_KEY inválida ou tenant inativo",
        },
        { status: 401 }
      ),
    };
  }

  return { isValid: true, tenant };
}

/**
 * Valida Basic Auth (usado pelo app mobile)
 * @param request - Requisição HTTP do Next.js
 * @returns Objeto com isValid e user (se válido)
 */
export async function validateBasicAuth(request: NextRequest): Promise<{
  isValid: boolean;
  user?: any;
}> {
  const authHeader =
    request.headers.get("authorization") ||
    request.headers.get("Authorization");

  if (!authHeader || !authHeader.startsWith("Basic ")) {
    return { isValid: false };
  }

  try {
    // Decodificar Basic Auth
    const base64Credentials = authHeader.split(" ")[1];
    const credentials = Buffer.from(base64Credentials, "base64").toString(
      "utf-8"
    );
    const [username, password] = credentials.split(":");

    if (!username || !password) {
      return { isValid: false };
    }

    // Verificar credenciais
    const user = await verifyCredentials(username, password);

    if (!user) {
      return { isValid: false };
    }

    return { isValid: true, user };
  } catch (error) {
    return { isValid: false };
  }
}

/**
 * Obtém usuário autenticado de sessão (web) ou Basic Auth (app mobile)
 * Para uso em APIs admin que precisam funcionar em ambos
 */
export async function getAuthUser(
  request: NextRequest
): Promise<{ id: string; tenant_id?: string | null; role?: string } | null> {
  const { getSession } = await import("./auth-session");
  const session = await getSession();
  if (session) return session;

  const basic = await validateBasicAuth(request);
  if (basic.isValid && basic.user) {
    return {
      id: basic.user.id,
      tenant_id: basic.user.tenant_id,
      role: basic.user.role,
    };
  }
  return null;
}
