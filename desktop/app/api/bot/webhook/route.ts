/**
 * Webhook WhatsApp Cloud API — Tamboril Burguer
 * URL: https://pedidos.dmtn.com.br/api/bot/webhook
 *
 * PRIORIDADE DE RESPOSTA: Retorna 200 OK IMEDIATAMENTE após receber o body,
 * para a Meta não retryar (evita mensagens duplicadas). O processamento roda
 * em background (fire-and-forget).
 *
 * Fluxo Restaurante (tenant_api_key presente):
 *   oi → Cardápio/Resumo/Atendente → menu dinâmico → pedido → Order no banco
 *
 * Fluxo simples (fallback): welcome → Lista Cardápio/Resumo/Atendente
 */

import { NextRequest, NextResponse } from "next/server";
import {
  type WhatsAppClientConfig,
  type BotOption,
} from "@/lib/whatsapp-dynamodb";

export const dynamic = "force-dynamic";
export const maxDuration = 30;
export const runtime = "nodejs";

const VERIFY_TOKEN =
  process.env.WHATSAPP_VERIFY_TOKEN || process.env.WEBHOOK_VERIFY_TOKEN || "";
const GRAPH_VERSION = process.env.WHATSAPP_GRAPH_VERSION || "v21.0";

const WELCOME_TRIGGERS = [
  "oi",
  "olá",
  "ola",
  "menu",
  "olaa",
  "inicio",
  "início",
  "começar",
  "comecar",
  "bom dia",
  "boa tarde",
  "boa noite",
];

function getOptionResponse(
  opt: BotOption,
  config: WhatsAppClientConfig
): string {
  if (opt.type === "custom" && opt.response?.trim()) return opt.response.trim();
  if (opt.type === "support") {
    return (
      config.support_message?.trim() ||
      "Em instantes um atendente vai responder. Aguarde!"
    );
  }
  if (opt.label?.includes("Cardápio")) {
    return "📋 Carregando cardápio... (em breve)";
  }
  if (opt.label?.includes("Resumo")) {
    return "🛒 Você ainda não tem itens no pedido. Digite 1 ou Cardápio para ver o menu.";
  }
  return (
    config.order_message?.trim() ||
    "Registrei seu pedido. Em instantes alguém vai responder."
  );
}

async function sendTextMessage(
  to: string,
  text: string,
  phoneNumberId: string,
  accessToken: string
): Promise<boolean> {
  const phone = String(to).replace(/\D/g, "");
  if (!phone) return false;
  const url = `https://graph.facebook.com/${GRAPH_VERSION}/${phoneNumberId}/messages`;
  console.log(
    "[Meta API] Número destino (wa_id, só dígitos):",
    phone,
    "| len:",
    phone.length
  );
  const tokenPreview = accessToken
    ? `${accessToken.slice(0, 4)}...${accessToken.slice(-4)}`
    : "(vazio)";
  console.log("[Meta API] Enviando para URL:", url);
  console.log("[Meta API] Token (4 primeiros + 4 últimos):", tokenPreview);
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: phone,
        type: "text",
        text: { body: text },
      }),
    });
    const resData = await res.text();
    console.log(
      "[Meta API] Resposta sendTextMessage:",
      res.status,
      resData?.slice(0, 200) || ""
    );
    if (!res.ok) {
      console.error(
        "[Webhook] Erro ao enviar texto:",
        res.status,
        resData,
        "| to:",
        phone
      );
      return false;
    }
    console.log("[Webhook] Texto enviado OK para", phone);
    return true;
  } catch (e) {
    const err = e instanceof Error ? e : new Error(String(e));
    console.error("[Meta API] Erro de Rede:", err.message);
    console.error("[Webhook] Erro ao enviar texto:", e);
    return false;
  }
}

