/**
 * Webhook WhatsApp Cloud API — Oficial da Meta
 * Suporta múltiplos clientes via DynamoDB
 */

const { handleMessageDynamic } = require("./handlers-dynamic");
const {
  handleMessageRestaurante,
  isRestauranteConfig,
} = require("./handlers-restaurante");
const {
  getClientConfig,
  getClientConfigByBusinessAccountId,
  isDynamoDBEnabled,
} = require("./dynamodb");

const fetch = globalThis.fetch;

const VERIFY_TOKEN =
  process.env.WHATSAPP_VERIFY_TOKEN || process.env.WEBHOOK_VERIFY_TOKEN || "";
const GRAPH_VERSION = process.env.WHATSAPP_GRAPH_VERSION || "v21.0";

function getQuery(event) {
  const q = { ...(event.queryStringParameters || {}) };
  const raw = event.rawQueryString || "";
  if (raw && typeof raw === "string") {
    for (const part of raw.split("&")) {
      const [k, v] = part
        .split("=")
        .map((s) => (s ? decodeURIComponent(s) : ""));
      if (k) q[k] = v;
    }
  }
  return q;
}

function parseBody(event) {
  const raw = event.body;
  if (!raw) return {};
  if (typeof raw === "string") {
    try {
      return JSON.parse(raw);
    } catch (_) {
      return {};
    }
  }
  return raw;
}

async function sendWhatsApp(to, text, phoneNumberId, accessToken) {
  if (!accessToken || !phoneNumberId) {
    console.error("[Cloud API] Token ou Phone Number ID ausente");
    return false;
  }

  const phone = String(to).replace(/\D/g, "");
  if (!phone) {
    console.error("[Cloud API] Número de telefone inválido:", to);
    return false;
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
          type: "text",
          text: { body: text },
        }),
      }
    );

    if (!res.ok) {
      const err = await res.text();
      console.error(
        "[Cloud API] Erro ao enviar mensagem:",
        res.status,
        err,
        "| to:",
        phone
      );
      return false;
    }

    console.log("[Cloud API] Mensagem enviada com sucesso para", phone);
    return true;
  } catch (e) {
    console.error("[Cloud API] Erro ao enviar mensagem:", e.message);
    return false;
  }
}

/**
 * Envia mensagem interativa (botões ou lista) via WhatsApp Cloud API
 * @param {string} to - Número do destinatário
 * @param {object} payload - { type: "button"|"list", ... }
 * @param {string} phoneNumberId
 * @param {string} accessToken
 */
