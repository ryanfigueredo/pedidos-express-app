import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Rate limiting simples em memória (para produção, usar Redis)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

function getRateLimitKey(request: NextRequest): string {
  // Usar IP do cliente
  const ip = request.ip || request.headers.get("x-forwarded-for") || "unknown";
  return ip;
}

function checkRateLimit(request: NextRequest): boolean {
  const key = getRateLimitKey(request);
  const now = Date.now();
  const limit = 100; // 100 requisições
  const window = 60000; // por minuto

  const record = rateLimitMap.get(key);

  if (!record || now > record.resetTime) {
    rateLimitMap.set(key, { count: 1, resetTime: now + window });
    return true;
  }

  if (record.count >= limit) {
    return false;
  }

  record.count++;
  return true;
}

// Limpar map antigo periodicamente
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of rateLimitMap.entries()) {
    if (now > record.resetTime) {
      rateLimitMap.delete(key);
    }
  }
}, 60000); // Limpar a cada minuto

export function middleware(request: NextRequest) {
  // Redirecionar URL sem hífen para a rota correta
  if (request.nextUrl.pathname === "/politicaprivacidade") {
    return NextResponse.redirect(new URL("/politica-privacidade", request.url));
  }

  const sessionCookie = request.cookies.get("session");
  const isAuthPage = request.nextUrl.pathname.startsWith("/login");
  const isSuportePage = request.nextUrl.pathname.startsWith("/suporte");
  const isPrivacidadePage =
    request.nextUrl.pathname.startsWith("/privacidade") ||
    request.nextUrl.pathname.startsWith("/politica-privacidade") ||
    request.nextUrl.pathname.startsWith("/politicaprivacidade") ||
    request.nextUrl.pathname.startsWith("/opcoes-privacidade");
  const isHomePage = request.nextUrl.pathname === "/";
  const isVendasPage = request.nextUrl.pathname === "/vendas";
  const isCheckoutPage = request.nextUrl.pathname.startsWith("/checkout");
  const isApiAuth = request.nextUrl.pathname.startsWith("/api/auth");
  const isApiRoute = request.nextUrl.pathname.startsWith("/api/");
  const isWebhook =
    request.nextUrl.pathname.startsWith("/api/webhook") ||
    request.nextUrl.pathname.startsWith("/api/bot/webhook");

  // Rate limiting para APIs (exceto auth e webhook Meta)
  if (isApiRoute && !isApiAuth && !isWebhook) {
    if (!checkRateLimit(request)) {
      return NextResponse.json(
        {
          error: "Too Many Requests",
          message: "Rate limit exceeded. Please try again later.",
        },
        { status: 429 },
      );
    }
  }

  // Permitir acesso às páginas públicas (home, vendas, login, suporte, privacidade, checkout) e APIs
  if (
    isHomePage ||
    isVendasPage ||
    isAuthPage ||
    isSuportePage ||
    isPrivacidadePage ||
    isCheckoutPage ||
    isApiAuth ||
    isApiRoute
  ) {
    return NextResponse.next();
  }

  // Se não tem sessão e não está na página pública, redirecionar
  if (!sessionCookie) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
