"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { CheckCircle2, Copy, Loader2, AlertCircle, ArrowRight } from "lucide-react";
import { AppIcon } from "@/components/AppIcon";

function ConfirmacaoCheckoutContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const paymentId = searchParams.get("payment_id");
  const subscriptionId = searchParams.get("subscription_id");
  const method = searchParams.get("method");

  const [loading, setLoading] = useState(true);
  const [paymentData, setPaymentData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!paymentId && !subscriptionId) {
      setError("ID de pagamento não encontrado");
      setLoading(false);
      return;
    }

    const fetchPaymentData = () => {
      fetch(`/api/payment/status?${paymentId ? `payment_id=${paymentId}` : `subscription_id=${subscriptionId}`}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            setPaymentData(data.payment);
            if (method === "pix" && !data.payment.pixQrCodeBase64 && !data.payment.pixCopiaECola) {
              setTimeout(fetchPaymentData, 3000);
            }
          } else {
            setError(data.error || "Erro ao buscar dados do pagamento");
          }
        })
        .catch((err) => {
          setError("Erro ao buscar dados do pagamento");
          console.error(err);
        })
        .finally(() => setLoading(false));
    };

    fetchPaymentData();
  }, [paymentId, subscriptionId, method]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 size={48} className="animate-spin text-primary-600 mx-auto mb-4" />
          <p className="text-gray-600">Carregando informações do pagamento...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <AlertCircle size={48} className="text-red-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Erro</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <a
            href="/vendas"
            className="inline-block bg-primary-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-700 transition"
          >
            Voltar para Planos
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-3">
            <AppIcon size={32} />
            <span className="text-xl font-black text-gray-900 font-display">
              Pedidos Express
            </span>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {method === "pix" && paymentData?.pixQrCodeBase64 ? (
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="text-center mb-6">
              <CheckCircle2 size={64} className="text-green-600 mx-auto mb-4" />
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Pagamento Pendente
              </h1>
              <p className="text-gray-600">
                Escaneie o QR Code ou copie o código PIX para finalizar o pagamento
              </p>
            </div>

            {/* QR Code */}
            <div className="bg-gray-50 rounded-lg p-6 mb-6 flex justify-center">
              <img
                src={`data:image/png;base64,${paymentData.pixQrCodeBase64}`}
                alt="QR Code PIX"
                className="max-w-xs w-full"
              />
            </div>

            {/* Código PIX Copia e Cola */}
            {paymentData.pixCopiaECola && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Código PIX (Copiar e Colar)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    readOnly
                    value={paymentData.pixCopiaECola}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm"
                  />
                  <button
                    onClick={() => copyToClipboard(paymentData.pixCopiaECola)}
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition flex items-center gap-2"
                  >
                    {copied ? <CheckCircle2 size={20} /> : <Copy size={20} />}
                    {copied ? "Copiado!" : "Copiar"}
                  </button>
                </div>
              </div>
            )}

            {/* Informações do Pagamento */}
            <div className="bg-gray-50 rounded-lg p-6 mb-6">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Valor:</span>
                  <span className="font-semibold text-gray-900">
                    R$ {paymentData?.value?.toFixed(2) || "0,00"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <span className="font-semibold text-yellow-600">Aguardando Pagamento</span>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded">
              <p className="text-sm text-blue-700">
                <strong>Importante:</strong> Após o pagamento ser confirmado, você receberá um
                e-mail com as credenciais de acesso. O processo pode levar alguns minutos.
              </p>
            </div>
          </div>
        ) : method === "credit_card" ? (
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <CheckCircle2 size={64} className="text-green-600 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Pagamento Processado!
            </h1>
            <p className="text-gray-600 mb-6">
              Seu pagamento está sendo processado. Você receberá um e-mail com as credenciais de acesso em breve.
            </p>
            <div className="bg-gray-50 rounded-lg p-6 mb-6">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Valor:</span>
                  <span className="font-semibold text-gray-900">
                    R$ {paymentData?.value?.toFixed(2) || "0,00"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <span className="font-semibold text-green-600">Processando</span>
                </div>
              </div>
            </div>
            <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded mb-6">
              <p className="text-sm text-blue-700">
                <strong>Atenção:</strong> Verifique sua caixa de entrada e spam. As credenciais serão enviadas assim que o pagamento for confirmado.
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <Loader2 size={48} className="animate-spin text-primary-600 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Processando Pagamento
            </h1>
            <p className="text-gray-600">
              Aguarde enquanto processamos suas informações...
            </p>
          </div>
        )}

        {/* Botão Voltar */}
        <div className="mt-8 text-center">
          <a
            href="/vendas"
            className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 font-medium"
          >
            <ArrowRight size={20} className="rotate-180" />
            Voltar para Planos
          </a>
        </div>
      </div>
    </div>
  );
}

export default function ConfirmacaoCheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <Loader2 size={32} className="animate-spin text-primary-600" />
        </div>
      }
    >
      <ConfirmacaoCheckoutContent />
    </Suspense>
  );
}
