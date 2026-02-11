export default function PrivacidadePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4" style={{ marginTop: 0 }}>
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-xl p-8 md:p-12">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Política de Privacidade
            </h1>
            <p className="text-xl text-gray-600">
              Pedidos Express
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Última atualização: Janeiro de 2026
            </p>
          </div>

          <div className="space-y-8 text-gray-700 leading-relaxed">
            {/* Introdução */}
            <section>
              <p className="mb-4">
                Esta Política de Privacidade descreve como o <strong>Pedidos Express</strong> ("nós", "nosso" ou "aplicativo") 
                coleta, usa, armazena e protege suas informações pessoais quando você utiliza nosso aplicativo móvel e serviços relacionados.
              </p>
              <p className="mb-4">
                Ao utilizar o Pedidos Express, você concorda com a coleta e uso de informações de acordo com esta política. 
                Se você não concordar com esta política, por favor, não utilize nosso aplicativo.
              </p>
            </section>

            {/* Informações Coletadas */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                1. Informações que Coletamos
              </h2>
              
              <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">
                1.1 Informações Fornecidas por Você
              </h3>
              <ul className="list-disc list-inside space-y-2 mb-4">
                <li><strong>Dados de Conta:</strong> Nome de usuário, senha (armazenada de forma criptografada), nome completo e email para criação e gerenciamento de sua conta</li>
                <li><strong>Informações do Restaurante:</strong> Nome do estabelecimento, horários de funcionamento, informações de contato e configurações do negócio</li>
                <li><strong>Dados do Cardápio:</strong> Produtos, preços, descrições e categorias dos itens oferecidos</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">
                1.2 Informações Coletadas Automaticamente
              </h3>
              <ul className="list-disc list-inside space-y-2 mb-4">
                <li><strong>Dados de Pedidos:</strong> Nome e telefone dos clientes que fazem pedidos através do WhatsApp, itens solicitados, valores, métodos de pagamento e endereços de entrega (quando aplicável)</li>
                <li><strong>Informações de Uso:</strong> Dados sobre como você utiliza o aplicativo, incluindo funcionalidades acessadas, frequência de uso e padrões de navegação</li>
                <li><strong>Informações Técnicas:</strong> Tipo de dispositivo, sistema operacional, versão do aplicativo, endereço IP e identificadores únicos do dispositivo</li>
                <li><strong>Dados de Sincronização:</strong> Informações necessárias para sincronizar dados entre múltiplos dispositivos</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">
                1.3 Informações de Terceiros
              </h3>
              <ul className="list-disc list-inside space-y-2 mb-4">
                <li><strong>Integração com WhatsApp:</strong> Recebemos informações de pedidos através da integração com WhatsApp, incluindo mensagens e dados de contato dos clientes que interagem com o bot de atendimento</li>
              </ul>
            </section>

            {/* Como Usamos */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                2. Como Utilizamos suas Informações
              </h2>
              <p className="mb-4">
                Utilizamos as informações coletadas para os seguintes propósitos:
              </p>
              <ul className="list-disc list-inside space-y-2 mb-4">
                <li><strong>Prestação de Serviços:</strong> Processar e gerenciar pedidos recebidos via WhatsApp, exibir informações no dashboard e fornecer funcionalidades do aplicativo</li>
                <li><strong>Gerenciamento de Conta:</strong> Criar e gerenciar sua conta, autenticar usuários e fornecer acesso às funcionalidades do aplicativo</li>
                <li><strong>Comunicação:</strong> Enviar notificações sobre novos pedidos, atualizações do sistema e informações relevantes sobre o serviço</li>
                <li><strong>Melhoria do Serviço:</strong> Analisar padrões de uso para melhorar funcionalidades, corrigir erros e desenvolver novas características</li>
                <li><strong>Estatísticas e Relatórios:</strong> Gerar relatórios de vendas, estatísticas de pedidos e métricas de desempenho do negócio</li>
                <li><strong>Segurança:</strong> Detectar e prevenir fraudes, abusos e atividades suspeitas</li>
                <li><strong>Cumprimento Legal:</strong> Cumprir obrigações legais, responder a solicitações governamentais e proteger nossos direitos legais</li>
              </ul>
            </section>

            {/* Compartilhamento */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                3. Compartilhamento de Informações
              </h2>
              <p className="mb-4">
                Não vendemos suas informações pessoais. Podemos compartilhar suas informações apenas nas seguintes situações:
              </p>
              <ul className="list-disc list-inside space-y-2 mb-4">
                <li><strong>Prestadores de Serviços:</strong> Compartilhamos informações com provedores de serviços terceirizados que nos auxiliam na operação do aplicativo (hospedagem, análise de dados, processamento de pagamentos), sujeitos a acordos de confidencialidade</li>
                <li><strong>Integração com WhatsApp:</strong> Informações de pedidos são compartilhadas com a plataforma WhatsApp conforme necessário para o funcionamento da integração</li>
                <li><strong>Obrigações Legais:</strong> Quando exigido por lei, ordem judicial ou processo legal</li>
                <li><strong>Proteção de Direitos:</strong> Para proteger nossos direitos, propriedade ou segurança, bem como de nossos usuários</li>
                <li><strong>Com seu Consentimento:</strong> Em outras situações, quando você nos der permissão explícita</li>
              </ul>
            </section>

            {/* Segurança */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                4. Segurança dos Dados
              </h2>
              <p className="mb-4">
                Implementamos medidas de segurança técnicas e organizacionais apropriadas para proteger suas informações pessoais contra acesso não autorizado, alteração, divulgação ou destruição:
              </p>
              <ul className="list-disc list-inside space-y-2 mb-4">
                <li>Criptografia de dados em trânsito usando protocolos seguros (HTTPS/TLS)</li>
                <li>Armazenamento seguro de senhas usando algoritmos de hash (bcrypt)</li>
                <li>Controle de acesso baseado em funções para limitar quem pode acessar informações sensíveis</li>
                <li>Monitoramento regular de segurança e auditorias</li>
                <li>Isolamento de dados por tenant (multi-tenant) para garantir que cada restaurante acesse apenas seus próprios dados</li>
              </ul>
              <p className="mb-4">
                Embora nos esforcemos para proteger suas informações, nenhum método de transmissão pela internet ou armazenamento eletrônico é 100% seguro. 
                Não podemos garantir segurança absoluta, mas nos comprometemos a notificá-lo sobre qualquer violação de dados que possa afetar suas informações pessoais.
              </p>
            </section>

            {/* Retenção */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                5. Retenção de Dados
              </h2>
              <p className="mb-4">
                Mantemos suas informações pessoais pelo tempo necessário para cumprir os propósitos descritos nesta política, a menos que um período de retenção mais longo seja exigido ou permitido por lei. 
                Dados de pedidos e transações são mantidos para fins contábeis e legais conforme necessário.
              </p>
            </section>

            {/* Seus Direitos */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                6. Seus Direitos
              </h2>
              <p className="mb-4">
                Você tem os seguintes direitos em relação às suas informações pessoais:
              </p>
              <ul className="list-disc list-inside space-y-2 mb-4">
                <li><strong>Acesso:</strong> Solicitar uma cópia das informações pessoais que mantemos sobre você</li>
                <li><strong>Correção:</strong> Solicitar a correção de informações imprecisas ou incompletas</li>
                <li><strong>Exclusão:</strong> Solicitar a exclusão de suas informações pessoais, sujeito a obrigações legais de retenção</li>
                <li><strong>Portabilidade:</strong> Solicitar a transferência de suas informações para outro serviço</li>
                <li><strong>Oposição:</strong> Opor-se ao processamento de suas informações pessoais em certas circunstâncias</li>
                <li><strong>Revogação de Consentimento:</strong> Revogar seu consentimento quando o processamento for baseado em consentimento</li>
              </ul>
              <p className="mb-4">
                Para exercer esses direitos, entre em contato conosco através dos canais indicados na seção "Contato" abaixo.
              </p>
            </section>

            {/* Dados de Menores */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                7. Privacidade de Menores
              </h2>
              <p className="mb-4">
                O Pedidos Express não é direcionado a menores de 13 anos. Não coletamos intencionalmente informações pessoais de crianças menores de 13 anos. 
                Se tomarmos conhecimento de que coletamos informações de uma criança menor de 13 anos sem verificação do consentimento dos pais, 
                tomaremos medidas para remover essas informações de nossos servidores.
              </p>
              <p className="mb-4">
                Se você é pai ou responsável e acredita que seu filho nos forneceu informações pessoais, entre em contato conosco imediatamente.
              </p>
            </section>

            {/* Alterações */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                8. Alterações nesta Política
              </h2>
              <p className="mb-4">
                Podemos atualizar esta Política de Privacidade periodicamente. Notificaremos você sobre quaisquer alterações publicando a nova política nesta página 
                e atualizando a data de "Última atualização" no topo desta política.
              </p>
              <p className="mb-4">
                Recomendamos que você revise esta política periodicamente para se manter informado sobre como protegemos suas informações.
              </p>
            </section>

            {/* Contato */}
            <section className="bg-blue-50 rounded-lg p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                9. Contato
              </h2>
              <p className="mb-4">
                Se você tiver dúvidas, preocupações ou solicitações relacionadas a esta Política de Privacidade ou ao tratamento de suas informações pessoais, 
                entre em contato conosco através dos seguintes canais:
              </p>
              <div className="space-y-2 text-gray-700">
                <p>
                  <strong>Email:</strong>{' '}
                  <a 
                    href="mailto:suporte@dmtn.com.br" 
                    className="text-blue-600 hover:underline"
                  >
                    suporte@dmtn.com.br
                  </a>
                </p>
                <p>
                  <strong>WhatsApp:</strong>{' '}
                  <a 
                    href="https://wa.me/5521997624873" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-blue-600 hover:underline"
                  >
                    (21) 99762-4873
                  </a>
                </p>
                <p>
                  <strong>Website:</strong>{' '}
                  <a 
                    href="https://dmtn.com.br" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-blue-600 hover:underline"
                  >
                    dmtn.com.br
                  </a>
                </p>
              </div>
            </section>

            {/* Rodapé */}
            <div className="border-t border-gray-200 pt-6 mt-8 text-center text-gray-500 text-sm">
              <p>© 2026 Pedidos Express. Todos os direitos reservados.</p>
              <p className="mt-2">
                Desenvolvido por{' '}
                <a 
                  href="https://dmtn.com.br" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-blue-600 hover:underline"
                >
                  dmtn.com.br
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
