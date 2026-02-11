"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { CreditCard, Smartphone, CheckCircle2, Loader2, AlertCircle } from "lucide-react";
import { PLAN_PRICES } from "@/lib/asaas";

interface Plan {
  id: "basic" | "complete" | "premium";
  name: string;
  price: number;
  messages: string;
  features: string[];
}

const PLANS: Plan[] = [
  {
    id: "basic",
    name: "Básico",
    price: PLAN_PRICES.basic,
    messages: "1.000 mensagens/mês",
    features: [
      "Bot WhatsApp",
      "App Mobile",
      "Dashboard Web",
      "Impressão Bluetooth",
      "Suporte por Email",
    ],
  },
  {
    id: "complete",
    name: "Completo",
    price: PLAN_PRICES.complete,
    messages: "2.500 mensagens/mês",
    features: [
      "Bot WhatsApp",
      "App Mobile",
      "Dashboard Web",
      "500 Notas Fiscais/mês",
      "Impressão Bluetooth",
      "Suporte Prioritário",
    ],
  },
  {
    id: "premium",
    name: "Premium",
    price: PLAN_PRICES.premium,
    messages: "Mensagens ilimitadas",
    features: [
      "Bot WhatsApp",
      "App Mobile",
      "Dashboard Web",
      "1.000 Notas Fiscais/mês",
      "Impressão Bluetooth",
      "Suporte Resposta Rápida",
      "Múltiplas Filiais",
      "Relatórios Avançados",
      "Consultoria",
    ],
  },
];

