/**
 * Cópia do SaaS-RFID - Busca config WhatsApp no DynamoDB (tabela bot-delivery)
 */

import {
  DynamoDBClient,
  type DynamoDBClientConfig,
} from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";

const TABLE_NAME = process.env.DYNAMODB_TABLE_NAME || "bot-delivery";
const REGION =
  process.env.DYNAMODB_AWS_REGION || process.env.AWS_REGION || "us-east-1";

const clientConfig: DynamoDBClientConfig = {
  region: REGION,
  credentials:
    process.env.DYNAMODB_AWS_ACCESS_KEY_ID &&
    process.env.DYNAMODB_AWS_SECRET_ACCESS_KEY
      ? {
          accessKeyId: process.env.DYNAMODB_AWS_ACCESS_KEY_ID,
          secretAccessKey: process.env.DYNAMODB_AWS_SECRET_ACCESS_KEY,
        }
      : process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY
      ? {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        }
      : undefined,
};

const client = new DynamoDBClient(clientConfig);
const docClient = DynamoDBDocumentClient.from(client);

export interface BotOption {
  label: string;
  type: string;
  keywords?: string[];
  response?: string;
}

export interface WhatsAppClientConfig {
  nome_do_cliente: string;
  token_api_meta: string;
  phone_number_id?: string;
  tenant_id?: string | null;
  tenant_slug?: string | null;
  tenant_api_key?: string | null;
  desktop_api_url?: string | null;
  welcome_message?: string | null;
  greeting_with_name?: string | null;
  options?: BotOption[];
  order_message?: string | null;
  support_message?: string | null;
  fallback_message?: string | null;
  enabled?: boolean | null;
}

// Opções padrão Tamboril (igual RFID mas com Cardápio/Resumo/Atendente)
const TAMBORIL_OPTIONS: BotOption[] = [
  {
    label: "📋 Cardápio",
    type: "order",
    keywords: ["cardapio", "cardápio", "1"],
  },
  { label: "🛒 Resumo", type: "order", keywords: ["resumo", "2"] },
  { label: "👤 Atendente", type: "support", keywords: ["atendente", "3"] },
];

export async function getWhatsAppClientConfig(
  phoneNumberId: string
): Promise<WhatsAppClientConfig | null> {
  try {
    if (!phoneNumberId) return null;

    const command = new GetCommand({
      TableName: TABLE_NAME,
      Key: { phone_number_id: phoneNumberId },
    });

    const response = await docClient.send(command);
    const item = response.Item as Record<string, unknown> | undefined;

    if (!item?.nome_do_cliente || !item?.token_api_meta) return null;

    let options = Array.isArray(item.options)
      ? (item.options as BotOption[])
      : [];
    if (options.length === 0) {
      options = TAMBORIL_OPTIONS;
    }

    return {
      nome_do_cliente: String(item.nome_do_cliente),
      token_api_meta: String(item.token_api_meta),
      phone_number_id: String(phoneNumberId),
      tenant_id: item.tenant_slug ? String(item.tenant_slug) : null,
      tenant_slug: item.tenant_slug ? String(item.tenant_slug) : null,
      tenant_api_key: item.tenant_api_key ? String(item.tenant_api_key) : null,
      desktop_api_url: item.desktop_api_url
        ? String(item.desktop_api_url)
        : "https://pedidos.dmtn.com.br",
      welcome_message: item.welcome_message
        ? String(item.welcome_message)
        : null,
      greeting_with_name: item.greeting_with_name
        ? String(item.greeting_with_name)
        : null,
      options,
      order_message: item.order_message ? String(item.order_message) : null,
      support_message: item.support_message
        ? String(item.support_message)
        : null,
      fallback_message: item.fallback_message
        ? String(item.fallback_message)
        : null,
      enabled: item.enabled === false ? false : true,
    };
  } catch (error) {
    console.error("[WhatsApp DynamoDB] Erro:", error);
    return null;
  }
}

export function isWhatsAppDynamoEnabled(): boolean {
  return !!TABLE_NAME;
}

/** Atualiza nome_do_cliente no DynamoDB (para bot usar nome atualizado da loja) */
export async function updateWhatsAppClientNome(
  phoneNumberId: string,
  nomeDoCliente: string
): Promise<boolean> {
  try {
    if (!phoneNumberId || !nomeDoCliente?.trim()) return false;
    await docClient.send(
      new UpdateCommand({
        TableName: TABLE_NAME,
        Key: { phone_number_id: phoneNumberId },
        UpdateExpression: "SET nome_do_cliente = :nome",
        ExpressionAttributeValues: { ":nome": nomeDoCliente.trim() },
      })
    );
    return true;
  } catch (error) {
    console.error("[WhatsApp DynamoDB] Erro ao atualizar nome:", error);
    return false;
  }
}
