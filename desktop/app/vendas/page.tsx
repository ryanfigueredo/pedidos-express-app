"use client";

import Link from "next/link";
import { AppIcon } from "@/components/AppIcon";
import { Check, Star, Info, Gift, X } from "lucide-react";
import { DeliveryAnimation } from "@/components/DeliveryAnimation";
// Preços em stand-by; quando integrar pagamento, use getPlanPricing de @/lib/plan-pricing

const WHATSAPP_VENDAS = "5521997624873";
const WHATSAPP_URL = `https://wa.me/${WHATSAPP_VENDAS}?text=${encodeURIComponent("Olá! Gostaria de conhecer os planos do Pedidos Express.")}`;

/** Ícone WhatsApp usando PNG (padrão) ou SVG branco (para footer) */
function WhatsAppIcon({ size = 18, white = false }: { size?: number; white?: boolean }) {
  if (white) {
    // SVG branco para footer
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="flex-shrink-0"
      >
        <path
          fill="currentColor"
          d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.865 9.865 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"
        />
      </svg>
    );
  }
  
  // PNG para uso geral
  return (
    <img
      src="/WhatsApp-Logo.wine.png"
      alt="WhatsApp"
      width={size}
      height={size}
      className="flex-shrink-0 object-contain"
    />
  );
}

