"use client";

import Link from "next/link";
import { AppIcon } from "@/components/AppIcon";
import {
  Bot,
  Smartphone,
  Printer,
  Play,
  CheckCircle2,
  ArrowRight,
  Link as LinkIcon,
  Mail,
  Globe,
} from "lucide-react";
import Lottie from "lottie-react";
import backgroundAnimation from "@/lib/background-animation.json";

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
      className="flex-shrink-0 object-contain drop-shadow-lg"
    />
  );
}

export default function HomePage() {

  return (
    <div className="min-h-screen bg-[#faf9f7] relative">
      {/* Backgrounds Dinâmicos - Gradientes Radiais nos Cantos */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-gradient-radial from-amber-200/20 via-amber-100/10 to-transparent rounded-full blur-3xl" />
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-radial from-orange-200/15 via-orange-100/8 to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[700px] h-[700px] bg-gradient-radial from-emerald-200/15 via-emerald-100/8 to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-gradient-radial from-amber-200/12 via-amber-100/6 to-transparent rounded-full blur-3xl" />
      </div>
      
      {/* Header – estilo delivery */}
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

      {/* Hero – foco restaurante, chamativo */}
      <section className="relative overflow-hidden bg-gradient-to-br from-amber-600 via-amber-500 to-orange-600">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-amber-400/30 via-transparent to-transparent" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-orange-500/20 via-transparent to-transparent" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32 z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="max-w-3xl">
              <span className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full bg-white/20 backdrop-blur-sm text-white text-sm font-bold mb-8 border border-white/30 shadow-lg relative">
                <div className="relative -ml-2">
                  <WhatsAppIcon size={32} />
                </div>
                Pedidos pelo WhatsApp
              </span>
              <h1 className="text-5xl sm:text-6xl md:text-7xl font-extrabold text-white font-display tracking-tight leading-[1.1] mb-8 drop-shadow-lg">
                Seu restaurante{" "}
                <span className="bg-gradient-to-r from-white to-amber-100 bg-clip-text text-transparent">vendendo mais</span>
                <br />
                sem fila de telefone
              </h1>
              <p className="text-xl sm:text-2xl text-amber-50 mb-10 max-w-2xl leading-relaxed font-medium">
                Cliente pede pelo WhatsApp. O bot anota, você recebe no app e na
                impressora. Lanchonete, hamburgueria ou pizzaria — tudo no mesmo
                lugar.
              </p>
              <div className="flex flex-col sm:flex-row gap-5">
                <Link
                  href="/vendas"
                  className="inline-flex items-center justify-center gap-2 bg-white hover:bg-amber-50 text-amber-600 px-10 py-5 rounded-full font-extrabold text-lg shadow-2xl hover:shadow-amber-500/50 hover:scale-105 transition-all duration-300"
                >
                  Quero vender mais
                  <ArrowRight size={22} />
                </Link>
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center bg-white/10 backdrop-blur-sm text-white px-10 py-5 rounded-full font-bold text-lg border-2 border-white/30 hover:bg-white/20 hover:border-white/50 transition-all duration-300 hover:scale-105"
                >
                  Já tenho conta
                </Link>
              </div>
              <ul className="mt-12 flex flex-wrap gap-8 text-base text-white/90 font-medium">
                <li className="flex items-center gap-3">
                  <CheckCircle2
                    size={20}
                    className="text-white flex-shrink-0 drop-shadow-lg"
                  />
                  Sem taxa de adesão
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle2
                    size={20}
                    className="text-white flex-shrink-0 drop-shadow-lg"
                  />
                  App para gestão
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle2
                    size={20}
                    className="text-white flex-shrink-0 drop-shadow-lg"
                  />
                  Impressão automática
                </li>
              </ul>
            </div>
            <div className="hidden lg:flex items-center justify-center">
              <div className="relative w-full max-w-md h-[500px]">
                {/* Animação de fundo - maior e posicionada mais acima, sobrepondo o texto */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 z-10 w-[200%] h-[200%] -mt-60">
                  <Lottie
                    animationData={backgroundAnimation}
                    loop={true}
                    autoplay={true}
                    className="w-full h-full"
                    style={{ width: "100%", height: "100%" }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Para seu restaurante – 3 pilares */}
      <section className="py-24 bg-[#faf9f7] relative z-10" style={{ clipPath: 'polygon(0 3%, 100% 0, 100% 97%, 0 100%)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 font-display tracking-tight text-center mb-6">
            Feito para seu negócio
          </h2>
          <p className="text-lg text-slate-600 text-center max-w-2xl mx-auto mb-16 font-medium">
            Do pedido no WhatsApp até a impressão na cozinha — tudo
            automatizado.
          </p>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-10 shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-[#f5f4f2] hover:shadow-[0_12px_40px_rgb(251,146,60,0.15)] hover:border-[#ebe9e5] hover:scale-[1.02] transition-all duration-300 group">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-500 flex items-center justify-center mb-6 text-white shadow-lg group-hover:scale-110 transition-transform duration-300">
                <Bot size={32} />
              </div>
              <h3 className="text-2xl font-extrabold text-gray-900 font-display tracking-tight mb-3">
                Bot no WhatsApp
              </h3>
              <p className="text-slate-600 leading-relaxed">
                Cliente manda o pedido em texto. O bot entende, confirma e envia
                direto para sua cozinha. Sem atendente 24h.
              </p>
            </div>
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-10 shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-[#f5f4f2] hover:shadow-[0_12px_40px_rgb(16,185,129,0.15)] hover:border-[#ebe9e5] hover:scale-[1.02] transition-all duration-300 group">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-500 flex items-center justify-center mb-6 text-white shadow-lg group-hover:scale-110 transition-transform duration-300">
                <Smartphone size={32} />
              </div>
              <h3 className="text-2xl font-extrabold text-gray-900 font-display tracking-tight mb-3">
                App no celular
              </h3>
              <p className="text-slate-600 leading-relaxed">
                Veja pedidos, altere cardápio e abra/feche a loja pelo app.
                Android e iOS, sempre sincronizado.
              </p>
            </div>
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-10 shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-[#f5f4f2] hover:shadow-[0_12px_40px_rgb(59,130,246,0.15)] hover:border-[#ebe9e5] hover:scale-[1.02] transition-all duration-300 group">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-400 to-blue-500 flex items-center justify-center mb-6 text-white shadow-lg group-hover:scale-110 transition-transform duration-300">
                <Printer size={32} />
              </div>
              <h3 className="text-2xl font-extrabold text-gray-900 font-display tracking-tight mb-3">
                Impressão na cozinha
              </h3>
              <p className="text-slate-600 leading-relaxed">
                Pedido chega e imprime sozinho. Bobina 58mm via Bluetooth ou
                WiFi. Zero digitação.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Benefícios com ícones */}
      <section className="py-24 bg-gradient-to-b from-[#faf9f7] to-white relative">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-amber-100/8 via-transparent to-transparent" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 font-display tracking-tight text-center mb-6">
            Por que escolher o Pedidos Express?
          </h2>
          <p className="text-lg text-slate-600 text-center max-w-2xl mx-auto mb-16 font-medium">
            Tudo que você precisa para transformar seu restaurante em uma
            máquina de vendas.
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-[#f0efed] hover:shadow-[0_12px_40px_rgb(251,146,60,0.12)] hover:scale-[1.03] transition-all duration-300 group">
              <div className="w-20 h-20 mb-5 group-hover:scale-110 transition-transform duration-300">
                <img
                  src="/icons/039-24 hours.svg"
                  alt="24 horas"
                  className="w-full h-full object-contain drop-shadow-md"
                />
              </div>
              <h3 className="text-xl font-extrabold text-gray-900 font-display tracking-tight mb-3">
                Disponível 24/7
              </h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Receba pedidos a qualquer hora, mesmo quando você está dormindo.
              </p>
            </div>
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-[#f0efed] hover:shadow-[0_12px_40px_rgb(16,185,129,0.12)] hover:scale-[1.03] transition-all duration-300 group">
              <div className="w-20 h-20 mb-5 group-hover:scale-110 transition-transform duration-300">
                <img
                  src="/icons/031-delivery time.svg"
                  alt="Entrega rápida"
                  className="w-full h-full object-contain drop-shadow-md"
                />
              </div>
              <h3 className="text-xl font-extrabold text-gray-900 font-display tracking-tight mb-3">
                Pedidos Instantâneos
              </h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Cliente pede e você recebe na hora. Sem espera, sem fila.
              </p>
            </div>
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-[#f0efed] hover:shadow-[0_12px_40px_rgb(59,130,246,0.12)] hover:scale-[1.03] transition-all duration-300 group">
              <div className="w-20 h-20 mb-5 group-hover:scale-110 transition-transform duration-300">
                <img
                  src="/icons/001-online payment.svg"
                  alt="Pagamento online"
                  className="w-full h-full object-contain drop-shadow-md"
                />
              </div>
              <h3 className="text-xl font-extrabold text-gray-900 font-display tracking-tight mb-3">
                Gestão Completa
              </h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Controle tudo pelo app: pedidos, cardápio, status e muito mais.
              </p>
            </div>
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-[#f0efed] hover:shadow-[0_12px_40px_rgb(168,85,247,0.12)] hover:scale-[1.03] transition-all duration-300 group">
              <div className="w-20 h-20 mb-5 group-hover:scale-110 transition-transform duration-300">
                <img
                  src="/icons/017-rating.svg"
                  alt="Avaliação"
                  className="w-full h-full object-contain drop-shadow-md"
                />
              </div>
              <h3 className="text-xl font-extrabold text-gray-900 font-display tracking-tight mb-3">
                Clientes Satisfeitos
              </h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Pedidos rápidos e precisos aumentam a satisfação dos clientes.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Tipos de Restaurantes */}
      <section className="py-24 bg-[#faf9f7] relative">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-emerald-100/10 via-transparent to-transparent" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 font-display tracking-tight text-center mb-6">
            Funciona para qualquer tipo de restaurante
          </h2>
          <p className="text-lg text-slate-600 text-center max-w-2xl mx-auto mb-16 font-medium">
            Do food truck à hamburgueria, do sushi ao café — adaptamos para
            você.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-8 text-center hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:scale-105 transition-all duration-300 border border-gray-100/50 group">
              <div className="w-24 h-24 mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                <img
                  src="/icons/024-pizza.svg"
                  alt="Pizzaria"
                  className="w-full h-full object-contain drop-shadow-md"
                />
              </div>
              <p className="text-sm font-bold text-gray-800">Pizzaria</p>
            </div>
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-8 text-center hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:scale-105 transition-all duration-300 border border-gray-100/50 group">
              <div className="w-24 h-24 mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                <img
                  src="/icons/007-sandwich.svg"
                  alt="Hamburgueria"
                  className="w-full h-full object-contain drop-shadow-md"
                />
              </div>
              <p className="text-sm font-bold text-gray-800">
                Hamburgueria
              </p>
            </div>
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-8 text-center hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:scale-105 transition-all duration-300 border border-gray-100/50 group">
              <div className="w-24 h-24 mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                <img
                  src="/icons/018-sushi.svg"
                  alt="Sushi"
                  className="w-full h-full object-contain drop-shadow-md"
                />
              </div>
              <p className="text-sm font-bold text-gray-800"> Oriental</p>
            </div>
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-8 text-center hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:scale-105 transition-all duration-300 border border-gray-100/50 group">
              <div className="w-24 h-24 mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                <img
                  src="/icons/012-food truck.svg"
                  alt="Food Truck"
                  className="w-full h-full object-contain drop-shadow-md"
                />
              </div>
              <p className="text-sm font-bold text-gray-800">Food Truck</p>
            </div>
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-8 text-center hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:scale-105 transition-all duration-300 border border-gray-100/50 group">
              <div className="w-24 h-24 mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                <img
                  src="/icons/035-coffee.svg"
                  alt="Café"
                  className="w-full h-full object-contain drop-shadow-md"
                />
              </div>
              <p className="text-sm font-bold text-gray-800">Café</p>
            </div>
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-8 text-center hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:scale-105 transition-all duration-300 border border-gray-100/50 group">
              <div className="w-24 h-24 mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                <img
                  src="/icons/002-restaurant.svg"
                  alt="Restaurante"
                  className="w-full h-full object-contain drop-shadow-md"
                />
              </div>
              <p className="text-sm font-bold text-gray-800">Restaurante</p>
            </div>
          </div>
        </div>
      </section>

      {/* Como funciona – 3 passos */}
      <section className="py-24 bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-amber-500/10 via-transparent to-transparent" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl md:text-5xl font-extrabold text-white font-display tracking-tight text-center mb-6 drop-shadow-lg">
            Como funciona
          </h2>
          <p className="text-xl text-gray-300 text-center max-w-xl mx-auto mb-16 font-medium">
            Em 3 passos seu restaurante começa a receber pedidos pelo WhatsApp.
          </p>
          <div className="grid md:grid-cols-3 gap-12">
            <div className="text-center relative group">
              <div className="w-32 h-32 mx-auto mb-8 relative">
                <div className="absolute inset-0 flex items-center justify-center">
                  <img
                    src="/icons/006-phone.svg"
                    alt="WhatsApp"
                    className="w-full h-full object-contain opacity-10 group-hover:opacity-20 transition-opacity duration-300"
                  />
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-500 to-amber-600 text-white flex items-center justify-center text-3xl font-extrabold shadow-2xl group-hover:scale-110 transition-transform duration-300 ring-4 ring-amber-500/30">
                    1
                  </div>
                </div>
              </div>
              <h3 className="text-2xl font-extrabold text-white font-display tracking-tight mb-4">
                Cliente pede no WhatsApp
              </h3>
              <p className="text-gray-300 text-base leading-relaxed">
                Seu cliente manda o pedido em texto. O bot confirma itens e
                valor.
              </p>
            </div>
            <div className="text-center relative group">
              <div className="w-32 h-32 mx-auto mb-8 relative">
                <div className="absolute inset-0 flex items-center justify-center">
                  <img
                    src="/icons/045-food app.svg"
                    alt="App"
                    className="w-full h-full object-contain opacity-10 group-hover:opacity-20 transition-opacity duration-300"
                  />
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-500 to-amber-600 text-white flex items-center justify-center text-3xl font-extrabold shadow-2xl group-hover:scale-110 transition-transform duration-300 ring-4 ring-amber-500/30">
                    2
                  </div>
                </div>
              </div>
              <h3 className="text-2xl font-extrabold text-white font-display tracking-tight mb-4">
                Você recebe no app
              </h3>
              <p className="text-gray-300 text-base leading-relaxed">
                O pedido aparece no seu celular e no painel web. Você acompanha
                tudo em tempo real.
              </p>
            </div>
            <div className="text-center relative group">
              <div className="w-32 h-32 mx-auto mb-8 relative">
                <div className="absolute inset-0 flex items-center justify-center">
                  <img
                    src="/icons/019-delivery.svg"
                    alt="Entrega"
                    className="w-full h-full object-contain opacity-10 group-hover:opacity-20 transition-opacity duration-300"
                  />
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-500 to-amber-600 text-white flex items-center justify-center text-3xl font-extrabold shadow-2xl group-hover:scale-110 transition-transform duration-300 ring-4 ring-amber-500/30">
                    3
                  </div>
                </div>
              </div>
              <h3 className="text-2xl font-extrabold text-white font-display tracking-tight mb-4">
                Imprime na cozinha
              </h3>
              <p className="text-gray-300 text-base leading-relaxed">
                A comanda sai na impressora térmica. Cozinha prepara e você
                entrega ou retira.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Recursos Adicionais */}
      <section className="py-24 bg-gradient-to-b from-white to-[#faf9f7] relative">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] from-amber-100/8 via-transparent to-transparent" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 font-display tracking-tight text-center mb-6">
            Recursos que fazem a diferença
          </h2>
          <p className="text-lg text-slate-600 text-center max-w-2xl mx-auto mb-16 font-medium">
            Funcionalidades pensadas para facilitar seu dia a dia.
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-[#f0efed] hover:shadow-[0_12px_40px_rgb(0,0,0,0.1)] hover:scale-[1.02] transition-all duration-300 group">
              <div className="w-20 h-20 mb-5 group-hover:scale-110 transition-transform duration-300">
                <img
                  src="/icons/003-online menu.svg"
                  alt="Cardápio online"
                  className="w-full h-full object-contain drop-shadow-md"
                />
              </div>
              <h3 className="text-xl font-extrabold text-gray-900 font-display tracking-tight mb-3">
                Cardápio Digital
              </h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Atualize preços e disponibilidade em tempo real. Cliente sempre
                vê o que está disponível.
              </p>
            </div>
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-[#f0efed] hover:shadow-[0_12px_40px_rgb(0,0,0,0.1)] hover:scale-[1.02] transition-all duration-300 group">
              <div className="w-20 h-20 mb-5 group-hover:scale-110 transition-transform duration-300">
                <img
                  src="/icons/038-order.svg"
                  alt="Pedidos"
                  className="w-full h-full object-contain drop-shadow-md"
                />
              </div>
              <h3 className="text-xl font-extrabold text-gray-900 font-display tracking-tight mb-3">
                Gestão de Pedidos
              </h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Organize pedidos por status, visualize histórico e acompanhe
                entregas em tempo real.
              </p>
            </div>
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-[#f0efed] hover:shadow-[0_12px_40px_rgb(0,0,0,0.1)] hover:scale-[1.02] transition-all duration-300 group">
              <div className="w-20 h-20 mb-5 group-hover:scale-110 transition-transform duration-300">
                <img
                  src="/icons/046-feedback.svg"
                  alt="Feedback"
                  className="w-full h-full object-contain drop-shadow-md"
                />
              </div>
              <h3 className="text-xl font-extrabold text-gray-900 font-display tracking-tight mb-3">
                Atendimento Integrado
              </h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Responda clientes direto pelo app. Todas as conversas em um só
                lugar.
              </p>
            </div>
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-[#f0efed] hover:shadow-[0_12px_40px_rgb(0,0,0,0.1)] hover:scale-[1.02] transition-all duration-300 group">
              <div className="w-20 h-20 mb-5 group-hover:scale-110 transition-transform duration-300">
                <img
                  src="/icons/029-packaging.svg"
                  alt="Embalagem"
                  className="w-full h-full object-contain drop-shadow-md"
                />
              </div>
              <h3 className="text-xl font-extrabold text-gray-900 font-display tracking-tight mb-3">
                Controle de Estoque
              </h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Acompanhe itens mais vendidos e gerencie seu estoque de forma
                inteligente.
              </p>
            </div>
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-[#f0efed] hover:shadow-[0_12px_40px_rgb(0,0,0,0.1)] hover:scale-[1.02] transition-all duration-300 group">
              <div className="w-20 h-20 mb-5 group-hover:scale-110 transition-transform duration-300">
                <img
                  src="/icons/027-discount.svg"
                  alt="Desconto"
                  className="w-full h-full object-contain drop-shadow-md"
                />
              </div>
              <h3 className="text-xl font-extrabold text-gray-900 font-display tracking-tight mb-3">
                Promoções e Descontos
              </h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Crie promoções e cupons de desconto para aumentar suas vendas.
              </p>
            </div>
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-[#f0efed] hover:shadow-[0_12px_40px_rgb(0,0,0,0.1)] hover:scale-[1.02] transition-all duration-300 group">
              <div className="w-20 h-20 mb-5 group-hover:scale-110 transition-transform duration-300">
                <img
                  src="/icons/020-take away.svg"
                  alt="Retirada"
                  className="w-full h-full object-contain drop-shadow-md"
                />
              </div>
              <h3 className="text-xl font-extrabold text-gray-900 font-display tracking-tight mb-3">
                Delivery e Retirada
              </h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Gerencie entregas e retiradas no balcão. Tudo organizado e
                rastreável.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Vídeos */}
      <section className="py-24 bg-[#faf9f7] relative">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-orange-100/6 via-transparent to-transparent" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 font-display tracking-tight text-center mb-6">
            Veja na prática
          </h2>
          <p className="text-lg text-slate-600 text-center max-w-2xl mx-auto mb-16 font-medium">
            Assista ao sistema em ação: pedidos pelo WhatsApp, app e impressão.
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="aspect-video bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl overflow-hidden border border-[#e5e4e2] flex items-center justify-center shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-300 group cursor-pointer">
              <div className="text-center p-8">
                <div className="w-16 h-16 mx-auto mb-4 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <Play size={32} className="text-amber-600 ml-1" />
                </div>
                <p className="text-base font-bold text-gray-800">Vídeo 1</p>
                <p className="text-sm text-gray-600 mt-2 font-medium">
                  Bot WhatsApp / Pedidos
                </p>
              </div>
            </div>
            <div className="aspect-video bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl overflow-hidden border border-[#e5e4e2] flex items-center justify-center shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-300 group cursor-pointer">
              <div className="text-center p-8">
                <div className="w-16 h-16 mx-auto mb-4 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <Play size={32} className="text-amber-600 ml-1" />
                </div>
                <p className="text-base font-bold text-gray-800">Vídeo 2</p>
                <p className="text-sm text-gray-600 mt-2 font-medium">App Mobile</p>
              </div>
            </div>
            <div className="aspect-video bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl overflow-hidden border border-gray-200/50 flex items-center justify-center shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-300 group cursor-pointer md:col-span-2 lg:col-span-1">
              <div className="text-center p-8">
                <div className="w-16 h-16 mx-auto mb-4 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <Play size={32} className="text-amber-600 ml-1" />
                </div>
                <p className="text-base font-bold text-gray-800">Vídeo 3</p>
                <p className="text-sm text-gray-600 mt-2 font-medium">Impressão</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Números */}
      <section className="py-20 bg-gradient-to-r from-amber-500 via-amber-600 to-orange-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div className="group">
              <div className="text-5xl md:text-6xl font-black text-white font-display tracking-tight mb-2 drop-shadow-lg group-hover:scale-110 transition-transform duration-300">
                3x
              </div>
              <div className="text-amber-100 text-base font-semibold">mais pedidos</div>
            </div>
            <div className="group">
              <div className="text-5xl md:text-6xl font-black text-white font-display tracking-tight mb-2 drop-shadow-lg group-hover:scale-110 transition-transform duration-300">
                24/7
              </div>
              <div className="text-amber-100 text-base font-semibold">disponível</div>
            </div>
            <div className="group">
              <div className="text-5xl md:text-6xl font-black text-white font-display tracking-tight mb-2 drop-shadow-lg group-hover:scale-110 transition-transform duration-300">
                100%
              </div>
              <div className="text-amber-100 text-base font-semibold">automático</div>
            </div>
            <div className="group">
              <div className="text-5xl md:text-6xl font-black text-white font-display tracking-tight mb-2 drop-shadow-lg group-hover:scale-110 transition-transform duration-300">
                R$ 0
              </div>
              <div className="text-amber-100 text-base font-semibold">adesão</div>
            </div>
          </div>
        </div>
      </section>

      {/* Seção CTA - Contato */}
      <section className="py-24 bg-[#faf9f7] relative">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_center,_var(--tw-gradient-stops))] from-amber-200/12 via-transparent to-transparent" />
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-[0_20px_60px_rgb(0,0,0,0.1)] p-10 md:p-14 text-center border border-[#f0efed]">
            <div className="max-w-3xl mx-auto">
              <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 font-display tracking-tight mb-6">
                Quer aumentar suas vendas?
              </h2>
              <p className="text-xl text-slate-600 mb-10 font-medium leading-relaxed">
                Fale com nosso time e descubra como podemos ajudar seu
                restaurante a vender mais pelo WhatsApp.
              </p>
              <div className="flex flex-col sm:flex-row gap-5 justify-center">
                <Link
                  href="/vendas"
                  className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white px-10 py-5 rounded-full font-extrabold text-lg shadow-2xl hover:shadow-amber-500/50 hover:scale-105 transition-all duration-300"
                >
                  Ver planos e preços
                  <ArrowRight size={22} />
                </Link>
                <a
                  href="https://wa.me/5521997624873"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white px-10 py-5 rounded-full font-extrabold text-lg shadow-2xl hover:shadow-emerald-500/50 hover:scale-105 transition-all duration-300"
                >
                  <WhatsAppIcon size={22} />
                  Falar no WhatsApp
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA final */}
      <section className="py-24 bg-gradient-to-br from-amber-600 via-amber-500 to-orange-600 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white/10 via-transparent to-transparent" />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-5xl font-extrabold text-white font-display tracking-tight mb-6 drop-shadow-lg">
            Pronto para receber pedidos pelo WhatsApp?
          </h2>
          <p className="text-xl text-amber-50 mb-10 font-medium">
            Comece hoje. Sem taxa de adesão. Configure em minutos.
          </p>
          <Link
            href="/vendas"
            className="inline-flex items-center justify-center gap-2 bg-white hover:bg-amber-50 text-amber-600 px-12 py-6 rounded-full font-extrabold text-lg shadow-2xl hover:shadow-white/50 hover:scale-105 transition-all duration-300"
          >
            Ver planos e preços
            <ArrowRight size={22} />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="md:col-span-2">
              <div className="flex items-center gap-2 mb-3">
                <AppIcon size={28} />
                <span className="text-lg font-black font-display tracking-tight">
                  Pedidos Express
                </span>
              </div>
              <p className="text-gray-400 text-sm max-w-sm leading-relaxed">
                Sistema de pedidos e delivery via WhatsApp para restaurantes,
                lanchonetes e hamburgerias.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-sm mb-3 text-gray-200">Links</h3>
              <ul className="space-y-2">
                <li>
                  <Link href="/vendas" className="hover:text-white transition flex items-center gap-2 text-gray-400 text-sm">
                    <LinkIcon size={14} className="text-white" />
                    Planos
                  </Link>
                </li>
                <li>
                  <Link href="/login" className="hover:text-white transition flex items-center gap-2 text-gray-400 text-sm">
                    <LinkIcon size={14} className="text-white" />
                    Login
                  </Link>
                </li>
                <li>
                  <Link href="/suporte" className="hover:text-white transition flex items-center gap-2 text-gray-400 text-sm">
                    <LinkIcon size={14} className="text-white" />
                    Suporte
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-sm mb-3 text-gray-200">Contato</h3>
              <div className="space-y-2">
                <a
                  href="https://wa.me/5521997624873"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition flex items-center gap-2 text-gray-400 text-sm"
                >
                  <span className="text-white">
                    <WhatsAppIcon size={16} white={true} />
                  </span>
                  <span>(21) 99762-4873</span>
                </a>
                <a
                  href="https://dmtn.com.br"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition flex items-center gap-2 text-gray-400 text-sm"
                >
                  <Globe size={14} className="text-white" />
                  <span>dmtn.com.br</span>
                </a>
              </div>
            </div>
          </div>
          <div className="mt-8 pt-6 border-t border-gray-800">
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
