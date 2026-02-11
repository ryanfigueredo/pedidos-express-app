/**
 * Sistema de prioridade de conversas (Bot de Atendimento)
 * Persiste no DynamoDB para aparecer no atendimento (desktop e app)
 */

const conversasPrioridade = new Map(); // cache em memória (fallback)

let dynamoModule = null;
function getDynamo() {
  if (!dynamoModule) {
    try {
      dynamoModule = require("./conversation-state");
    } catch (_) {}
  }
  return dynamoModule;
}

async function marcarComoPrioridade(remetente, phoneNumberId) {
  const key = phoneNumberId ? `${phoneNumberId}:${remetente}` : remetente;
  const entry = {
    remetente,
    phoneNumberId: phoneNumberId || null,
    timestamp: Date.now(),
    ultimaMensagem: Date.now(),
  };
  conversasPrioridade.set(key, entry);
  console.log(`[PRIORIDADE] ${remetente} pediu atendimento`);

  // Persistir no DynamoDB
  try {
    const { savePriorityConversation } = require("./prioridade-dynamodb");
    await savePriorityConversation(phoneNumberId, remetente, entry);
  } catch (e) {
    console.warn("[PRIORIDADE] DynamoDB save ignorado:", e?.message);
  }
}

function ehPrioridade(remetente, phoneNumberId) {
  if (phoneNumberId) {
    return conversasPrioridade.has(`${phoneNumberId}:${remetente}`);
  }
  return (
    conversasPrioridade.has(remetente) ||
    Array.from(conversasPrioridade.values()).some(
      (v) => v.remetente === remetente
    )
  );
}

async function listarConversasPrioritarias(phoneNumberId) {
  try {
    const { listPriorityConversations } = require("./prioridade-dynamodb");
    const fromDb = await listPriorityConversations(phoneNumberId);
    if (fromDb && fromDb.length > 0) return fromDb;
  } catch (e) {
    console.warn("[PRIORIDADE] DynamoDB list ignorado:", e?.message);
  }
  return Array.from(conversasPrioridade.entries())
    .filter(([key, info]) => {
      if (!phoneNumberId) return true;
      if (key.startsWith && key.startsWith(`${phoneNumberId}:`)) return true;
      if (info.phoneNumberId === phoneNumberId) return true;
      return false;
    })
    .map(([, info]) => ({
      remetente: info.remetente || info,
      tempoEsperaMin: Math.floor(
        (Date.now() - (info.timestamp || 0)) / 1000 / 60
      ),
      timestamp: info.timestamp,
      ultimaMensagem: info.ultimaMensagem,
    }));
}

module.exports = {
  marcarComoPrioridade,
  ehPrioridade,
  listarConversasPrioritarias,
  _map: conversasPrioridade,
};
