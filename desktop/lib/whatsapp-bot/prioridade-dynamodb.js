/**
 * Persistência de conversas prioritárias no DynamoDB (tabela bot-delivery)
 * Atributo: priority_conversations = { "remetente": { remetente, timestamp, ultimaMensagem, phoneNumberId } }
 */

const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const {
  DynamoDBDocumentClient,
  GetCommand,
  UpdateCommand,
} = require("@aws-sdk/lib-dynamodb");

const region =
  process.env.DYNAMODB_AWS_REGION || process.env.AWS_REGION || "us-east-1";
const accessKey =
  process.env.DYNAMODB_AWS_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID;
const secretKey =
  process.env.DYNAMODB_AWS_SECRET_ACCESS_KEY ||
  process.env.AWS_SECRET_ACCESS_KEY;

const client = new DynamoDBClient({
  region,
  credentials:
    accessKey && secretKey
      ? { accessKeyId: accessKey, secretAccessKey: secretKey }
      : undefined,
});

const docClient = DynamoDBDocumentClient.from(client);
const TABLE_NAME = process.env.DYNAMODB_TABLE_NAME || "bot-delivery";

function getRemetenteKey(remetente) {
  return "u_" + String(remetente).replace(/\D/g, "");
}

async function savePriorityConversation(phoneNumberId, remetente, entry) {
  try {
    if (!phoneNumberId) return;
    const key = getRemetenteKey(remetente);
    const state = {
      remetente: String(remetente),
      phoneNumberId: String(phoneNumberId),
      timestamp: Number(entry.timestamp || Date.now()),
      ultimaMensagem: Number(
        entry.ultimaMensagem || entry.timestamp || Date.now()
      ),
    };

    const getResult = await docClient.send(
      new GetCommand({
        TableName: TABLE_NAME,
        Key: { phone_number_id: String(phoneNumberId) },
      })
    );
    const existing = getResult.Item?.priority_conversations || {};
    const merged = { ...existing, [key]: state };

    await docClient.send(
      new UpdateCommand({
        TableName: TABLE_NAME,
        Key: { phone_number_id: String(phoneNumberId) },
        UpdateExpression: "SET #pc = :merged",
        ExpressionAttributeNames: { "#pc": "priority_conversations" },
        ExpressionAttributeValues: { ":merged": merged },
      })
    );
  } catch (e) {
    console.error("[PrioridadeDynamoDB] Erro ao salvar:", e.message);
    throw e;
  }
}

async function listPriorityConversations(phoneNumberId) {
  try {
    const effectiveId = phoneNumberId || process.env.PHONE_NUMBER_ID;
    if (!effectiveId) return [];

    const result = await docClient.send(
      new GetCommand({
        TableName: TABLE_NAME,
        Key: { phone_number_id: String(effectiveId) },
      })
    );
    const map = result.Item?.priority_conversations || {};
    const now = Date.now();
    const EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 horas

    return Object.entries(map)
      .filter(([, info]) => {
        const ts = info.timestamp || 0;
        return now - ts < EXPIRY_MS;
      })
      .map(([, info]) => ({
        remetente: info.remetente,
        tempoEsperaMin: Math.floor((now - (info.timestamp || 0)) / 1000 / 60),
        timestamp: info.timestamp,
        ultimaMensagem: info.ultimaMensagem,
        phoneNumberId: info.phoneNumberId,
      }))
      .sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
  } catch (e) {
    console.error("[PrioridadeDynamoDB] Erro ao listar:", e.message);
    return [];
  }
}

module.exports = {
  savePriorityConversation,
  listPriorityConversations,
};
