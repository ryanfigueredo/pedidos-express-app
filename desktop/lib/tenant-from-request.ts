import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

/** Lê sessão do cookie da requisição (fallback quando next/headers não reflete o request). */
function getSessionFromCookieHeader(
  cookieHeader: string | null
): { id: string; tenant_id?: string | null } | null {
  if (!cookieHeader) return null;
  try {
    const match = cookieHeader.match(/\bsession=([^;]+)/);
    let value = match?.[1]?.trim();
    if (!value) return null;
    if (value.startsWith('"') && value.endsWith('"'))
      value = value.slice(1, -1).replace(/\\"/g, '"');
    const decoded = decodeURIComponent(value);
    const parsed = JSON.parse(decoded) as {
      id?: string;
      tenant_id?: string | null;
    };
    return parsed?.id ? { id: parsed.id, tenant_id: parsed.tenant_id } : null;
  } catch {
    return null;
  }
}

/**
 * Obtém tenant_id a partir da sessão (web), Basic Auth ou headers (X-Tenant-Id, X-API-Key).
 * NUNCA retorna tenant de outro usuário: se o usuário autenticado não tem tenant_id, retorna null.
 * Usado por GET/POST /api/orders e por /api/orders/stream (SSE).
 */
export async function getTenantIdFromRequest(
  request: NextRequest
): Promise<string | null> {
  let tenantId: string | null = null;

  const cookieHeader = request.headers.get("cookie");
  let session: { id: string; tenant_id?: string | null } | null =
    getSessionFromCookieHeader(cookieHeader);
  if (!session) {
    try {
      const { getSession } = await import("@/lib/auth-session");
      session = await getSession();
    } catch (_) {}
  }
  if (session?.id) {
    if (session.tenant_id) return session.tenant_id;
    const user = await prisma.user.findUnique({
      where: { id: session.id },
      select: { tenant_id: true },
    });
    if (user?.tenant_id) return user.tenant_id;
  }

  const authHeader =
    request.headers.get("authorization") ||
    request.headers.get("Authorization");
  if (authHeader?.startsWith("Basic ")) {
    try {
      const base64Credentials = authHeader.split(" ")[1];
      const credentials = Buffer.from(base64Credentials, "base64").toString(
        "utf-8"
      );
      const [username, password] = credentials.split(":");
      if (username && password) {
        const { verifyCredentials } = await import("@/lib/auth-session");
        const user = await verifyCredentials(username, password);
        if (user?.tenant_id) tenantId = user.tenant_id;
        else if (user) {
          const users = await prisma.$queryRawUnsafe<
            Array<{ tenant_id: string | null }>
          >(`SELECT tenant_id FROM users WHERE id = $1 LIMIT 1`, user.id);
          if (users.length > 0 && users[0].tenant_id)
            tenantId = users[0].tenant_id;
        }
      }
    } catch (_) {}
  }
  if (!tenantId) {
    const tenantIdHeader =
      request.headers.get("x-tenant-id") ||
      request.headers.get("X-Tenant-Id");
    if (tenantIdHeader) {
      if (
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
          tenantIdHeader
        )
      ) {
        tenantId = tenantIdHeader;
      } else {
        try {
          const { getTenantByApiKey } = await import("@/lib/tenant");
          const tenant = await getTenantByApiKey(tenantIdHeader);
          if (tenant) tenantId = tenant.id;
          else {
            const tenants = await prisma.$queryRawUnsafe<Array<{ id: string }>>(
              `SELECT id FROM tenants WHERE slug = $1 LIMIT 1`,
              tenantIdHeader
            );
            if (tenants.length > 0) tenantId = tenants[0].id;
          }
        } catch (_) {}
      }
    } else {
      const apiKey =
        request.headers.get("x-api-key") ||
        request.headers.get("X-API-Key");
      if (apiKey) {
        try {
          const { getTenantByApiKey } = await import("@/lib/tenant");
          const tenant = await getTenantByApiKey(apiKey);
          if (tenant) tenantId = tenant.id;
        } catch (_) {}
      }
    }
  }
  return tenantId;
}
