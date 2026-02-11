import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Política de Privacidade - Pedidos Express',
  description: 'Política de Privacidade do aplicativo Pedidos Express',
}

export default function PoliticaPrivacidadePage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-8 md:p-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-8 text-center">
          Política de Privacidade
        </h1>
        
        <div className="prose prose-lg max-w-none">
          <p className="text-gray-600 mb-6">
            <strong>Última atualização:</strong> {new Date().toLocaleDateString('pt-BR', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Introdução</h2>
            <p className="text-gray-700 mb-4">
              O Pedidos Express ("nós", "nosso" ou "aplicativo") respeita sua privacidade e está comprometido 
              em proteger seus dados pessoais. Esta Política de Privacidade explica como coletamos, usamos, 
              armazenamos e protegemos suas informações quando você utiliza nosso aplicativo móvel.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Informações que Coletamos</h2>
            
            <h3 className="text-xl font-semibold text-gray-800 mb-3">2.1. Informações de Conta</h3>
            <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
              <li>Nome de usuário e senha</li>
              <li>Nome completo</li>
              <li>Email</li>
              <li>ID do tenant (organização/empresa)</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mb-3">2.2. Informações de Uso</h3>
            <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
              <li>Dados de pedidos e transações</li>
              <li>Interações com o aplicativo</li>
              <li>Preferências e configurações</li>
              <li>Logs de atividade</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mb-3">2.3. Informações Técnicas</h3>
            <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
              <li>Endereço IP</li>
              <li>Tipo de dispositivo e sistema operacional</li>
              <li>Identificadores únicos do dispositivo</li>
              <li>Informações de conexão</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Como Usamos suas Informações</h2>
            <p className="text-gray-700 mb-4">
              Utilizamos suas informações pessoais para os seguintes propósitos:
            </p>
            <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
              <li><strong>Prestação de serviços:</strong> Processar pedidos, gerenciar contas e fornecer funcionalidades do aplicativo</li>
              <li><strong>Autenticação:</strong> Verificar sua identidade e permitir acesso seguro ao aplicativo</li>
              <li><strong>Comunicação:</strong> Enviar notificações sobre pedidos, atualizações e informações importantes</li>
              <li><strong>Melhorias:</strong> Analisar o uso do aplicativo para melhorar nossos serviços</li>
              <li><strong>Segurança:</strong> Prevenir fraudes, detectar atividades suspeitas e proteger nossos sistemas</li>
              <li><strong>Cumprimento legal:</strong> Atender obrigações legais e regulatórias</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Compartilhamento de Informações</h2>
            <p className="text-gray-700 mb-4">
              Não vendemos suas informações pessoais. Podemos compartilhar seus dados apenas nas seguintes situações:
            </p>
            <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
              <li><strong>Com seu consentimento:</strong> Quando você autorizar explicitamente</li>
              <li><strong>Prestadores de serviços:</strong> Com empresas que nos auxiliam na operação do aplicativo (hospedagem, análise, etc.), sob contratos de confidencialidade</li>
              <li><strong>Obrigações legais:</strong> Quando exigido por lei, ordem judicial ou autoridades competentes</li>
              <li><strong>Proteção de direitos:</strong> Para proteger nossos direitos, propriedade ou segurança, ou de nossos usuários</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Segurança dos Dados</h2>
            <p className="text-gray-700 mb-4">
              Implementamos medidas de segurança técnicas e organizacionais adequadas para proteger suas informações:
            </p>
            <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
              <li>Criptografia de dados em trânsito (HTTPS/TLS)</li>
              <li>Armazenamento seguro em servidores protegidos</li>
              <li>Controle de acesso baseado em funções</li>
              <li>Monitoramento contínuo de segurança</li>
              <li>Backups regulares e planos de recuperação</li>
            </ul>
            <p className="text-gray-700 mb-4">
              Embora nos esforcemos para proteger suas informações, nenhum método de transmissão ou armazenamento 
              é 100% seguro. Você também é responsável por manter a confidencialidade de suas credenciais de acesso.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Seus Direitos</h2>
            <p className="text-gray-700 mb-4">
              De acordo com a Lei Geral de Proteção de Dados (LGPD), você tem os seguintes direitos:
            </p>
            <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
              <li><strong>Acesso:</strong> Solicitar acesso aos seus dados pessoais</li>
              <li><strong>Correção:</strong> Solicitar correção de dados incompletos ou desatualizados</li>
              <li><strong>Exclusão:</strong> Solicitar exclusão de dados desnecessários ou tratados em desconformidade</li>
              <li><strong>Portabilidade:</strong> Solicitar portabilidade dos seus dados</li>
              <li><strong>Revogação:</strong> Revogar consentimento a qualquer momento</li>
              <li><strong>Oposição:</strong> Opor-se ao tratamento de dados em certas circunstâncias</li>
            </ul>
            <p className="text-gray-700 mb-4">
              Para exercer seus direitos, entre em contato conosco através dos canais indicados nesta política.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Retenção de Dados</h2>
            <p className="text-gray-700 mb-4">
              Mantemos suas informações pessoais apenas pelo tempo necessário para cumprir os propósitos descritos 
              nesta política, a menos que um período de retenção mais longo seja exigido ou permitido por lei. 
              Quando não houver mais necessidade de reter seus dados, eles serão excluídos ou anonimizados de forma segura.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Cookies e Tecnologias Similares</h2>
            <p className="text-gray-700 mb-4">
              Nosso aplicativo pode usar tecnologias como cookies, tags e pixels para melhorar sua experiência, 
              analisar o uso e personalizar conteúdo. Você pode gerenciar essas preferências nas configurações do 
              seu dispositivo ou navegador.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Privacidade de Menores</h2>
            <p className="text-gray-700 mb-4">
              Nosso aplicativo não é destinado a menores de 18 anos. Não coletamos intencionalmente informações 
              pessoais de menores. Se tomarmos conhecimento de que coletamos dados de um menor sem consentimento 
              dos pais, tomaremos medidas para excluir essas informações.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Alterações nesta Política</h2>
            <p className="text-gray-700 mb-4">
              Podemos atualizar esta Política de Privacidade periodicamente. Notificaremos você sobre mudanças 
              significativas publicando a nova política nesta página e atualizando a data de "Última atualização". 
              Recomendamos que você revise esta política regularmente.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">11. Contato</h2>
            <p className="text-gray-700 mb-4">
              Se você tiver dúvidas, preocupações ou solicitações relacionadas a esta Política de Privacidade 
              ou ao tratamento de seus dados pessoais, entre em contato conosco:
            </p>
            <div className="bg-gray-50 p-6 rounded-lg">
              <p className="text-gray-800 mb-2">
                <strong>Email:</strong> privacidade@dmtn.com.br
              </p>
              <p className="text-gray-800 mb-2">
                <strong>Website:</strong> pedidos.dmtn.com.br
              </p>
              <p className="text-gray-800">
                <strong>Encarregado de Dados (DPO):</strong> disponível mediante solicitação
              </p>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">12. Lei Aplicável</h2>
            <p className="text-gray-700 mb-4">
              Esta Política de Privacidade é regida pelas leis brasileiras, especialmente a Lei Geral de 
              Proteção de Dados Pessoais (Lei nº 13.709/2018 - LGPD) e o Marco Civil da Internet (Lei nº 12.965/2014).
            </p>
          </section>

          <div className="mt-12 pt-8 border-t border-gray-200">
            <p className="text-sm text-gray-500 text-center">
              Ao usar o aplicativo Pedidos Express, você concorda com esta Política de Privacidade.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