export default function PagamentoPage() {
  const router = useRouter();
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<"credit_card" | "pix" | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [currentSubscription, setCurrentSubscription] = useState<any>(null);

  // Dados do cartão
  const [cardData, setCardData] = useState({
    holderName: "",
    number: "",
    expiryMonth: "",
    expiryYear: "",
    ccv: "",
  });

  useEffect(() => {
    // Buscar dados do usuário e assinatura atual
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setUser(data.user);
        }
      })
      .catch(() => {});

    fetch("/api/admin/subscription")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.subscription) {
          setCurrentSubscription(data.subscription);
        }
      })
      .catch(() => {});
  }, []);

  const handleSelectPlan = (plan: Plan) => {
    setSelectedPlan(plan);
    setPaymentMethod(null);
    setError(null);
  };

  const handlePaymentMethod = (method: "credit_card" | "pix") => {
    setPaymentMethod(method);
    setError(null);
  };

  const formatCardNumber = (value: string) => {
    const cleaned = value.replace(/\D/g, "");
    const match = cleaned.match(/.{1,4}/g);
    return match ? match.join(" ") : cleaned;
  };

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCardNumber(e.target.value);
    setCardData({ ...cardData, number: formatted.replace(/\s/g, "") });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlan || !paymentMethod) {
      setError("Selecione um plano e método de pagamento");
      return;
    }

    setLoading(true);
    setError(null);

    // Verificar se tem assinatura ativa no Asaas para decidir entre criar ou atualizar
    const hasActiveSubscription = currentSubscription?.asaasSubscriptionId;

    try {
      let response;
      
      // Se tem assinatura ativa no Asaas E está mudando de plano, usar endpoint de atualização
      if (hasActiveSubscription && currentSubscription.planType !== selectedPlan.id) {
        // Atualizar plano existente COM PAGAMENTO
        response = await fetch("/api/payment/update-plan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            planType: selectedPlan.id,
            paymentMethod,
            cardData: paymentMethod === "credit_card" ? cardData : undefined,
          }),
        });

        const data = await response.json();
        if (data.success) {
          // Se for PIX, mostrar QR Code
          if (paymentMethod === "pix" && data.pixQrCode) {
            router.push(`/dashboard/pagamento/confirmacao?payment_id=${data.paymentId}&method=pix&plan_update=true`);
            return;
          } else if (paymentMethod === "credit_card" && data.paymentId) {
            router.push(`/dashboard/pagamento/confirmacao?payment_id=${data.paymentId}&method=card&plan_update=true`);
            return;
          } else if (data.requiresPayment) {
            // Se precisa de pagamento mas não foi fornecido método
            throw new Error("Selecione um método de pagamento para atualizar o plano");
          } else {
            // Downgrade ou mesmo valor - apenas atualizado
            alert("✅ Plano atualizado com sucesso!");
            router.push("/dashboard");
            return;
          }
        } else {
          // Se não tem assinatura no Asaas, criar nova ao invés de atualizar
          if (data.shouldCreateNew || data.error?.includes("Assinatura não encontrada")) {
            console.log("[Pagamento] Assinatura não encontrada no Asaas, criando nova...");
            // Continuar para criar nova assinatura
            response = await fetch("/api/payment/checkout", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                planType: selectedPlan.id,
                paymentMethod,
                cardData: paymentMethod === "credit_card" ? cardData : undefined,
              }),
            });
          } else {
            throw new Error(data.error || "Erro ao atualizar plano");
          }
        }
      } else {
        // Criar nova assinatura (primeira vez ou sem assinatura ativa)
        response = await fetch("/api/payment/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            planType: selectedPlan.id,
            paymentMethod,
            cardData: paymentMethod === "credit_card" ? cardData : undefined,
          }),
        });
      }

      const data = await response.json();

      if (!data.success) {
        // Se faltam dados do cliente, redirecionar para perfil
        if (data.redirectTo) {
          router.push(data.redirectTo);
          return;
        }
        throw new Error(data.error || "Erro ao processar pagamento");
      }

      // Se for PIX, mostrar QR Code
      if (paymentMethod === "pix") {
        if (data.paymentId) {
          // Sempre redirecionar com payment_id quando disponível
          router.push(`/dashboard/pagamento/confirmacao?payment_id=${data.paymentId}&method=pix`);
        } else if (data.subscriptionId) {
          // Fallback: usar subscription_id se payment_id não estiver disponível
          router.push(`/dashboard/pagamento/confirmacao?subscription_id=${data.subscriptionId}&method=pix`);
        } else {
          throw new Error(data.note || "Erro ao gerar QR Code. Tente novamente.");
        }
      } else if (paymentMethod === "credit_card") {
        // Pagamento com cartão processado
        if (data.paymentId) {
          router.push(`/dashboard/pagamento/confirmacao?payment_id=${data.paymentId}&method=card`);
        } else if (data.subscriptionId) {
          router.push(`/dashboard/pagamento/confirmacao?subscription_id=${data.subscriptionId}&method=card`);
        } else {
          throw new Error("Erro ao processar pagamento com cartão");
        }
      } else {
        throw new Error("Resposta inválida do servidor");
      }
    } catch (err: any) {
      setError(err.message || "Erro ao processar pagamento. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Assinatura e Pagamento</h1>
          <p className="text-gray-600">Escolha seu plano e forma de pagamento</p>
        </div>

        {/* Assinatura Atual */}
        {currentSubscription && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={20} className="text-blue-600" />
                <span className="font-semibold text-blue-900">Assinatura Ativa</span>
              </div>
              {!selectedPlan && (
                <button
                  onClick={() => {
                    // Mostrar opção de atualizar plano
                    setSelectedPlan(null);
                    setPaymentMethod(null);
                  }}
                  className="text-sm text-blue-700 hover:text-blue-900 font-medium"
                >
                  Alterar Plano →
                </button>
              )}
            </div>
            <p className="text-sm text-blue-800">
              Plano atual: <strong>{currentSubscription.planName}</strong>
              {currentSubscription.expiresAt && (
                <> • Vence em: {new Date(currentSubscription.expiresAt).toLocaleDateString("pt-BR")}</>
              )}
            </p>
            {currentSubscription.isExpiringSoon && (
              <p className="text-xs text-amber-700 mt-2">
                ⚠️ Sua assinatura vence em breve. Renove para continuar usando o sistema.
              </p>
            )}
          </div>
        )}

        {/* Seleção de Plano */}
        {!selectedPlan ? (
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            {PLANS.map((plan) => {
              const isCurrentPlan = currentSubscription?.planType === plan.id;
              const currentPlanType = currentSubscription?.planType;
              const isUpgrade = currentSubscription && 
                (plan.id === "premium" && currentPlanType !== "premium") ||
                (plan.id === "complete" && currentPlanType === "basic");
              
              return (
                <div
                  key={plan.id}
                  onClick={() => !isCurrentPlan && handleSelectPlan(plan)}
                  className={`bg-white rounded-lg shadow-md p-6 transition-all hover:shadow-lg border-2 ${
                    isCurrentPlan
                      ? "border-green-500 bg-green-50 cursor-default"
                      : plan.id === "complete"
                      ? "border-amber-500 scale-105 cursor-pointer"
                      : "border-gray-200 hover:border-gray-300 cursor-pointer"
                  }`}
                >
                  {isCurrentPlan && (
                    <div className="bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full inline-block mb-3">
                      PLANO ATUAL
                    </div>
                  )}
                  {!isCurrentPlan && plan.id === "complete" && (
                    <div className="bg-amber-500 text-white text-xs font-bold px-3 py-1 rounded-full inline-block mb-3">
                      RECOMENDADO
                    </div>
                  )}
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                  <div className="text-3xl font-bold text-gray-900 mb-1">
                    R$ {plan.price.toFixed(2).replace(".", ",")}
                    <span className="text-base text-gray-500 font-normal">/mês</span>
                  </div>
                  <p className="text-sm text-gray-600 mb-4">{plan.messages}</p>
                  <ul className="space-y-2 mb-4">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-center gap-2 text-sm text-gray-700">
                        <CheckCircle2 size={16} className="text-green-500 flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  {isCurrentPlan ? (
                    <button 
                      disabled
                      className="w-full bg-gray-300 text-gray-600 py-2 rounded-lg font-semibold cursor-not-allowed"
                    >
                      Plano Atual
                    </button>
                  ) : (
                    <button className="w-full bg-primary-600 text-white py-2 rounded-lg font-semibold hover:bg-primary-700 transition">
                      {isUpgrade ? "Fazer Upgrade" : currentSubscription ? "Alterar Plano" : "Escolher Plano"}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-lg p-8">
            {/* Plano Selecionado */}
            <div className="mb-6 pb-6 border-b">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{selectedPlan.name}</h2>
                  <p className="text-gray-600">{selectedPlan.messages}</p>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-gray-900">
                    R$ {selectedPlan.price.toFixed(2).replace(".", ",")}
                    <span className="text-base text-gray-500 font-normal">/mês</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => {
                  setSelectedPlan(null);
                  setPaymentMethod(null);
                }}
                className="mt-4 text-sm text-gray-600 hover:text-gray-900"
              >
                ← Escolher outro plano
              </button>
            </div>

            {/* Método de Pagamento */}
            {!paymentMethod ? (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Escolha a forma de pagamento
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <button
                    onClick={() => handlePaymentMethod("credit_card")}
                    className="flex items-center gap-4 p-6 border-2 border-gray-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition"
                  >
                    <CreditCard size={32} className="text-primary-600" />
                    <div className="text-left">
                      <div className="font-semibold text-gray-900">Cartão de Crédito</div>
                      <div className="text-sm text-gray-600">Parcelamento em até 12x</div>
                    </div>
                  </button>
                  <button
                    onClick={() => handlePaymentMethod("pix")}
                    className="flex items-center gap-4 p-6 border-2 border-gray-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition"
                  >
                    <Smartphone size={32} className="text-primary-600" />
                    <div className="text-left">
                      <div className="font-semibold text-gray-900">PIX</div>
                      <div className="text-sm text-gray-600">Aprovação imediata</div>
                    </div>
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                {/* Dados do Cartão */}
                {paymentMethod === "credit_card" && (
                  <div className="space-y-4 mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Dados do Cartão
                    </h3>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nome no Cartão *
                      </label>
                      <input
                        type="text"
                        required
                        value={cardData.holderName}
                        onChange={(e) =>
                          setCardData({ ...cardData, holderName: e.target.value.toUpperCase() })
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        placeholder="NOME COMO ESTÁ NO CARTÃO"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Número do Cartão *
                      </label>
                      <input
                        type="text"
                        required
                        value={formatCardNumber(cardData.number)}
                        onChange={handleCardNumberChange}
                        maxLength={19}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        placeholder="0000 0000 0000 0000"
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Mês *
                        </label>
                        <input
                          type="text"
                          required
                          value={cardData.expiryMonth}
                          onChange={(e) =>
                            setCardData({
                              ...cardData,
                              expiryMonth: e.target.value.replace(/\D/g, "").slice(0, 2),
                            })
                          }
                          maxLength={2}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          placeholder="MM"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Ano *
                        </label>
                        <input
                          type="text"
                          required
                          value={cardData.expiryYear}
                          onChange={(e) =>
                            setCardData({
                              ...cardData,
                              expiryYear: e.target.value.replace(/\D/g, "").slice(0, 4),
                            })
                          }
                          maxLength={4}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          placeholder="AAAA"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          CVV *
                        </label>
                        <input
                          type="text"
                          required
                          value={cardData.ccv}
                          onChange={(e) =>
                            setCardData({
                              ...cardData,
                              ccv: e.target.value.replace(/\D/g, "").slice(0, 4),
                            })
                          }
                          maxLength={4}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          placeholder="123"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* PIX */}
                {paymentMethod === "pix" && (
                  <div className="mb-6">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Smartphone size={20} className="text-green-600" />
                        <span className="font-semibold text-green-900">Pagamento via PIX</span>
                      </div>
                      <p className="text-sm text-green-800">
                        Após confirmar, você receberá o QR Code e código PIX para pagamento.
                        A aprovação é imediata após o pagamento.
                      </p>
                    </div>
                  </div>
                )}

                {/* Botões */}
                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => {
                      setPaymentMethod(null);
                      setError(null);
                    }}
                    className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
                  >
                    ← Voltar
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-primary-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <Loader2 size={20} className="animate-spin" />
                        Processando...
                      </>
                    ) : (
                      <>
                        {paymentMethod === "pix" ? "Gerar QR Code PIX" : "Confirmar Pagamento"}
                      </>
                    )}
                  </button>
                </div>

                {/* Erro */}
                {error && (
                  <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-2">
                    <AlertCircle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-800">{error}</p>
                  </div>
                )}
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