/** Envia List Message estilo RFID - botão "Opções" que abre lista */
async function sendListMessage(
  to: string,
  bodyText: string,
  buttonText: string,
  options: BotOption[],
  phoneNumberId: string,
  accessToken: string
): Promise<boolean> {
  const phone = String(to).replace(/\D/g, "");
  if (!phone || options.length === 0) return false;

  const rows = options.slice(0, 10).map((opt, i) => ({
    id: `opt_${i}`,
    title: (opt.label || `Opção ${i + 1}`).slice(0, 24),
    description:
      opt.type === "order"
        ? "Registrar pedido"
        : opt.type === "support"
        ? "Falar com atendente"
        : "",
  }));

  try {
    const res = await fetch(
      `https://graph.facebook.com/${GRAPH_VERSION}/${phoneNumberId}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: phone,
          type: "interactive",
          interactive: {
            type: "list",
            body: { text: bodyText.slice(0, 1024) },
            action: {
              button: buttonText.slice(0, 20) || "Opções",
              sections: [{ title: "Escolha uma opção", rows }],
            },
          },
        }),
      }
    );
    const resData = await res.text();
    console.log(
      "[Meta API] Resposta sendListMessage:",
      res.status,
      resData?.slice(0, 200) || ""
    );
    if (!res.ok) {
      console.error(
        "[Webhook] Erro ao enviar List Message:",
        res.status,
        resData,
        "| to:",
        phone
      );
      return false;
    }
    console.log("[Webhook] List enviada OK para", phone);
    return true;
  } catch (e) {
    console.error("[Webhook] Erro ao enviar List:", e);
    return false;
  }
}

/** Envia mensagem interativa (botões ou lista) - usado pelo handlers-restaurante */
async function sendInteractive(
  to: string,
  payload: Record<string, unknown>,
  phoneNumberId: string,
  accessToken: string
): Promise<boolean> {
  const phone = String(to).replace(/\D/g, "");
  if (!phone) return false;
  const sections = (payload?.action as { sections?: { rows?: unknown[] }[] })
    ?.sections;
  const totalItems = Array.isArray(sections)
    ? sections.reduce((n, s) => n + (s?.rows?.length ?? 0), 0)
    : 0;
  if (totalItems > 0) {
    console.log("Enviando lista com " + totalItems + " itens");
  }
  try {
    const res = await fetch(
      `https://graph.facebook.com/${GRAPH_VERSION}/${phoneNumberId}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: phone,
          type: "interactive",
          interactive: payload,
        }),
      }
    );
    const resData = await res.text();
    console.log(
      "[Meta API] Resposta sendInteractive:",
      res.status,
      resData?.slice(0, 200) || ""
    );
    if (!res.ok) {
      console.error(
        "[Webhook] Erro ao enviar interativo:",
        res.status,
        resData
      );
      return false;
    }
    console.log("[Webhook] Interativo enviado OK para", phone);
    return true;
  } catch (e) {
    console.error("[Webhook] Erro ao enviar interativo:", e);
    return false;
  }
}

function isRestauranteConfig(config: WhatsAppClientConfig): boolean {
  return !!(config.tenant_api_key && config.desktop_api_url);
}

function resolveTextReply(
  messageText: string,
  config: WhatsAppClientConfig
): { text: string; sendList?: boolean } {
  const msg = messageText.trim().toLowerCase();
  const welcomeMsg =
    config.welcome_message?.trim() ||
    `Olá! Você está falando com o ${
      config.nome_do_cliente || "Tamboril Burguer"
    }. Como posso ajudar?`;
  const fallbackMsg =
    config.fallback_message?.trim() ||
    "Digite o número da opção ou o que deseja.";

  if (WELCOME_TRIGGERS.some((t) => msg.includes(t) || msg === t)) {
    const options = config.options || [];
    if (options.length > 0) {
      return { text: welcomeMsg, sendList: true };
    }
    return { text: welcomeMsg };
  }

  const options = config.options || [];
  for (let i = 0; i < options.length; i++) {
    const opt = options[i];
    const num = String(i + 1);
    const label = (opt.label || "").toLowerCase();
    const keywords = opt.keywords || [];
    const matchNum = msg === num || msg === num + ".";
    const matchLabel = label && msg.includes(label.replace(/[^\w\s]/g, ""));
    const matchKeyword = keywords.some((k) => msg.includes(k.toLowerCase()));
    if (matchNum || matchLabel || matchKeyword) {
      return { text: getOptionResponse(opt, config) };
    }
  }

  return { text: fallbackMsg };
}

