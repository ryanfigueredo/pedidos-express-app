/**
 * Sentry Error Tracking Configuration (OPCIONAL)
 * 
 * ⚠️ NÃO É OBRIGATÓRIO! O sistema funciona perfeitamente sem Sentry.
 * 
 * Sentry é apenas para monitoramento avançado de erros (opcional).
 * Plano gratuito: 5.000 eventos/mês (suficiente para começar).
 * 
 * Para usar (opcional):
 * 1. Criar conta gratuita em: https://sentry.io
 * 2. Adicionar SENTRY_DSN no .env:
 *    SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
 * 3. Instalar: npm install @sentry/nextjs
 * 
 * Se não configurar SENTRY_DSN, o sistema simplesmente não inicializa Sentry
 * e funciona normalmente sem ele.
 */

let sentryInitialized = false

export function initSentry() {
  if (sentryInitialized) return
  if (typeof window === 'undefined') {
    // Server-side
    const dsn = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN
    if (dsn) {
      try {
        // Dynamic import para não quebrar se Sentry não estiver instalado
        const sentryModule = '@sentry/nextjs'
        import(sentryModule).then((Sentry: any) => {
          Sentry.init({
            dsn,
            environment: process.env.NODE_ENV || 'development',
            tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
            debug: process.env.NODE_ENV === 'development',
          })
          sentryInitialized = true
          console.log('[Sentry] Inicializado no servidor')
        }).catch(() => {
          console.warn('[Sentry] Não instalado. Execute: npm install @sentry/nextjs')
        })
      } catch (error) {
        console.warn('[Sentry] Erro ao inicializar:', error)
      }
    }
  } else {
    // Client-side
    const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN
    if (dsn) {
      try {
        const sentryModule = '@sentry/nextjs'
        import(sentryModule).then((Sentry: any) => {
          Sentry.init({
            dsn,
            environment: process.env.NODE_ENV || 'development',
            tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
            debug: process.env.NODE_ENV === 'development',
            beforeSend(event: any, hint: any) {
              // Filtrar erros conhecidos ou não críticos
              if (event.exception) {
                const error = hint.originalException
                if (error instanceof Error) {
                  // Não reportar erros de rede comuns
                  if (error.message.includes('Failed to fetch') || 
                      error.message.includes('NetworkError')) {
                    return null
                  }
                }
              }
              return event
            }
          })
          sentryInitialized = true
          console.log('[Sentry] Inicializado no cliente')
        }).catch(() => {
          console.warn('[Sentry] Não instalado')
        })
      } catch (error) {
        console.warn('[Sentry] Erro ao inicializar:', error)
      }
    }
  }
}

// Inicializar automaticamente se DSN estiver configurado
if (typeof window !== 'undefined') {
  // Client-side: inicializar após mount
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSentry)
  } else {
    initSentry()
  }
} else {
  // Server-side: inicializar imediatamente
  initSentry()
}
