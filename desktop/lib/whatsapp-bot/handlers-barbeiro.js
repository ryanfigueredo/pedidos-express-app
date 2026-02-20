/**
 * Handler de Barbeiro - Agendamento via WhatsApp
 * Só exibe horários LIVRES (já marcados não aparecem para o cliente).
 */

const conversationState = require("./conversation-state");

const fetch = globalThis.fetch;

const ESTADO = {
  INICIO: "inicio",
  PERGUNTAR_NOME: "perguntar_nome",
  ESCOLHER_SERVICO: "escolher_servico",
  ESCOLHER_DATA: "escolher_data",
  AGUARDAR_DATA: "aguardar_data",
  ESCOLHER_HORARIO: "escolher_horario",
  CONFIRMAR: "confirmar",
};

const SERVICOS = [
  { id: "cabelo", name: "Cabelo", price: 30 },
  { id: "barba", name: "Barba", price: 20 },
  { id: "combo", name: "Combo Cabelo+Barba", price: 45 },
];

function ensureHttpsUrl(url) {
  const s = (url || "").trim();
  if (!s) return "https://pedidos-express-api.vercel.app";
  if (s.startsWith("http://") || s.startsWith("https://")) return s;
  return `https://${s}`;
}

async function loadConversa(phoneNumberId, from) {
  try {
    const c = await conversationState.loadConversa(phoneNumberId, from);
    if (c && c.estado) return c;
  } catch (e) {
    console.warn("[Barbeiro] loadConversa:", e?.message);
  }
  return {
    estado: ESTADO.INICIO,
    pedido: {
      nome: "",
      telefone: "",
      servico_nome: "",
      servico_preco: 0,
      data_agendamento: "",
      slot_id: "",
      slot_hora: "",
      itens: [],
      total: 0,
    },
  };
}

async function saveConversa(phoneNumberId, from, conversa) {
  try {
    await conversationState.saveConversa(phoneNumberId, from, conversa);
  } catch (e) {
    console.warn("[Barbeiro] saveConversa:", e?.message);
  }
}

async function clearConversa(phoneNumberId, from, conversa) {
  conversa.estado = ESTADO.INICIO;
  conversa.pedido = {
    nome: "",
    telefone: "",
    servico_nome: "",
    servico_preco: 0,
    data_agendamento: "",
    slot_id: "",
    slot_hora: "",
    itens: [],
    total: 0,
  };
  await saveConversa(phoneNumberId, from, conversa);
}

/** GET slots disponíveis - só retorna horários LIVRES (não marcados) */
async function fetchSlotsDisponiveis(config, dateStr) {
  const base = ensureHttpsUrl(config.desktop_api_url).replace(/\/$/, "");
  const url = `${base}/api/bot/slots/available?date=${dateStr}`;
  try {
    const res = await fetch(url, {
      headers: { "X-API-Key": config.tenant_api_key || "" },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data?.slots) ? data.slots : [];
  } catch (e) {
    console.error("[Barbeiro] Erro ao buscar slots:", e?.message);
    return [];
  }
}

/** POST criar agendamento (marca o slot como ocupado no backend) */
async function criarAgendamento(config, payload) {
  const base = ensureHttpsUrl(config.desktop_api_url).replace(/\/$/, "");
  const url = `${base}/api/orders`;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": config.tenant_api_key || "",
        "X-Tenant-Id": config.tenant_slug || "",
      },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok && data.success) return { success: true, order: data.order };
    return { success: false, error: data.error || "Erro ao confirmar agendamento." };
  } catch (e) {
    console.error("[Barbeiro] Erro ao criar agendamento:", e?.message);
    return { success: false, error: e?.message || "Erro de conexão." };
  }
}

function parseDataHojeAmanha(text, escolha) {
  const hoje = new Date();
  const amanha = new Date(hoje);
  amanha.setDate(amanha.getDate() + 1);
  if (escolha === "1" || (text && text.trim() === "1")) {
    return { date: hoje, str: hoje.toISOString().slice(0, 10) };
  }
  if (escolha === "2" || (text && text.trim() === "2")) {
    return { date: amanha, str: amanha.toISOString().slice(0, 10) };
  }
  return null;
}