function resolveInteractiveReply(
  selectedId: string,
  selectedTitle: string,
  config: WhatsAppClientConfig
): string {
  const options = config.options || [];
  const match = selectedId.match(/^opt_(\d+)$/);
  if (match) {
    const idx = parseInt(match[1], 10);
    if (idx >= 0 && idx < options.length) {
      return getOptionResponse(options[idx], config);
    }
  }
  for (const opt of options) {
    if ((opt.label || "").toLowerCase().includes(selectedTitle.toLowerCase())) {
      return getOptionResponse(opt, config);
    }
  }
  return (
    config.order_message?.trim() ||
    "Registrei seu pedido. Em instantes alguém vai responder."
  );
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (
    mode === "subscribe" &&
    token === VERIFY_TOKEN &&
    challenge != null &&
    challenge !== ""
  ) {
    return new NextResponse(String(challenge), {
      status: 200,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }

  return new NextResponse("Forbidden", {
    status: 403,
    headers: { "Content-Type": "text/plain" },
  });
}

export async function POST(request: NextRequest) {
  const receivedAt = new Date().toISOString();
  console.log("[Webhook] POST recebido em", receivedAt);
  console.log("Variável Table Name:", process.env.DYNAMODB_TABLE_NAME);

  let body: Record<string, unknown>;
  try {
    body = await request.json();
    const bodyStr = JSON.stringify(body);
    console.log(
      "[Webhook] Body recebido:",
      bodyStr.length > 2000 ? bodyStr.slice(0, 2000) + "..." : bodyStr
    );
  } catch (e) {
    console.error("[Webhook] Erro ao parsear body:", e);
    return new NextResponse("OK", { status: 200 });
  }

  const hasAws =
    !!(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) ||
    !!(
      process.env.DYNAMODB_AWS_ACCESS_KEY_ID &&
      process.env.DYNAMODB_AWS_SECRET_ACCESS_KEY
    );
  const tableName = process.env.DYNAMODB_TABLE_NAME || "bot-delivery";
  console.log("[Webhook] DynamoDB:", {
    hasCredentials: hasAws,
    table: tableName,
    region:
      process.env.DYNAMODB_AWS_REGION || process.env.AWS_REGION || "us-east-1",
  });

  // Aguardar processamento completo antes de retornar 200 (garante envio à Meta)
  const entries = (body?.entry as Array<Record<string, unknown>>) || [];
  if (entries.length > 0) {
    try {
      await processWebhookPayload(body);
    } catch (e) {
      const err = e instanceof Error ? e : new Error(String(e));
      console.error("[Webhook] Erro no processamento:", err.message);
      console.error("[Webhook] Stack:", err.stack);
    }
  }

  return new NextResponse("OK", {
    status: 200,
    headers: { "Content-Type": "text/plain" },
  });
}

function ensureHttpsUrl(url: string): string {
  const s = (url || "").trim();
  if (!s) return "https://pedidos.dmtn.com.br";
  if (s.startsWith("http://") || s.startsWith("https://")) return s;
  return `https://${s}`;
}

function buildFallbackConfig(phoneNumberId: string): WhatsAppClientConfig {
  const token = process.env.TOKEN_API_META || "";
  // DESKTOP_API_URL deve ser a URL de produção do app de pedidos (evita 401 em previews)
  const rawUrl = process.env.DESKTOP_API_URL || "pedidos.dmtn.com.br";
  const desktopUrl = ensureHttpsUrl(rawUrl);
  return {
    nome_do_cliente: process.env.NOME_DO_CLIENTE || "Tamboril Burguer",
    token_api_meta: token,
    phone_number_id: phoneNumberId,
    tenant_api_key: process.env.TENANT_API_KEY || "fallback",
    tenant_slug: process.env.TENANT_SLUG || "tamboril-burguer",
    desktop_api_url: desktopUrl,
    enabled: true,
  };
}

async function processWebhookPayload(body: Record<string, unknown>) {
  console.log(
    "[Webhook] processWebhookPayload iniciado, entries:",
    (body?.entry as unknown[])?.length ?? 0
  );
  try {
    const entries = (body?.entry as Array<Record<string, unknown>>) || [];

    for (const entry of entries) {
      const entryChanges =
        (entry?.changes as Array<Record<string, unknown>>) || [];

      for (const ch of entryChanges) {
        const val = (ch?.value as Record<string, unknown>) || {};
        const messages =
          (val?.messages as Array<Record<string, unknown>>) || [];
        const metadata = (val?.metadata as Record<string, unknown>) || {};
        const phoneNumberIdRaw = metadata?.phone_number_id;
        const phoneNumberId =
          phoneNumberIdRaw != null ? String(phoneNumberIdRaw) : undefined;

        // Usa phone_number_id do webhook ou forçado via ENV (igual ao CURL que funcionou)
        const effectivePhoneId =
          process.env.PHONE_NUMBER_ID || phoneNumberId || "";
        if (!effectivePhoneId) continue;

        const tokenEnv = process.env.TOKEN_API_META;
        if (!tokenEnv) {
          console.error(
            "[Webhook] TOKEN_API_META não definido. Configure na Vercel."
          );
          continue;
        }

        // Buscar config no DynamoDB primeiro; fallback ENV só se falhar
        let clientConfig: WhatsAppClientConfig | null = null;
        try {
          const { getWhatsAppClientConfig } = await import(
            "@/lib/whatsapp-dynamodb"
          );
          clientConfig = await getWhatsAppClientConfig(effectivePhoneId);
        } catch (e) {
          console.warn("[Webhook] DynamoDB config falhou, usando fallback");
        }
        if (!clientConfig?.token_api_meta) {
          clientConfig = buildFallbackConfig(effectivePhoneId);
          console.log("[Webhook] Usando config fallback (ENV)");
        }
        clientConfig.token_api_meta = tokenEnv;
        clientConfig.phone_number_id =
          clientConfig.phone_number_id || effectivePhoneId;
        if (clientConfig.enabled === false) continue;

        for (const msg of messages) {
          const from = msg?.from as string | undefined;
          const messageType = msg?.type as string | undefined;

          if (!from) continue;

          let messageText = "";
          let isInteractive = false;
          let interactiveId = "";
          let interactiveTitle = "";

          if (messageType === "text") {
            const textObj = msg?.text as { body?: string } | undefined;
            messageText = textObj?.body || "";
          } else if (
            messageType === "interactive" ||
            messageType === "button"
          ) {
            isInteractive = true;
            const interactive = msg?.interactive as
              | Record<string, unknown>
              | undefined;
            const buttonReply = interactive?.button_reply as
              | { id?: string; title?: string }
              | undefined;
            const listReply = interactive?.list_reply as
              | { id?: string; title?: string }
              | undefined;
            if (buttonReply) {
              interactiveId = String(buttonReply.id || "");
              interactiveTitle = String(buttonReply.title || "");
            } else if (listReply) {
              interactiveId = String(listReply.id || "");
              interactiveTitle = String(listReply.title || "");
            }
            messageText = interactiveTitle;
          }

          if (!messageText && !isInteractive) continue;

          console.log(
            "[Webhook] from:",
            from,
            "type:",
            messageType,
            "text:",
            messageText?.slice(0, 30),
            "phone_number_id:",
            effectivePhoneId
          );

          // Persistir mensagem recebida para histórico do atendimento (inbox) — toda conversa aparece no app
          try {
            const { getTenantIdFromConfig, storeBotMessage } = await import(
              "@/lib/bot-messages"
            );
            const tenantId = await getTenantIdFromConfig(
              clientConfig.tenant_slug ?? undefined,
              clientConfig.tenant_api_key ?? undefined
            );
            if (tenantId) {
              await storeBotMessage({
                tenantId,
                phoneNumberId: effectivePhoneId,
                customerPhone: from,
                direction: "in",
                body: messageText,
              });
            }
          } catch (storeErr) {
            console.error("[Webhook] Erro ao salvar mensagem (in):", storeErr);
          }

          // Fluxo Restaurante (Tamboril): cardápio dinâmico, pedidos, Order no banco
          const isRestaurante = isRestauranteConfig(clientConfig);
          if (isRestaurante) {
            try {
              const {
                handleMessageRestaurante,
              } = require("@/lib/whatsapp-bot/handlers-restaurante");
              const { getOrderStatus } = await import("@/lib/order-status");
              const config = {
                ...clientConfig,
                phone_number_id:
                  clientConfig.phone_number_id || effectivePhoneId,
                getOrderStatus: (waId: string) =>
                  getOrderStatus(waId, clientConfig.tenant_slug ?? undefined),
              };
              // Mapear opt_0/1/2 da lista inicial -> cardapio/resumo/atendente.
              let textForHandler = messageText;
              const titleLower = (interactiveTitle || "").toLowerCase();
              if (isInteractive) {
                // Priorizar IDs exatos (ver_cardapio, ver_status, falar_atendente)
                if (
                  interactiveId === "ver_cardapio" ||
                  titleLower.includes("cardápio") ||
                  titleLower.includes("cardapio")
                )
                  textForHandler = "ver_cardapio";
                else if (
                  interactiveId === "ver_status" ||
                  titleLower.includes("status")
                )
                  textForHandler = "ver_status";
                else if (
                  interactiveId === "falar_atendente" ||
                  titleLower.includes("atendente")
                )
                  textForHandler = "falar_atendente";
                else if (interactiveId === "opt_0") textForHandler = "cardapio";
                else if (interactiveId === "opt_1") textForHandler = "resumo";
                else if (interactiveId === "opt_2")
                  textForHandler = "atendente";
                else if (interactiveId === "voltar") textForHandler = "voltar";
                else if (interactiveId === "resumo") textForHandler = "resumo";
                else if (interactiveId === "voltar_cardapio")
                  textForHandler = "voltar_cardapio";
                else if (interactiveId === "upsell_voltar")
                  textForHandler = "upsell_voltar";
                else if (interactiveId === "tipo_voltar")
                  textForHandler = "tipo_voltar";
                else if (
                  interactiveId === "upsell_sim" ||
                  interactiveId === "adicionar_sim" ||
                  interactiveId === "bebida_sim"
                )
                  textForHandler = "sim";
                else if (
                  interactiveId === "upsell_nao" ||
                  interactiveId === "adicionar_nao" ||
                  interactiveId === "bebida_nao"
                )
                  textForHandler = "nao";
                else if (
                  interactiveId === "tipo_delivery" ||
                  titleLower.includes("delivery")
                )
                  textForHandler = "tipo_delivery";
                else if (
                  interactiveId === "tipo_retirar" ||
                  titleLower.includes("retirar")
                )
                  textForHandler = "tipo_retirar";
                else if (interactiveId === "pag_dinheiro")
                  textForHandler = "pag_dinheiro";
                else if (interactiveId === "pag_pix")
                  textForHandler = "pag_pix";
                else if (interactiveId === "pag_cartao")
                  textForHandler = "pag_cartao";
                else if (
                  interactiveId.startsWith("addmore|") ||
                  interactiveId.startsWith("add_") ||
                  interactiveId.startsWith("qtyadd_") ||
                  interactiveId.startsWith("batata_") ||
                  interactiveId.startsWith("local|") ||
                  interactiveId.startsWith("emcasa|") ||
                  interactiveId.startsWith("restaurante|") ||
                  interactiveId.startsWith("finish|") ||
                  interactiveId.startsWith("finish")
                )
                  textForHandler = interactiveId;
                else if (
                  interactiveId &&
                  !interactiveId.startsWith("opt_") &&
                  /^[1-9]\d*$/.test(interactiveId) &&
                  interactiveTitle
                )
                  textForHandler = interactiveTitle;
                else if (interactiveId && !interactiveId.startsWith("opt_"))
                  textForHandler = interactiveId;
              }
              console.log(
                "[Webhook] Chamando handler | textForHandler:",
                textForHandler,
                "| from:",
                from
              );
              const result = await handleMessageRestaurante(
                from,
                textForHandler,
                config
              );
              console.log(
                "3. Vou disparar para a Meta",
                result?.interactive?.type === "list"
                  ? "(list)"
                  : result?.interactive
                  ? "(interactive)"
                  : "(texto)"
              );
              try {
                const resStr =
                  result && typeof result === "object"
                    ? `reply=${!!result.reply} interactive=${!!result.interactive}`
                    : String(result);
                console.log("[Handler] Resultado:", resStr);
              } catch {
                console.log("[Handler] Resultado: (log ignorado)");
              }
              if (result?.interactive) {
                const token = clientConfig.token_api_meta;
                console.log(
                  "[Webhook] Enviando interactive via Meta API (token:",
                  token ? `${token.slice(0, 6)}...${token.slice(-4)}` : "VAZIO",
                  ")"
                );
                await sendInteractive(
                  from,
                  result.interactive as Record<string, unknown>,
                  effectivePhoneId,
                  token
                );
                const bodyOut =
                  (result.interactive as { body?: { text?: string } })?.body
                    ?.text ?? "[opções]";
                try {
                  const { getTenantIdFromConfig, storeBotMessage } = await import(
                    "@/lib/bot-messages"
                  );
                  const tenantId = await getTenantIdFromConfig(
                    clientConfig.tenant_slug ?? undefined,
                    clientConfig.tenant_api_key ?? undefined
                  );
                  if (tenantId) {
                    await storeBotMessage({
                      tenantId,
                      phoneNumberId: effectivePhoneId,
                      customerPhone: from,
                      direction: "out",
                      body: bodyOut,
                    });
                  }
                } catch (_) {}
              } else if (result?.reply) {
                const token = clientConfig.token_api_meta;
                console.log(
                  "[Webhook] Enviando texto via Meta API (token:",
                  token ? `${token.slice(0, 6)}...${token.slice(-4)}` : "VAZIO",
                  ")"
                );
                await sendTextMessage(
                  from,
                  result.reply,
                  effectivePhoneId,
                  token
                );
                try {
                  const { getTenantIdFromConfig, storeBotMessage } = await import(
                    "@/lib/bot-messages"
                  );
                  const tenantId = await getTenantIdFromConfig(
                    clientConfig.tenant_slug ?? undefined,
                    clientConfig.tenant_api_key ?? undefined
                  );
                  if (tenantId) {
                    await storeBotMessage({
                      tenantId,
                      phoneNumberId: effectivePhoneId,
                      customerPhone: from,
                      direction: "out",
                      body: result.reply,
                    });
                  }
                } catch (_) {}
              }
            } catch (err) {
              console.error("[Webhook] Erro handlers-restaurante:", err);
              await sendTextMessage(
                from,
                "❌ Ocorreu um erro. Tente novamente em instantes.",
                effectivePhoneId,
                clientConfig.token_api_meta
              );
            }
            continue;
          }

          // Fluxo simples (fallback)
          if (isInteractive && interactiveId) {
            const reply = resolveInteractiveReply(
              interactiveId,
              interactiveTitle,
              clientConfig
            );
            await sendTextMessage(
              from,
              reply,
              effectivePhoneId,
              clientConfig.token_api_meta
            );
            try {
              const { getTenantIdFromConfig, storeBotMessage } = await import(
                "@/lib/bot-messages"
              );
              const tid = await getTenantIdFromConfig(
                clientConfig.tenant_slug ?? undefined,
                clientConfig.tenant_api_key ?? undefined
              );
              if (tid) {
                await storeBotMessage({
                  tenantId: tid,
                  phoneNumberId: effectivePhoneId,
                  customerPhone: from,
                  direction: "out",
                  body: reply,
                });
              }
            } catch (_) {}
            continue;
          }

          const { text, sendList } = resolveTextReply(
            messageText,
            clientConfig
          );
          await sendTextMessage(
            from,
            text,
            effectivePhoneId,
            clientConfig.token_api_meta
          );
          try {
            const { getTenantIdFromConfig, storeBotMessage } = await import(
              "@/lib/bot-messages"
            );
            const tid = await getTenantIdFromConfig(
              clientConfig.tenant_slug ?? undefined,
              clientConfig.tenant_api_key ?? undefined
            );
            if (tid) {
              await storeBotMessage({
                tenantId: tid,
                phoneNumberId: effectivePhoneId,
                customerPhone: from,
                direction: "out",
                body: text,
              });
            }
          } catch (_) {}
          if (sendList && (clientConfig.options || []).length > 0) {
            const listBody =
              "Como posso ajudar? Toque no botão abaixo para escolher:";
            await sendListMessage(
              from,
              listBody,
              "Opções",
              clientConfig.options || [],
              effectivePhoneId,
              clientConfig.token_api_meta
            );
            try {
              const { getTenantIdFromConfig, storeBotMessage } = await import(
                "@/lib/bot-messages"
              );
              const tid = await getTenantIdFromConfig(
                clientConfig.tenant_slug ?? undefined,
                clientConfig.tenant_api_key ?? undefined
              );
              if (tid) {
                await storeBotMessage({
                  tenantId: tid,
                  phoneNumberId: effectivePhoneId,
                  customerPhone: from,
                  direction: "out",
                  body: listBody,
                });
              }
            } catch (_) {}
          }
        }
      }
    }
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err));
    console.error("[Webhook] processWebhookPayload ERRO:", error.message);
    console.error("[Webhook] Stack:", error.stack);
    throw err;
  }
}
