import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Opções de Privacidade - Pedidos Express",
  description: "Gerencie suas opções de privacidade no Pedidos Express",
};

export default function OpcoesPrivacidadePage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-8 md:p-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-8 text-center">
          Opções de Privacidade do Usuário
        </h1>

        <div className="prose prose-lg max-w-none">
          <p className="text-gray-600 mb-6">
            <strong>Última atualização:</strong>{" "}
            {new Date().toLocaleDateString("pt-BR", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Controle seus Dados
            </h2>
            <p className="text-gray-700 mb-6">
              Você tem controle sobre seus dados pessoais. Use as opções abaixo
              para gerenciar suas preferências de privacidade.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              1. Acessar seus Dados
            </h2>
            <p className="text-gray-700 mb-4">
              Você pode acessar seus dados pessoais diretamente no aplicativo
              através das configurações da sua conta, ou solicitando uma cópia
              completa dos seus dados.
            </p>
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-4">
              <p className="text-blue-800">
                <strong>Como fazer:</strong> Acesse o aplicativo → Configurações
                → Minha Conta → Ver Dados
              </p>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              2. Corrigir seus Dados
            </h2>
            <p className="text-gray-700 mb-4">
              Você pode atualizar suas informações pessoais a qualquer momento
              através do aplicativo.
            </p>
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-4">
              <p className="text-blue-800">
                <strong>Como fazer:</strong> Acesse o aplicativo → Configurações
                → Editar Perfil
              </p>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              3. Excluir sua Conta
            </h2>
            <p className="text-gray-700 mb-4">
              Você pode solicitar a exclusão da sua conta e dados pessoais. Após
              a exclusão, seus dados serão removidos permanentemente, exceto
              quando a retenção for exigida por lei.
            </p>
            <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
              <p className="text-red-800">
                <strong>Atenção:</strong> A exclusão da conta é permanente e não
                pode ser desfeita. Todos os seus dados serão removidos.
              </p>
            </div>
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-4">
              <p className="text-blue-800">
                <strong>Como fazer:</strong> Entre em contato conosco em
                privacidade@dmtn.com.br solicitando a exclusão da conta
              </p>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              4. Exportar seus Dados
            </h2>
            <p className="text-gray-700 mb-4">
              Você pode solicitar uma cópia dos seus dados em formato
              estruturado e de uso comum (portabilidade de dados).
            </p>
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-4">
              <p className="text-blue-800">
                <strong>Como fazer:</strong> Entre em contato conosco em
                privacidade@dmtn.com.br solicitando a exportação dos dados
              </p>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              5. Revogar Consentimento
            </h2>
            <p className="text-gray-700 mb-4">
              Você pode revogar seu consentimento para o tratamento de dados
              pessoais a qualquer momento. Isso pode afetar a disponibilidade de
              certas funcionalidades do aplicativo.
            </p>
            <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 mb-4">
              <p className="text-yellow-800">
                <strong>Importante:</strong> A revogação do consentimento pode
                impedir o uso de funcionalidades essenciais do aplicativo.
              </p>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              6. Notificações e Comunicações
            </h2>
            <p className="text-gray-700 mb-4">
              Você pode gerenciar suas preferências de notificações push e
              comunicações por email.
            </p>
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-4">
              <p className="text-blue-800">
                <strong>Como fazer:</strong> Acesse o aplicativo → Configurações
                → Notificações
              </p>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              7. Cookies e Rastreamento
            </h2>
            <p className="text-gray-700 mb-4">
              Você pode gerenciar cookies e tecnologias de rastreamento através
              das configurações do seu dispositivo ou navegador. Algumas
              funcionalidades podem não funcionar corretamente se você
              desabilitar cookies essenciais.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              8. Compartilhamento com Terceiros
            </h2>
            <p className="text-gray-700 mb-4">
              Você pode optar por não compartilhar seus dados com terceiros para
              fins de marketing. Note que ainda podemos compartilhar dados com
              prestadores de serviços essenciais para operação do aplicativo.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              9. Dados de Localização
            </h2>
            <p className="text-gray-700 mb-4">
              O aplicativo pode solicitar acesso à sua localização para
              funcionalidades como entrega. Você pode gerenciar essas permissões
              nas configurações do seu dispositivo.
            </p>
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-4">
              <p className="text-blue-800">
                <strong>Como fazer:</strong> Configurações do dispositivo →
                Aplicativos → Pedidos Express → Permissões → Localização
              </p>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              10. Direito de Oposição
            </h2>
            <p className="text-gray-700 mb-4">
              Você pode se opor ao tratamento de seus dados pessoais para fins
              específicos, como marketing direto ou análise de perfil, quando
              aplicável.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              11. Tempo de Resposta
            </h2>
            <p className="text-gray-700 mb-4">
              Responderemos às suas solicitações relacionadas a direitos de
              privacidade dentro de 15 (quinze) dias úteis, conforme exigido
              pela LGPD. Em casos complexos, podemos estender esse prazo,
              informando você previamente.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              12. Contato para Questões de Privacidade
            </h2>
            <p className="text-gray-700 mb-4">
              Para exercer seus direitos ou fazer perguntas sobre privacidade,
              entre em contato:
            </p>
            <div className="bg-gray-50 p-6 rounded-lg">
              <p className="text-gray-800 mb-2">
                <strong>Email:</strong> privacidade@dmtn.com.br
              </p>
              <p className="text-gray-800 mb-2">
                <strong>Assunto:</strong> Solicitação de Privacidade
              </p>
              <p className="text-gray-800 mb-2">
                <strong>Website:</strong> pedidos.dmtn.com.br
              </p>
              <p className="text-gray-800">
                <strong>Encarregado de Dados (DPO):</strong> disponível mediante
                solicitação
              </p>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              13. Reclamações
            </h2>
            <p className="text-gray-700 mb-4">
              Se você acredita que seus direitos de privacidade foram violados,
              você pode apresentar uma reclamação à Autoridade Nacional de
              Proteção de Dados (ANPD):
            </p>
            <div className="bg-gray-50 p-6 rounded-lg">
              <p className="text-gray-800 mb-2">
                <strong>ANPD - Autoridade Nacional de Proteção de Dados</strong>
              </p>
              <p className="text-gray-800 mb-2">
                <strong>Website:</strong> www.gov.br/anpd
              </p>
              <p className="text-gray-800">
                <strong>Email:</strong> atendimento@anpd.gov.br
              </p>
            </div>
          </section>

          <div className="mt-12 pt-8 border-t border-gray-200">
            <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-4">
              <p className="text-green-800">
                <strong>💡 Dica:</strong> Mantenha suas informações atualizadas
                e revise regularmente suas configurações de privacidade para
                garantir que suas preferências estejam corretas.
              </p>
            </div>
            <p className="text-sm text-gray-500 text-center">
              Para mais informações, consulte nossa{" "}
              <a
                href="/politicaprivacidade"
                className="text-blue-600 hover:underline"
              >
                Política de Privacidade completa
              </a>
              .
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
