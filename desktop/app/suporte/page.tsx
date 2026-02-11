import { Check } from "lucide-react";

export default function SuportePage() {
  return (
    <div
      className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4"
      style={{ marginTop: 0 }}
    >
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-xl p-8 md:p-12">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Pedidos Express
            </h1>
            <p className="text-xl text-gray-600">
              Central de Suporte e Documentação
            </p>
          </div>

          <div className="space-y-8">
            {/* Sobre o App */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                📱 Sobre o App
              </h2>
              <p className="text-gray-700 leading-relaxed">
                O <strong>Pedidos Express</strong> é um aplicativo completo para
                gerenciar seu restaurante, lanchonete ou negócio de delivery.
                Integrado com WhatsApp, você recebe pedidos automaticamente,
                gerencia seu cardápio e controla todas as operações do seu
                negócio em um só lugar.
              </p>
            </section>

            {/* Funcionalidades */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                🚀 Funcionalidades Principais
              </h2>
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-start">
                  <Check
                    size={18}
                    className="text-primary-500 mr-2 mt-0.5 flex-shrink-0"
                  />
                  <span>
                    <strong>Recebimento Automático:</strong> Receba pedidos
                    diretamente pelo WhatsApp
                  </span>
                </li>
                <li className="flex items-start">
                  <Check
                    size={18}
                    className="text-primary-500 mr-2 mt-0.5 flex-shrink-0"
                  />
                  <span>
                    <strong>Gerenciamento de Cardápio:</strong> Adicione, edite
                    e organize seus produtos
                  </span>
                </li>
                <li className="flex items-start">
                  <Check
                    size={18}
                    className="text-primary-500 mr-2 mt-0.5 flex-shrink-0"
                  />
                  <span>
                    <strong>Controle de Horários:</strong> Defina horários de
                    funcionamento da sua loja
                  </span>
                </li>
                <li className="flex items-start">
                  <Check
                    size={18}
                    className="text-primary-500 mr-2 mt-0.5 flex-shrink-0"
                  />
                  <span>
                    <strong>Dashboard em Tempo Real:</strong> Visualize todos os
                    pedidos e status
                  </span>
                </li>
                <li className="flex items-start">
                  <Check
                    size={18}
                    className="text-primary-500 mr-2 mt-0.5 flex-shrink-0"
                  />
                  <span>
                    <strong>Notificações:</strong> Receba alertas de novos
                    pedidos instantaneamente
                  </span>
                </li>
              </ul>
            </section>

            {/* Como Usar */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                📖 Como Usar
              </h2>
              <ol className="space-y-4 text-gray-700">
                <li className="flex items-start">
                  <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center mr-3 mt-1 flex-shrink-0 text-sm font-bold">
                    1
                  </span>
                  <div>
                    <strong>Configure sua loja:</strong> Adicione suas
                    informações básicas e configure o cardápio
                  </div>
                </li>
                <li className="flex items-start">
                  <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center mr-3 mt-1 flex-shrink-0 text-sm font-bold">
                    2
                  </span>
                  <div>
                    <strong>Conecte com WhatsApp:</strong> Integre seu número
                    para receber pedidos automaticamente
                  </div>
                </li>
                <li className="flex items-start">
                  <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center mr-3 mt-1 flex-shrink-0 text-sm font-bold">
                    3
                  </span>
                  <div>
                    <strong>Receba pedidos:</strong> Os pedidos chegam
                    automaticamente no app em tempo real
                  </div>
                </li>
                <li className="flex items-start">
                  <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center mr-3 mt-1 flex-shrink-0 text-sm font-bold">
                    4
                  </span>
                  <div>
                    <strong>Gerencie tudo:</strong> Controle pedidos, cardápio e
                    horários de funcionamento
                  </div>
                </li>
              </ol>
            </section>

            {/* Perguntas Frequentes */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                ❓ Perguntas Frequentes
              </h2>
              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">
                    Como recebo pedidos pelo WhatsApp?
                  </h3>
                  <p className="text-gray-700">
                    O app está integrado com um bot do WhatsApp que recebe os
                    pedidos dos clientes e os envia automaticamente para o
                    aplicativo. Você só precisa configurar a integração inicial.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">
                    Posso usar em múltiplos dispositivos?
                  </h3>
                  <p className="text-gray-700">
                    Sim! Você pode instalar o app em vários dispositivos e todos
                    receberão os pedidos em tempo real sincronizados.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">
                    Os dados são seguros?
                  </h3>
                  <p className="text-gray-700">
                    Sim, utilizamos as melhores práticas de segurança para
                    proteger suas informações e as de seus clientes. Todos os
                    dados são criptografados e armazenados de forma segura.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">
                    Preciso de internet para usar?
                  </h3>
                  <p className="text-gray-700">
                    Sim, o app requer conexão com a internet para receber
                    pedidos e sincronizar dados em tempo real.
                  </p>
                </div>
              </div>
            </section>

            {/* Contato */}
            <section className="bg-blue-50 rounded-lg p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                📞 Precisa de Ajuda?
              </h2>
              <p className="text-gray-700 mb-4">
                Nossa equipe está sempre pronta para auxiliar você a aproveitar
                ao máximo todas as funcionalidades do app.
              </p>
              <div className="space-y-2 text-gray-700">
                <p>
                  <strong>WhatsApp:</strong>{" "}
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
                  <strong>Email:</strong> suporte@dmtn.com.br
                </p>
                <p>
                  <strong>Website:</strong>{" "}
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
                Desenvolvido por{" "}
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
  );
}
