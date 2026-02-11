"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { CheckCircle2, Copy, Loader2, AlertCircle } from "lucide-react";

function ConfirmacaoPagamentoPageContent() {
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

    // Função para buscar dados do pagamento
    const fetchPaymentData = () => {
      fetch(`/api/payment/status?${paymentId ? `payment_id=${paymentId}` : `subscription_id=${subscriptionId}`}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            setPaymentData(data.payment);
            // Se for PIX e não tiver QR Code ainda, tentar novamente após 3 segundos
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md">
          <div className="flex items-center gap-3 mb-4">
            <AlertCircle size={24} className="text-red-600" />
            <h2 className="text-xl font-bold text-gray-900">Erro</h2>
          </div>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => router.push("/dashboard/pagamento")}
            className="w-full bg-primary-600 text-white py-2 rounded-lg font-semibold hover:bg-primary-700 transition"
          >
            Voltar para Pagamento
          </button>
        </div>
      </div>
    );
  }

  // Pagamento com Cartão - Confirmado
  if (method === "card" && paymentData?.status === "CONFIRMED") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-8">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 size={32} className="text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Pagamento Confirmado!</h2>
            <p className="text-gray-600">
              Sua assinatura foi ativada com sucesso.
            </p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="flex justify-between mb-2">
              <span className="text-gray-600">Plano:</span>
              <span className="font-semibold text-gray-900">{paymentData.planName}</span>
            </div>
            <div className="flex justify-between mb-2">
              <span className="text-gray-600">Valor:</span>
              <span className="font-semibold text-gray-900">
                R$ {paymentData.value?.toFixed(2).replace(".", ",")}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Próximo vencimento:</span>
              <span className="font-semibold text-gray-900">
                {paymentData.nextDueDate
                  ? new Date(paymentData.nextDueDate).toLocaleDateString("pt-BR")
                  : "—"}
              </span>
            </div>
          </div>
          <button
            onClick={() => router.push("/dashboard")}
            className="w-full bg-primary-600 text-white py-3 rounded-lg font-semibold hover:bg-primary-700 transition"
          >
            Ir para Dashboard
          </button>
        </div>
      </div>
    );
  }

  // PIX - Mostrar QR Code
  if (method === "pix" && paymentData) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Pagamento via PIX</h2>
              <p className="text-gray-600">
                Escaneie o QR Code ou copie o código PIX para pagar
              </p>
            </div>

            {/* QR Code */}
            {paymentData.pixQrCodeBase64 ? (
              <div className="bg-white p-6 rounded-lg border-2 border-gray-200 mb-6 flex justify-center">
                <img
                  src={`data:image/png;base64,${paymentData.pixQrCodeBase64}`}
                  alt="QR Code PIX"
                  className="w-64 h-64"
                />
              </div>
            ) : (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-yellow-800">
                  QR Code sendo gerado... Aguarde alguns segundos e recarregue a página.
                </p>
                <button
                  onClick={() => window.location.reload()}
                  className="mt-2 text-sm text-yellow-900 underline"
                >
                  Recarregar página
                </button>
              </div>
            )}

            {/* Código PIX */}
            {(paymentData.pixCopiaECola || paymentData.pixQrCode) && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Código PIX (Copiar e Colar)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    readOnly
                    value={paymentData.pixCopiaECola || paymentData.pixQrCode || ""}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 font-mono text-sm"
                  />
                  <button
                    onClick={() => copyToClipboard(paymentData.pixCopiaECola || paymentData.pixQrCode || "")}
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition flex items-center gap-2"
                  >
                    {copied ? (
                      <>
                        <CheckCircle2 size={18} />
                        Copiado!
                      </>
                    ) : (
                      <>
                        <Copy size={18} />
                        Copiar
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Informações do Pagamento */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <div className="flex justify-between mb-2">
                <span className="text-gray-600">Valor:</span>
                <span className="font-bold text-lg text-gray-900">
                  R$ {paymentData.value?.toFixed(2).replace(".", ",")}
                </span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-gray-600">Vencimento:</span>
                <span className="font-semibold text-gray-900">
                  {paymentData.dueDate
                    ? new Date(paymentData.dueDate).toLocaleDateString("pt-BR")
                    : "—"}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-3">
                Após o pagamento, sua assinatura será ativada automaticamente.
              </p>
            </div>

            {/* Status */}
            {paymentData.status === "CONFIRMED" ? (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={20} className="text-green-600" />
                  <span className="font-semibold text-green-900">Pagamento Confirmado!</span>
                </div>
                <p className="text-sm text-green-800 mt-2">
                  Sua assinatura foi ativada com sucesso.
                </p>
              </div>
            ) : (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                <div className="flex items-center gap-2">
                  <Loader2 size={20} className="text-yellow-600 animate-spin" />
                  <span className="font-semibold text-yellow-900">Aguardando Pagamento</span>
                </div>
                <p className="text-sm text-yellow-800 mt-2">
                  Após realizar o pagamento via PIX, aguarde alguns minutos para confirmação automática.
                </p>
              </div>
            )}

            <div className="flex gap-4">
              <button
                onClick={() => router.push("/dashboard/pagamento")}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
              >
                Voltar
              </button>
              {paymentData.status === "CONFIRMED" && (
                <button
                  onClick={() => router.push("/dashboard")}
                  className="flex-1 bg-primary-600 text-white py-2 rounded-lg font-semibold hover:bg-primary-700 transition"
                >
                  Ir para Dashboard
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md">
        <p className="text-gray-600">Carregando...</p>
      </div>
    </div>
  );
}

export default function ConfirmacaoPagamentoPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 size={48} className="animate-spin text-primary-600" />
      </div>
    }>
      <ConfirmacaoPagamentoPageContent />
    </Suspense>
  );
}