function parseDataDDMM(text) {
  const t = (text || "").trim().replace(/\D/g, "");
  if (t.length >= 4) {
    const dd = parseInt(t.slice(0, 2), 10);
    const mm = parseInt(t.slice(2, 4), 10) - 1;
    if (dd >= 1 && dd <= 31 && mm >= 0 && mm <= 11) {
      const year = new Date().getFullYear();
      const d = new Date(year, mm, dd);
      if (d.getDate() === dd && d.getMonth() === mm) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (d >= today) {
          return { date: d, str: d.toISOString().slice(0, 10) };
        }
      }
    }
  }
  return null;
}

function formatarDataBr(str) {
  if (!str || str.length < 10) return str;
  const [y, m, d] = str.slice(0, 10).split("-");
  return `${d}/${m}/${y}`;
}

/**
 * Handler principal do fluxo barbeiro.
 * Horários já marcados NÃO são exibidos - o cliente só vê e escolhe horários livres.
 */
async function handleMessageBarbeiro(from, messageText, config) {
  const text = (messageText || "").trim();
  const conversa = await loadConversa(config.phone_number_id, from);
  conversa.pedido = conversa.pedido || {};
  conversa.pedido.telefone = String(from).replace(/\D/g, "");
  if (conversa.pedido.telefone.length === 11 && !conversa.pedido.telefone.startsWith("55")) {
    conversa.pedido.telefone = "55" + conversa.pedido.telefone;
  }

  const nomeBarbearia = config.nome_do_cliente || "Barbearia";

  // Sair / cancelar
  const txtLower = text.toLowerCase();
  if (txtLower === "sair" || txtLower === "cancelar" || txtLower === "encerrar") {
    await clearConversa(config.phone_number_id, from, conversa);
    return { reply: "👋 Até logo! Qualquer coisa é só chamar." };
  }

  try {
    switch (conversa.estado) {
      case ESTADO.INICIO: {
        if (text === "1" || txtLower === "agendar" || txtLower === "agendar horário") {
          conversa.estado = ESTADO.PERGUNTAR_NOME;
          await saveConversa(config.phone_number_id, from, conversa);
          return { reply: "✂️ Ótimo! Qual seu *nome*?" };
        }
        if (text === "2" || txtLower.includes("atendente") || txtLower.includes("falar")) {
          return { reply: "📩 Em breve um atendente te atende. Obrigado!" };
        }
        return {
          reply:
            `✂️ Olá! Sou o assistente da *${nomeBarbearia}*.\n\n` +
            `*Agendamento só pelo WhatsApp* – horários já marcados *não aparecem* aqui, só os livres.\n\n` +
            `Digite:\n1 - Agendar horário\n2 - Falar com atendente`,
        };
      }

      case ESTADO.PERGUNTAR_NOME: {
        const nome = text.replace(/\d/g, "").trim() || text.trim();
        if (nome.length < 2) {
          return { reply: "Por favor, digite seu nome (pelo menos 2 letras)." };
        }
        conversa.pedido.nome = nome.substring(0, 100);
        conversa.estado = ESTADO.ESCOLHER_SERVICO;
        await saveConversa(config.phone_number_id, from, conversa);
        const servicosMsg = SERVICOS.map((s, i) => `${i + 1} - ${s.name} (R$ ${s.price})`).join("\n");
        return {
          reply: `Qual *serviço* deseja?\n\n${servicosMsg}\n\nResponda com o número (1, 2 ou 3).`,
        };
      }

      case ESTADO.ESCOLHER_SERVICO: {
        const num = parseInt(text, 10);
        if (num >= 1 && num <= SERVICOS.length) {
          const s = SERVICOS[num - 1];
          conversa.pedido.servico_nome = s.name;
          conversa.pedido.servico_preco = s.price;
          conversa.pedido.total = s.price;
          conversa.estado = ESTADO.ESCOLHER_DATA;
          await saveConversa(config.phone_number_id, from, conversa);
          return {
            reply:
              "Para *qual data* deseja agendar?\n\n1 - Hoje\n2 - Amanhã\n3 - Outra data (digite no formato *DD/MM*)",
          };
        }
        return { reply: "Escolha 1, 2 ou 3 para o serviço." };
      }

      case ESTADO.ESCOLHER_DATA: {
        const hojeAmanha = parseDataHojeAmanha(text, text.trim());
        if (hojeAmanha) {
          conversa.pedido.data_agendamento = hojeAmanha.str;
          conversa.estado = ESTADO.ESCOLHER_HORARIO;
          await saveConversa(config.phone_number_id, from, conversa);
          const slots = await fetchSlotsDisponiveis(config, hojeAmanha.str);
          if (slots.length === 0) {
            conversa.estado = ESTADO.ESCOLHER_DATA;
            await saveConversa(config.phone_number_id, from, conversa);
            return {
              reply:
                "😕 Não há *horários livres* nesta data. Escolha outra:\n\n1 - Hoje\n2 - Amanhã\n3 - Outra data (DD/MM)",
            };
          }
          // Guardar lista de slots para mapear resposta do usuário (índice 1-based)
          conversa.pedido._slots_list = slots;
          await saveConversa(config.phone_number_id, from, conversa);
          const linhas = slots.slice(0, 20).map((slot, i) => {
            const h = slot.start_time ? slot.start_time.slice(11, 16) : "?";
            return `${i + 1} - ${h}`;
          });
          const msg =
            "⏰ *Horários disponíveis* (só aparecem os livres; já marcados não estão na lista):\n\n" +
            linhas.join("\n") +
            "\n\nResponda com o *número* do horário desejado.";
          return { reply: msg };
        }
        if (text === "3" || text.length <= 3) {
          conversa.estado = ESTADO.AGUARDAR_DATA;
          await saveConversa(config.phone_number_id, from, conversa);
          return { reply: "Digite a data no formato *DD/MM* (ex: 25/12):" };
        }
        const outraData = parseDataDDMM(text);
        if (outraData) {
          conversa.pedido.data_agendamento = outraData.str;
          conversa.estado = ESTADO.ESCOLHER_HORARIO;
          await saveConversa(config.phone_number_id, from, conversa);
          const slots = await fetchSlotsDisponiveis(config, outraData.str);
          if (slots.length === 0) {
            conversa.estado = ESTADO.ESCOLHER_DATA;
            await saveConversa(config.phone_number_id, from, conversa);
            return {
              reply: "😕 Nenhum horário livre nesta data. Escolha outra data (1 - Hoje, 2 - Amanhã, 3 - DD/MM):",
            };
          }
          conversa.pedido._slots_list = slots;
          await saveConversa(config.phone_number_id, from, conversa);
          const linhas = slots.slice(0, 20).map((slot, i) => {
            const h = slot.start_time ? slot.start_time.slice(11, 16) : "?";
            return `${i + 1} - ${h}`;
          });
          return {
            reply:
              "⏰ *Horários disponíveis*:\n\n" +
              linhas.join("\n") +
              "\n\nResponda com o número do horário.",
          };
        }
        return { reply: "Opção inválida. Digite 1 (Hoje), 2 (Amanhã) ou 3 (e depois DD/MM)." };
      }

      case ESTADO.AGUARDAR_DATA: {
        const outraData = parseDataDDMM(text);
        if (!outraData) {
          return { reply: "Data inválida ou passada. Digite no formato *DD/MM* (ex: 20/02):" };
        }
        conversa.pedido.data_agendamento = outraData.str;
        conversa.estado = ESTADO.ESCOLHER_HORARIO;
        await saveConversa(config.phone_number_id, from, conversa);
        const slots = await fetchSlotsDisponiveis(config, outraData.str);
        if (slots.length === 0) {
          conversa.estado = ESTADO.ESCOLHER_DATA;
          await saveConversa(config.phone_number_id, from, conversa);
          return { reply: "😕 Nenhum horário livre nesta data. Digite outra data (DD/MM):" };
        }
        conversa.pedido._slots_list = slots;
        await saveConversa(config.phone_number_id, from, conversa);
        const linhas = slots.slice(0, 20).map((slot, i) => {
          const h = slot.start_time ? slot.start_time.slice(11, 16) : "?";
          return `${i + 1} - ${h}`;
        });
        return {
          reply: "⏰ *Horários disponíveis*:\n\n" + linhas.join("\n") + "\n\nResponda com o número do horário.",
        };
      }

      case ESTADO.ESCOLHER_HORARIO: {
        const slots = conversa.pedido._slots_list || [];
        const num = parseInt(text, 10);
        if (num >= 1 && num <= slots.length) {
          const slot = slots[num - 1];
          conversa.pedido.slot_id = slot.id;
          conversa.pedido.slot_hora = slot.start_time ? slot.start_time.slice(11, 16) : "?";
          delete conversa.pedido._slots_list;
          conversa.estado = ESTADO.CONFIRMAR;
          await saveConversa(config.phone_number_id, from, conversa);
          const dataBr = formatarDataBr(conversa.pedido.data_agendamento);
          return {
            reply:
              `✅ *Confirme seu agendamento:*\n\n` +
              `Nome: *${conversa.pedido.nome}*\n` +
              `Serviço: *${conversa.pedido.servico_nome}* - R$ ${conversa.pedido.servico_preco}\n` +
              `Data: *${dataBr}*\n` +
              `Horário: *${conversa.pedido.slot_hora}*\n\n` +
              `1 - Sim, confirmar\n2 - Não, cancelar`,
          };
        }
        return { reply: `Escolha um número entre 1 e ${slots.length} (horários disponíveis acima).` };
      }

      case ESTADO.CONFIRMAR: {
        if (text === "1" || txtLower === "sim" || txtLower === "confirmar") {
          const p = conversa.pedido;
          const payload = {
            order_type: "appointment",
            slot_id: p.slot_id,
            customer_name: p.nome,
            customer_phone: p.telefone,
            items: [{ id: "servico", name: p.servico_nome, quantity: 1, price: p.servico_preco }],
            total_price: p.servico_preco,
          };
          const result = await criarAgendamento(config, payload);
          await clearConversa(config.phone_number_id, from, conversa);
          if (result.success) {
            const dataBr = formatarDataBr(p.data_agendamento);
            return {
              reply:
                `✅ *Agendamento confirmado!*\n\n` +
                `Até *${dataBr}* às *${p.slot_hora}*.\n` +
                `Serviço: ${p.servico_nome} - R$ ${p.servico_preco}\n\n` +
                `Qualquer alteração, fale com a gente. 👋`,
            };
          }
          return {
            reply: `❌ ${result.error || "Não foi possível confirmar. Tente outro horário ou fale com a barbearia."}`,
          };
        }
        if (text === "2" || txtLower === "não" || txtLower === "cancelar") {
          await clearConversa(config.phone_number_id, from, conversa);
          return { reply: "Agendamento cancelado. Quando quiser, digite *1* para agendar de novo. 👋" };
        }
        return { reply: "Digite 1 para confirmar ou 2 para cancelar." };
      }

      default: {
        conversa.estado = ESTADO.INICIO;
        await saveConversa(config.phone_number_id, from, conversa);
        return {
          reply: `✂️ Olá! Sou o assistente da *${nomeBarbearia}*.\n\n1 - Agendar horário\n2 - Falar com atendente`,
        };
      }
    }
  } catch (err) {
    console.error("[Barbeiro] Erro:", err?.message);
    await clearConversa(config.phone_number_id, from, conversa);
    return { reply: "Ocorreu um erro. Por favor, tente novamente ou fale com a barbearia." };
  }
}

function isBarbeiroConfig(config) {
  return !!(config && config.business_type === "BARBEIRO" && config.tenant_api_key && config.desktop_api_url);
}

module.exports = {
  handleMessageBarbeiro,
  isBarbeiroConfig,
};
