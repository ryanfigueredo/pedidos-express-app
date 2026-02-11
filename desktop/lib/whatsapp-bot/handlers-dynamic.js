/**
 * Handler dinâmico do bot — fallback para clientes não-restaurante
 */

const {
  marcarComoPrioridade,
  ehPrioridade,
} = require("./prioridade-conversas");

async function handleMessageDynamic(
  from,
  text,
  tenantId = null,
  dynamoConfig = null,
) {
  console.log(
    "[Dynamic] Processando:",
    from,
    "->",
    text,
    "tenant:",
    tenantId,
    "dynamo:",
    !!dynamoConfig,
  );

  if (dynamoConfig) {
    const { nome_do_cliente } = dynamoConfig;
    const clienteNome = nome_do_cliente || "atendimento";
    const reply = `Olá! Você está falando com o ${clienteNome}. Recebemos sua mensagem!`;
    return { reply };
  }

  return {
    reply: "Olá! Você está falando com o atendimento. Recebemos sua mensagem!",
  };
}

module.exports = { handleMessageDynamic };