export default function VendasPage() {
  return (
    <div className="min-h-screen bg-[#faf9f7] relative">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-amber-100/50 bg-[#faf9f7]/95 backdrop-blur-md shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center gap-3">
              <AppIcon size={36} />
              <span className="text-xl font-black text-gray-900 font-display tracking-tight">
                Pedidos Express
              </span>
            </Link>
            <div className="flex items-center gap-3">
              <Link
                href="/vendas"
                className="hidden sm:inline-flex text-slate-600 hover:text-amber-600 font-semibold text-sm transition-colors duration-200"
              >
                Planos
              </Link>
              <Link
                href="/login"
                className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white px-6 py-2.5 rounded-full font-bold text-sm shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
              >
                Entrar
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32">
        <div className="flex flex-col md:flex-row items-center justify-between mb-8 gap-8">
          <div className="text-center md:text-left flex-1">
            <h1 className="text-5xl sm:text-6xl md:text-7xl font-extrabold text-gray-900 mb-4 font-display tracking-tight">
              Planos e Preços
            </h1>
            <p className="text-xl sm:text-2xl text-slate-600 mb-6 max-w-2xl leading-relaxed font-medium">
              Escolha o plano ideal para o seu negócio
            </p>
          </div>
          <div className="flex-shrink-0 w-full md:w-96 max-w-md">
            <DeliveryAnimation className="w-full h-auto" />
          </div>
        </div>

        {/* Pricing Table - Estilo Comparativo */}
        {/* Desktop: Tabela completa */}
        <div className="hidden lg:block overflow-x-auto mb-16">
          <div className="inline-block min-w-full">
            <div className="grid grid-cols-4 gap-0 bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200 relative">
              {/* Header com Features */}
              <div className="bg-gray-50 p-4 md:p-6 border-r border-gray-200">
                <div className="h-24 md:h-32"></div>
                <div className="space-y-3 pt-4">
                  <div className="text-sm font-semibold text-gray-700 py-3 border-b border-gray-200">Bot WhatsApp</div>
                  <div className="text-sm font-semibold text-gray-700 py-3 border-b border-gray-200">Mensagens/mês</div>
                  <div className="text-sm font-semibold text-gray-700 py-3 border-b border-gray-200">App Mobile</div>
                  <div className="text-sm font-semibold text-gray-700 py-3 border-b border-gray-200">Dashboard Web</div>
                  <div className="text-sm font-semibold text-gray-700 py-3 border-b border-gray-200">Notas Fiscais/mês</div>
                  <div className="text-sm font-semibold text-gray-700 py-3 border-b border-gray-200">Impressão Bluetooth</div>
                  <div className="text-sm font-semibold text-gray-700 py-3 border-b border-gray-200">Suporte</div>
                  <div className="text-sm font-semibold text-gray-700 py-3 border-b border-gray-200">Filiais</div>
                  <div className="text-sm font-semibold text-gray-700 py-3 border-b border-gray-200">Relatórios Avançados</div>
                  <div className="text-sm font-semibold text-gray-700 py-3">Consultoria Mensal</div>
                </div>
              </div>

              {/* Plano Básico */}
              <div className="bg-white p-4 md:p-6 border-r border-gray-200 text-center">
                <div className="h-24 md:h-32 flex flex-col justify-center">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Básico</h3>
                  <div className="text-2xl font-bold text-gray-900 mb-1">Consultar</div>
                  <p className="text-xs text-gray-500">Ideal para começar</p>
                </div>
                <div className="space-y-3 pt-4">
                  <div className="flex items-center justify-center py-3 border-b border-gray-100 h-[48px]"><Check size={20} className="text-amber-600" /></div>
                  <div className="flex items-center justify-center text-sm text-gray-700 py-3 border-b border-gray-100 h-[48px]">1.000</div>
                  <div className="flex items-center justify-center py-3 border-b border-gray-100 h-[48px]"><Check size={20} className="text-amber-600" /></div>
                  <div className="flex items-center justify-center py-3 border-b border-gray-100 h-[48px]"><Check size={20} className="text-amber-600" /></div>
                  <div className="flex items-center justify-center py-3 border-b border-gray-100 h-[48px]"><X size={20} className="text-gray-300" /></div>
                  <div className="flex items-center justify-center py-3 border-b border-gray-100 h-[48px]"><Check size={20} className="text-amber-600" /></div>
                  <div className="flex items-center justify-center text-sm text-gray-700 py-3 border-b border-gray-100 h-[48px]">Email</div>
                  <div className="flex items-center justify-center py-3 border-b border-gray-100 h-[48px]"><X size={20} className="text-gray-300" /></div>
                  <div className="flex items-center justify-center py-3 border-b border-gray-100 h-[48px]"><X size={20} className="text-gray-300" /></div>
                  <div className="flex items-center justify-center py-3 h-[48px]"><X size={20} className="text-gray-300" /></div>
                </div>
                <a
                  href={WHATSAPP_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full mt-6 bg-gray-800 text-white py-3 rounded-lg font-semibold hover:bg-gray-900 transition text-sm flex items-center justify-center gap-2"
                >
                  Começar agora →
                </a>
              </div>

              {/* Plano Completo - Destaque */}
              <div className="bg-gradient-to-br from-amber-600 via-amber-500 to-orange-600 p-4 md:p-6 border-r border-amber-500 text-center">
                <div className="h-24 md:h-32 flex flex-col justify-center">
                  <h3 className="text-xl font-bold text-white mb-2 font-display">Completo</h3>
                  <div className="text-2xl font-bold text-white mb-1 font-display">Consultar</div>
                  <p className="text-xs text-amber-100">Recomendado</p>
                </div>
                <div className="space-y-3 pt-4">
                  <div className="flex items-center justify-center py-3 border-b border-amber-500/30 h-[48px]"><Check size={20} className="text-white" /></div>
                  <div className="flex items-center justify-center text-sm text-white font-medium py-3 border-b border-amber-500/30 h-[48px]">2.500</div>
                  <div className="flex items-center justify-center py-3 border-b border-amber-500/30 h-[48px]"><Check size={20} className="text-white" /></div>
                  <div className="flex items-center justify-center py-3 border-b border-amber-500/30 h-[48px]"><Check size={20} className="text-white" /></div>
                  <div className="flex items-center justify-center text-sm text-white font-medium py-3 border-b border-amber-500/30 h-[48px]">500</div>
                  <div className="flex items-center justify-center py-3 border-b border-amber-500/30 h-[48px]"><Check size={20} className="text-white" /></div>
                  <div className="flex items-center justify-center text-sm text-white py-3 border-b border-amber-500/30 h-[48px]">Prioritário</div>
                  <div className="flex items-center justify-center py-3 border-b border-amber-500/30 h-[48px]"><X size={20} className="text-white opacity-50" /></div>
                  <div className="flex items-center justify-center py-3 border-b border-amber-500/30 h-[48px]"><X size={20} className="text-white opacity-50" /></div>
                  <div className="flex items-center justify-center py-3 h-[48px]"><X size={20} className="text-white opacity-50" /></div>
                </div>
                <a
                  href={WHATSAPP_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full mt-6 bg-white text-amber-600 py-3 rounded-lg font-semibold hover:bg-amber-50 transition text-sm shadow-lg flex items-center justify-center gap-2"
                >
                  Começar agora →
                </a>
              </div>

              {/* Plano Premium */}
              <div className="bg-white p-4 md:p-6 text-center">
                <div className="h-24 md:h-32 flex flex-col justify-center">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Premium</h3>
                  <div className="text-2xl font-bold text-gray-900 mb-1">Consultar</div>
                  <p className="text-xs text-gray-500">Para grandes operações</p>
                </div>
                <div className="space-y-3 pt-4">
                  <div className="flex items-center justify-center py-3 border-b border-gray-100 h-[48px]"><Check size={20} className="text-amber-600" /></div>
                  <div className="flex items-center justify-center text-sm text-gray-700 font-medium py-3 border-b border-gray-100 h-[48px]">Ilimitado</div>
                  <div className="flex items-center justify-center py-3 border-b border-gray-100 h-[48px]"><Check size={20} className="text-amber-600" /></div>
                  <div className="flex items-center justify-center py-3 border-b border-gray-100 h-[48px]"><Check size={20} className="text-amber-600" /></div>
                  <div className="flex items-center justify-center text-sm text-gray-700 font-medium py-3 border-b border-gray-100 h-[48px]">1.000</div>
                  <div className="flex items-center justify-center py-3 border-b border-gray-100 h-[48px]"><Check size={20} className="text-amber-600" /></div>
                  <div className="flex items-center justify-center text-sm text-gray-700 py-3 border-b border-gray-100 h-[48px]">Resposta Rápida</div>
                  <div className="flex items-center justify-center py-3 border-b border-gray-100 h-[48px]"><Check size={20} className="text-amber-600" /></div>
                  <div className="flex items-center justify-center py-3 border-b border-gray-100 h-[48px]"><Check size={20} className="text-amber-600" /></div>
                  <div className="flex items-center justify-center py-3 h-[48px]">
                    <span className="text-xs text-gray-600 text-center leading-tight">1h/mês personalizada</span>
                  </div>
                </div>
                <a
                  href={WHATSAPP_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full mt-6 bg-gray-800 text-white py-3 rounded-lg font-semibold hover:bg-gray-900 transition text-sm flex items-center justify-center gap-2"
                >
                  Começar agora →
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile/Tablet: Cards verticais */}
        <div className="lg:hidden grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          {/* Plano Básico */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6">
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Básico</h3>
              <div className="text-3xl font-bold text-gray-900 mb-1">Consultar</div>
              <p className="text-sm text-gray-500">Ideal para começar</p>
            </div>
            <div className="space-y-3 mb-6">
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <span className="text-sm text-gray-700">Bot WhatsApp</span>
                <Check size={20} className="text-amber-600" />
              </div>
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <span className="text-sm text-gray-700">Mensagens/mês</span>
                <span className="text-sm font-medium text-gray-900">1.000</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <span className="text-sm text-gray-700">App Mobile</span>
                <Check size={20} className="text-amber-600" />
              </div>
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <span className="text-sm text-gray-700">Dashboard Web</span>
                <Check size={20} className="text-amber-600" />
              </div>
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <span className="text-sm text-gray-700">Notas Fiscais/mês</span>
                <X size={20} className="text-gray-300" />
              </div>
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <span className="text-sm text-gray-700">Impressão Bluetooth</span>
                <Check size={20} className="text-amber-600" />
              </div>
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <span className="text-sm text-gray-700">Suporte</span>
                <span className="text-sm text-gray-700">Email</span>
              </div>
            </div>
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full bg-gray-800 text-white py-3 rounded-lg font-semibold hover:bg-gray-900 transition text-sm flex items-center justify-center gap-2"
            >
              Começar agora →
            </a>
          </div>

          {/* Plano Completo */}
          <div className="bg-gradient-to-br from-amber-600 via-amber-500 to-orange-600 rounded-2xl shadow-xl border-2 border-amber-500 p-6 text-white">
            <div className="text-center mb-6">
              <span className="inline-block px-3 py-1 bg-white text-amber-600 rounded-full text-xs font-bold mb-2">
                RECOMENDADO
              </span>
              <h3 className="text-2xl font-bold mb-2 font-display">Completo</h3>
              <div className="text-3xl font-bold mb-1 font-display">Consultar</div>
              <p className="text-sm text-amber-100">Mais popular</p>
            </div>
            <div className="space-y-3 mb-6">
              <div className="flex items-center justify-between py-2 border-b border-amber-500/30">
                <span className="text-sm">Bot WhatsApp</span>
                <Check size={20} className="text-white" />
              </div>
              <div className="flex items-center justify-between py-2 border-b border-amber-500/30">
                <span className="text-sm">Mensagens/mês</span>
                <span className="text-sm font-medium">2.500</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-amber-500/30">
                <span className="text-sm">App Mobile</span>
                <Check size={20} className="text-white" />
              </div>
              <div className="flex items-center justify-between py-2 border-b border-amber-500/30">
                <span className="text-sm">Dashboard Web</span>
                <Check size={20} className="text-white" />
              </div>
              <div className="flex items-center justify-between py-2 border-b border-amber-500/30">
                <span className="text-sm">Notas Fiscais/mês</span>
                <span className="text-sm font-medium">500</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-amber-500/30">
                <span className="text-sm">Impressão Bluetooth</span>
                <Check size={20} className="text-white" />
              </div>
              <div className="flex items-center justify-between py-2 border-b border-amber-500/30">
                <span className="text-sm">Suporte</span>
                <span className="text-sm">Prioritário</span>
              </div>
            </div>
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full bg-white text-amber-600 py-3 rounded-lg font-semibold hover:bg-amber-50 transition text-sm shadow-lg flex items-center justify-center gap-2"
            >
              Começar agora →
            </a>
          </div>

          {/* Plano Premium */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6">
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Premium</h3>
              <div className="text-3xl font-bold text-gray-900 mb-1">Consultar</div>
              <p className="text-sm text-gray-500">Para grandes operações</p>
            </div>
            <div className="space-y-3 mb-6">
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <span className="text-sm text-gray-700">Bot WhatsApp</span>
                <Check size={20} className="text-amber-600" />
              </div>
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <span className="text-sm text-gray-700">Mensagens/mês</span>
                <span className="text-sm font-medium text-gray-900">Ilimitado</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <span className="text-sm text-gray-700">App Mobile</span>
                <Check size={20} className="text-amber-600" />
              </div>
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <span className="text-sm text-gray-700">Dashboard Web</span>
                <Check size={20} className="text-amber-600" />
              </div>
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <span className="text-sm text-gray-700">Notas Fiscais/mês</span>
                <span className="text-sm font-medium text-gray-900">1.000</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <span className="text-sm text-gray-700">Impressão Bluetooth</span>
                <Check size={20} className="text-amber-600" />
              </div>
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <span className="text-sm text-gray-700">Suporte</span>
                <span className="text-sm text-gray-700">Resposta Rápida</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <span className="text-sm text-gray-700">Filiais</span>
                <Check size={20} className="text-amber-600" />
              </div>
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <span className="text-sm text-gray-700">Relatórios Avançados</span>
                <Check size={20} className="text-amber-600" />
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-gray-700">Consultoria</span>
                <span className="text-xs text-gray-600 text-right">1h/mês personalizada</span>
              </div>
            </div>
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full bg-gray-800 text-white py-3 rounded-lg font-semibold hover:bg-gray-900 transition text-sm flex items-center justify-center gap-2"
            >
              Começar agora →
            </a>
          </div>
        </div>

        {/* Observação sobre Impressora */}
        <div className="bg-amber-50 rounded-xl p-4 md:p-6 mb-8 max-w-4xl mx-auto border border-amber-200">
          <div className="flex items-start gap-3">
            <Info size={20} className="text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-gray-800 font-semibold mb-1">
                Sobre a Impressão Bluetooth
              </p>
              <p className="text-sm text-gray-700">
                O plano Básico também inclui suporte para impressão Bluetooth. Você precisará adquirir uma impressora térmica compatível (58mm) separadamente. Nós ajudamos na configuração e integração!
              </p>
            </div>
          </div>
        </div>

        {/* Emissão de NFE */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-4 md:p-8 mb-8 border-2 border-amber-100">
          <h2 className="text-3xl font-extrabold text-gray-900 mb-2 text-center font-display tracking-tight">
            Emissão de Nota Fiscal (NF-e)
          </h2>
          <p className="text-slate-600 text-center mb-6 max-w-2xl mx-auto">
            O plano <strong>Completo</strong> inclui <strong>500 notas fiscais por mês</strong> e o plano <strong>Premium</strong> inclui <strong>1.000 notas fiscais por mês</strong>. 
            Se você precisar emitir mais notas fiscais, o valor adicional será cobrado 
            proporcionalmente.
          </p>
          <div className="bg-amber-50 rounded-xl p-4 md:p-6 max-w-2xl mx-auto">
            <div className="text-center">
              <p className="text-lg text-gray-900 mb-2">
                <strong>Valor adicional:</strong>
              </p>
              <p className="text-2xl font-bold text-amber-600 font-display">
                R$ 0,90 por nota fiscal adicional
              </p>
              <p className="text-sm text-gray-700 mt-3">
                Exemplo: Se emitir 750 notas fiscais no mês, serão cobradas 
                <strong className="text-gray-900"> 250 notas adicionais × R$ 0,90 = R$ 225,00</strong> além da mensalidade.
              </p>
              <p className="text-xs text-gray-600 mt-4 pt-4 border-t border-amber-200">
                💡 <strong>Transparência:</strong> O custo base por nota fiscal é de R$ 0,63. 
                O valor de R$ 0,90 garante cobertura de custos e margem operacional para manutenção do serviço.
              </p>
              <p className="text-xs text-gray-600 mt-3">
                📋 <strong>Plano Premium:</strong> Inclui até 1.000 notas fiscais por mês. 
                Notas adicionais também custam R$ 0,90 cada.
              </p>
            </div>
          </div>
          <p className="text-sm text-gray-500 text-center mt-6">
            Valores baseados em custos reais de emissão. Entre em contato para mais informações.
          </p>
        </div>


        {/* CTA */}
        <div className="text-center">
          <a
            href="https://wa.me/5521997624873?text=Olá! Gostaria de conhecer melhor os planos do Pedidos Express."
            target="_blank"
            rel="noopener noreferrer"
            className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white px-8 py-4 rounded-full font-extrabold text-lg shadow-2xl hover:shadow-amber-500/50 hover:scale-105 transition-all duration-300 inline-flex items-center gap-2"
          >
            Começar Agora
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-2">
              <AppIcon size={24} />
              <span className="text-base font-bold font-display">
                Pedidos Express
              </span>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <a
                href="https://wa.me/5521997624873"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white transition flex items-center gap-2 text-gray-400"
              >
                <span className="text-white">
                  <WhatsAppIcon size={16} white={true} />
                </span>
                <span>(21) 99762-4873</span>
              </a>
              <span className="text-gray-600">•</span>
              <a
                href="https://dmtn.com.br"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white transition text-gray-400"
              >
                dmtn.com.br
              </a>
            </div>
          </div>
          <div className="pt-4 border-t border-gray-800">
            <div className="text-center text-gray-500 text-xs space-y-1">
              <p>
                &copy; 2026 Pedidos Express. Todos os direitos reservados.
              </p>
              <p>
                Desenvolvido por{" "}
                <a
                  href="https://dmtn.com.br"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition font-medium"
                >
                  DMTN
                </a>
                {" - "}
                <a
                  href="https://dmtn.com.br"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition"
                >
                  DMTN DIGITAL TECNOLOGIA E SOLUCOES LTDA
                </a>
              </p>
              <p className="text-gray-600">
                CNPJ: 59.171.428/0001-40 | Rua Visconde de Pirajá, 414, sala 718, Ipanema, Rio de Janeiro - RJ
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
