/**
 * Estado de conversa persistido no DynamoDB (mesma tabela do config WhatsApp)
 * Usa o atributo conversation_states no item de config (phone_number_id)
 *
 * Credenciais: AWS_* ou DYNAMODB_* (prioridade para DYNAMODB_*)
 * Tabela: DYNAMODB_TABLE_NAME || "whatsapp-bot-configs" (igual whatsapp-dynamodb)
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

function getUserKey(from) {
  return "u_" + String(from).replace(/\D/g, "");
}

const ESTADO_INICIO = {
  estado: "inicio",
  pedido: {
    nome: "",
    telefone: "",
    itens: [],
    metodoPagamento: "",
    tipoPedido: "restaurante",
    endereco: "",
    total: 0,
  },
};

async function loadConversa(phoneNumberId, from) {
  try {
    const result = await docClient.send(
      new GetCommand({
        TableName: TABLE_NAME,
        Key: { phone_number_id: String(phoneNumberId) },
      })
    );
    const states = result.Item?.conversation_states || {};
    const key = getUserKey(from);
    const data = states[key];
    if (data && data.estado) {
      try {
        const pedido = data.pedido || ESTADO_INICIO.pedido;
        const restored = {
          estado: data.estado,
          pedido: Array.isArray(pedido) ? ESTADO_INICIO.pedido : pedido,
          manual_mode: !!data.manual_mode,
        };
        if (data.pedido?.tipoSelecionado) {
          restored.pedido.tipoSelecionado = String(data.pedido.tipoSelecionado);
        }
        return restored;
      } catch (convErr) {
        console.error(
          "[ConversationState] Erro ao converter objeto DynamoDB:",
          convErr?.message
        );
        return { ...ESTADO_INICIO, pedido: { ...ESTADO_INICIO.pedido } };
      }
    }
  } catch (e) {
    console.error("[ConversationState] Erro ao carregar:", e?.message);
  }
  return { ...ESTADO_INICIO, pedido: { ...ESTADO_INICIO.pedido } };
}

function sanitizePedido(pedido) {
  if (!pedido) return ESTADO_INICIO.pedido;
  const itens = Array.isArray(pedido.itens)
    ? pedido.itens.map((i) => ({
        id: String(i.id ?? ""),
        name: String(i.name ?? ""),
        quantity: Number(i.quantity) || 1,
        price: Number(i.price) || 0,
      }))
    : [];
  const result = {
    nome: String(pedido.nome ?? ""),
    telefone: String(pedido.telefone ?? ""),
    itens,
    metodoPagamento: String(pedido.metodoPagamento ?? ""),
    tipoPedido: String(pedido.tipoPedido ?? "restaurante"),
    endereco: String(pedido.endereco ?? ""),
    total: Number(pedido.total) || 0,
  };
  if (pedido.tipoSelecionado != null && String(pedido.tipoSelecionado).trim()) {
    result.tipoSelecionado = String(pedido.tipoSelecionado);
  }
  return result;
}

async function saveConversa(phoneNumberId, from, conversa) {
  try {
    const key = getUserKey(from);
    const state = {
      estado: String(conversa.estado ?? "inicio"),
      pedido: sanitizePedido(conversa.pedido),
      manual_mode: !!conversa.manual_mode,
    };

    // Ler item atual, mesclar e gravar (evita "Two document paths overlap")
    const getResult = await docClient.send(
      new GetCommand({
        TableName: TABLE_NAME,
        Key: { phone_number_id: String(phoneNumberId) },
      })
    );
    const existing = getResult.Item?.conversation_states || {};
    const merged = { ...existing, [key]: state };

    await docClient.send(
      new UpdateCommand({
        TableName: TABLE_NAME,
        Key: { phone_number_id: String(phoneNumberId) },
        UpdateExpression: "SET #cs = :merged",
        ExpressionAttributeNames: { "#cs": "conversation_states" },
        ExpressionAttributeValues: { ":merged": merged },
      })
    );
  } catch (e) {
    console.error("[ConversationState] Erro ao salvar:", e.message);
  }
}

module.exports = {
  loadConversa,
  saveConversa,
  ESTADO_INICIO,
};
