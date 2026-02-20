/**
 * Módulo de conexão com Amazon DynamoDB
 */

const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const {
  DynamoDBDocumentClient,
  GetCommand,
  ScanCommand,
} = require("@aws-sdk/lib-dynamodb");

const client = new DynamoDBClient({
  region: process.env.AWS_REGION || "us-east-1",
  credentials:
    process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY
      ? {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        }
      : undefined,
});

const docClient = DynamoDBDocumentClient.from(client);
const TABLE_NAME = process.env.DYNAMODB_TABLE_NAME || "whatsapp-bot-configs";

async function getClientConfig(phoneNumberId) {
  try {
    if (!phoneNumberId) {
      console.log("[DynamoDB] phone_number_id não fornecido");
      return null;
    }

    // Garante string para chave do DynamoDB (tabela usa phone_number_id como String)
    const key = String(phoneNumberId);
    console.log(
      "[DynamoDB] Buscando config com phone_number_id (chave):",
      key,
      "| tabela:",
      TABLE_NAME
    );

    const command = new GetCommand({
      TableName: TABLE_NAME,
      Key: { phone_number_id: key },
    });

    const response = await docClient.send(command);

    if (!response.Item) {
      console.log(
        "[DynamoDB] Nenhum registro encontrado para phone_number_id:",
        key
      );
      return null;
    }

    const item = response.Item;
    const isRestaurante = !!(item.tenant_slug && item.tenant_api_key);

    if (!item.token_api_meta) {
      console.warn("[DynamoDB] token_api_meta obrigatório:", key);
      return null;
    }
    if (isRestaurante && !item.desktop_api_url) {
      console.warn(
        "[DynamoDB] desktop_api_url obrigatório para restaurantes:",
        key
      );
      return null;
    }
    if (!item.nome_do_cliente) {
      item.nome_do_cliente = item.tenant_slug || "Cliente";
    }

    return {
      nome_do_cliente: item.nome_do_cliente,
      prompt_sistema_ia: item.prompt_sistema_ia || null,
      token_api_meta: item.token_api_meta,
      id_assistente_openai: item.id_assistente_openai || null,
      phone_number_id: String(key),
      tenant_slug: item.tenant_slug || null,
      tenant_api_key: item.tenant_api_key || null,
      desktop_api_url:
        item.desktop_api_url ||
        process.env.DESKTOP_API_URL ||
        "https://pedidos-express-api.vercel.app",
      business_type: item.business_type || "RESTAURANTE",
    };
  } catch (error) {
    console.error("[DynamoDB] Erro ao buscar configuração:", error.message);
    return null;
  }
}

/**
 * Busca config pelo business_account_id (entry.id do webhook).
 * Fallback quando phone_number_id não encontra registro.
 * @param {string} businessAccountId - WABA ID (entry.id)
 * @param {string} phoneNumberIdFromMetadata - phone_number_id do metadata (para envio)
 */
async function getClientConfigByBusinessAccountId(
  businessAccountId,
  phoneNumberIdFromMetadata
) {
  if (!businessAccountId) return null;
  try {
    const { Items } = await docClient.send(
      new ScanCommand({
        TableName: TABLE_NAME,
        FilterExpression: "business_account_id = :bid",
        ExpressionAttributeValues: { ":bid": String(businessAccountId) },
      })
    );
    if (!Items?.length) {
      console.log(
        "[DynamoDB] Nenhum registro para business_account_id:",
        businessAccountId
      );
      return null;
    }
    const item = Items[0];
    const isRestaurante = !!(item.tenant_slug && item.tenant_api_key);
    if (!item.token_api_meta) return null;
    if (isRestaurante && !item.desktop_api_url) return null;
    const phoneId = phoneNumberIdFromMetadata || item.phone_number_id;
    return {
      nome_do_cliente: item.nome_do_cliente || item.tenant_slug || "Cliente",
      prompt_sistema_ia: item.prompt_sistema_ia || null,
      token_api_meta: item.token_api_meta,
      id_assistente_openai: item.id_assistente_openai || null,
      phone_number_id: String(phoneId),
      tenant_slug: item.tenant_slug || null,
      tenant_api_key: item.tenant_api_key || null,
      desktop_api_url:
        item.desktop_api_url ||
        process.env.DESKTOP_API_URL ||
        "https://pedidos-express-api.vercel.app",
      business_type: item.business_type || "RESTAURANTE",
    };
  } catch (error) {
    console.error(
      "[DynamoDB] Erro ao buscar por business_account_id:",
      error.message
    );
    return null;
  }
}

function isDynamoDBEnabled() {
  return !!TABLE_NAME;
}

module.exports = {
  getClientConfig,
  getClientConfigByBusinessAccountId,
  isDynamoDBEnabled,
  TABLE_NAME,
};
