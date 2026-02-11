/**
 * Helper para gerenciar registros no DynamoDB via Admin
 */

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";

const TABLE_NAME = process.env.DYNAMODB_TABLE_NAME || "whatsapp-bot-configs";
const REGION = process.env.AWS_REGION || "us-east-1";

const client = new DynamoDBClient({
  region: REGION,
  credentials:
    process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY
      ? {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        }
      : undefined,
});

const docClient = DynamoDBDocumentClient.from(client);

export interface DynamoDBConfig {
  phone_number_id: string;
  business_account_id?: string;
  token_api_meta: string;
  meta_verify_token?: string;
  tenant_slug: string;
  tenant_api_key: string;
  desktop_api_url: string;
  nome_do_cliente: string;
  business_type?: string;
  show_prices_on_bot?: boolean;
  prompt_sistema_ia?: string;
  id_assistente_openai?: string;
}

/**
 * Cria ou atualiza um registro no DynamoDB
 */
export async function upsertDynamoDBConfig(config: DynamoDBConfig): Promise<{ success: boolean; error?: string }> {
  try {
    if (!config.phone_number_id || !config.token_api_meta) {
      return { success: false, error: "phone_number_id e token_api_meta são obrigatórios" };
    }

    const item = {
      phone_number_id: String(config.phone_number_id),
      business_account_id: config.business_account_id || undefined,
      token_api_meta: config.token_api_meta,
      meta_verify_token: config.meta_verify_token || undefined,
      tenant_slug: config.tenant_slug,
      tenant_api_key: config.tenant_api_key,
      desktop_api_url: config.desktop_api_url,
      nome_do_cliente: config.nome_do_cliente,
      business_type: config.business_type || "RESTAURANTE",
      show_prices_on_bot: config.show_prices_on_bot !== false,
      prompt_sistema_ia: config.prompt_sistema_ia || undefined,
      id_assistente_openai: config.id_assistente_openai || undefined,
    };

    await docClient.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: item,
      })
    );

    return { success: true };
  } catch (error: any) {
    console.error("[DynamoDB Admin] Erro ao criar/atualizar:", error);
    return {
      success: false,
      error: error.message || "Erro ao salvar no DynamoDB",
    };
  }
}

/**
 * Verifica se DynamoDB está configurado
 */
export function isDynamoDBEnabled(): boolean {
  return !!(
    TABLE_NAME &&
    (process.env.AWS_ACCESS_KEY_ID || process.env.AWS_SECRET_ACCESS_KEY)
  );
}
