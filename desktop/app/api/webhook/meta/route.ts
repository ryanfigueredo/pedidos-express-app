/**
 * Webhook Meta - redireciona para o mesmo handler do RFID (api/bot/webhook)
 * URL: https://pedidos-express-api.vercel.app/api/webhook/meta
 *
 * Meta pode usar /api/webhook/meta OU /api/bot/webhook - ambos funcionam
 */
export { GET, POST } from "@/app/api/bot/webhook/route";