async function sendWhatsAppInteractive(
  to,
  payload,
  phoneNumberId,
  accessToken
) {
  if (!accessToken || !phoneNumberId) {
    console.error("[Cloud API] Token ou Phone Number ID ausente");
    return false;
  }

  const phone = String(to).replace(/\D/g, "");
  if (!phone) {
    console.error("[Cloud API] Número de telefone inválido:", to);
    return false;
  }

  try {
    const body = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: phone,
      type: "interactive",
      interactive: payload,
    };

    const res = await fetch(
      `https://graph.facebook.com/${GRAPH_VERSION}/${phoneNumberId}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      }
    );

    if (!res.ok) {
      const err = await res.text();
      console.error(
        "[Cloud API] Erro ao enviar interativo:",
        res.status,
        err,
        "| to:",
        phone,
        "| phone_number_id:",
        phoneNumberId
      );
      return false;
    }

    console.log("[Cloud API] Interativo enviado com sucesso para", phone);

    return true;
  } catch (e) {
    console.error(
      "[Cloud API] Erro ao enviar interativo:",
      e.message,
      "| phone_number_id:",
      phoneNumberId
    );
    return false;
  }
}

function verify(q) {
  const mode = q["hub.mode"];
  const token = q["hub.verify_token"];
  const challenge = q["hub.challenge"];

  if (mode === "subscribe" && token === VERIFY_TOKEN && challenge) {
    console.log("[Cloud API] Verificação do webhook: OK");
    return { ok: true, body: challenge };
  }

  console.log("[Cloud API] Verificação do webhook: FALHOU", {
    mode,
    tokenMatch: token === VERIFY_TOKEN,
  });
  return { ok: false };
}

async function processWebhook(body) {
  const entries = body?.entry || [];
  console.log("[Cloud API] processWebhook iniciado, entries:", entries.length);

  for (const entry of entries) {
    const changes = entry?.changes || [];
    for (const ch of changes) {
      const val = ch?.value || {};
      const messages = val?.messages || [];
      const metadata = val?.metadata || {};
      const phoneNumberId = metadata?.phone_number_id;
      const businessAccountId = entry?.id;

      console.log(
        "[Cloud API] DEBUG - Usando do JSON: phone_number_id:",
        phoneNumberId,
        "| WABA (entry.id):",
        businessAccountId
      );

      // Carga de teste da Meta (botão "Enviar carga de teste") usa valores fictícios
      if (
        phoneNumberId === "123456123" ||
        businessAccountId === "0" ||
        String(businessAccountId) === "0"
      ) {
        console.log(
          "[Cloud API] Carga de teste da Meta ignorada (phone_number_id: 123456123)"
        );
        continue;
      }

      if (!phoneNumberId) {
        console.error("[Cloud API] phone_number_id não encontrado no metadata");
        continue;
      }
      console.log(
        "[Cloud API] phone_number_id:",
        phoneNumberId,
        "messages:",
        messages.length
      );

      let clientConfig = null;

      if (isDynamoDBEnabled()) {
        clientConfig = await getClientConfig(phoneNumberId);
        if (!clientConfig && businessAccountId) {
          clientConfig = await getClientConfigByBusinessAccountId(
            businessAccountId,
            phoneNumberId
          );
          if (clientConfig) {
            console.log(
              "[Cloud API] Config encontrada por business_account_id:",
              businessAccountId
            );
          }
        }
        if (!clientConfig) {
          console.error(
            "[Cloud API] CONFIG NÃO ENCONTRADA no DynamoDB! phone_number_id:",
            phoneNumberId,
            "business_account_id:",
            businessAccountId,
            "- Rode: cd bot && node add-tamboril-client.js"
          );
          continue;
        }
        console.log("[Cloud API] Config OK, processando mensagem");
      } else {
        console.error(
          "[Cloud API] DynamoDB NÃO HABILITADO - configure AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY na Vercel"
        );
        continue;
      }

      const displayPhone = (metadata?.display_phone_number || "").replace(
        /\D/g,
        ""
      );
      const contactsWaId = val?.contacts?.[0]?.wa_id;

      for (const msg of messages) {
        let userNumber = msg?.from;
        const userNorm = String(userNumber || "").replace(/\D/g, "");
        // Fallback: se from = número do negócio (bug Meta), usar wa_id dos contacts
        if (userNorm === displayPhone && contactsWaId) {
          userNumber = contactsWaId;
        }
        const messageType = msg?.type;

        let messageText = msg?.text?.body || "";
        if (messageType === "interactive") {
          const interactive = msg?.interactive || {};
          if (interactive.type === "button_reply") {
            messageText =
              interactive.button_reply?.id ||
              interactive.button_reply?.title ||
              "";
          } else if (interactive.type === "list_reply") {
            messageText =
              interactive.list_reply?.id || interactive.list_reply?.title || "";
          }
        }

        if (!userNumber) continue;
        if (!messageText && messageType !== "interactive") continue;

        try {
          let result;
          if (isRestauranteConfig(clientConfig)) {
            result = await handleMessageRestaurante(
              userNumber,
              messageText,
              clientConfig
            );
          } else {
            result = await handleMessageDynamic(
              userNumber,
              messageText,
              null,
              clientConfig
            );
          }

          const reply = result?.reply;
          const interactivePayload = result?.interactive;

          if (interactivePayload) {
            console.log(
              "[Cloud API] Enviando resposta interativa para",
              userNumber
            );
            await sendWhatsAppInteractive(
              userNumber,
              interactivePayload,
              phoneNumberId,
              clientConfig.token_api_meta
            );
          } else if (reply) {
            console.log("[Cloud API] Enviando resposta texto");
            await sendWhatsApp(
              userNumber,
              reply,
              phoneNumberId,
              clientConfig.token_api_meta
            );
          }
        } catch (error) {
          console.error(
            "[Cloud API] Erro ao processar mensagem:",
            error.message
          );
        }
      }
    }
  }
}

async function handler(event, context) {
  const method = (
    event.requestContext?.http?.method ||
    event.httpMethod ||
    "GET"
  ).toUpperCase();
  const q = getQuery(event);

  if (method === "GET") {
    const v = verify(q);
    if (v.ok) {
      return {
        statusCode: 200,
        body: v.body,
        headers: { "Content-Type": "text/plain" },
      };
    }
    return {
      statusCode: 403,
      body: "Forbidden",
      headers: { "Content-Type": "text/plain" },
    };
  }

  if (method === "POST") {
    const body = parseBody(event);
    await processWebhook(body);
    return {
      statusCode: 200,
      body: "OK",
      headers: { "Content-Type": "text/plain" },
    };
  }

  return {
    statusCode: 405,
    body: "Method Not Allowed",
    headers: { "Content-Type": "text/plain" },
  };
}

module.exports = { handler };
