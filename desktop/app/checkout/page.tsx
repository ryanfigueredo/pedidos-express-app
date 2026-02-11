"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Check, X, CreditCard, Smartphone, Loader2, AlertCircle } from "lucide-react";
import { AppIcon } from "@/components/AppIcon";
import { getPlanPricing, formatCurrency, type BillingCycle } from "@/lib/plan-pricing";

function CheckoutContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const planParam = searchParams.get("plan") || "basic";
  const cycleParam = (searchParams.get("cycle") || "monthly") as BillingCycle;
  const planType = planParam as "basic" | "complete" | "premium";
  
  const pricing = getPlanPricing(planType, cycleParam);

  const [step, setStep] = useState<"form" | "payment" | "success">("form");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentData, setPaymentData] = useState<any>(null);

  const [formData, setFormData] = useState({
    // Dados do negócio
    business_name: "",
    business_slug: "",
    business_type: "RESTAURANTE" as "RESTAURANTE" | "DENTISTA",
    
    // Dados do usuário admin
    admin_name: "",
    admin_email: "",
    admin_password: "",
    admin_password_confirm: "",
    
    // Dados para pagamento (Asaas)
    customer_name: "",
    customer_cpf_cnpj: "",
    customer_phone: "",
    customer_postal_code: "",
    customer_address: "",
    customer_address_number: "",
    customer_address_complement: "",
    customer_province: "",
    customer_city: "",
    customer_state: "",
    
    // Pagamento
    billing_cycle: cycleParam,
    payment_day: new Date().getDate().toString(), // Dia do pagamento (1-28)
    payment_method: "pix" as "pix" | "credit_card",
    installments: "1", // Parcelas (1-12, apenas para anual)
    card_number: "",
    card_name: "",
    card_expiry: "",
    card_cvv: "",
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const formatCPF = (value: string) => {
    const cleaned = value.replace(/\D/g, "");
    if (cleaned.length <= 11) {
      return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
    }
    return cleaned.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
  };

  const formatPhone = (value: string) => {
    const cleaned = value.replace(/\D/g, "");
    if (cleaned.length <= 11) {
      return cleaned.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
    }
    return cleaned;
  };

  const formatCEP = (value: string) => {
    const cleaned = value.replace(/\D/g, "");
    return cleaned.replace(/(\d{5})(\d{3})/, "$1-$2");
  };

  const handleCPFChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCPF(e.target.value);
    setFormData((prev) => ({ ...prev, customer_cpf_cnpj: formatted }));
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhone(e.target.value);
    setFormData((prev) => ({ ...prev, customer_phone: formatted }));
  };

  const handleCEPChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCEP(e.target.value);
    setFormData((prev) => ({ ...prev, customer_postal_code: formatted }));
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  };

  const handleBusinessNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    setFormData((prev) => ({
      ...prev,
      business_name: name,
      business_slug: generateSlug(name),
      customer_name: prev.customer_name || name,
    }));
  };

  const validateForm = () => {
    if (!formData.business_name || !formData.business_slug) {
      setError("Nome do negócio é obrigatório");
      return false;
    }
    if (!formData.admin_name || !formData.admin_email || !formData.admin_password) {
      setError("Dados do administrador são obrigatórios");
      return false;
    }
    if (formData.admin_password !== formData.admin_password_confirm) {
      setError("As senhas não coincidem");
      return false;
    }
    if (!formData.customer_cpf_cnpj) {
      setError("CPF/CNPJ é obrigatório para pagamento");
      return false;
    }
    if (!formData.customer_phone) {
      setError("Telefone é obrigatório");
      return false;
    }
    if (formData.payment_method === "credit_card") {
      if (!formData.card_number || !formData.card_name || !formData.card_expiry || !formData.card_cvv) {
        setError("Dados do cartão são obrigatórios");
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/public/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planType,
          billing_cycle: formData.billing_cycle,
          payment_day: formData.payment_day,
          installments: formData.installments,
          payment_method: formData.payment_method,
          cardData: formData.payment_method === "credit_card" ? {
            cardNumber: formData.card_number,
            cardName: formData.card_name,
            cardExpiry: formData.card_expiry,
            cardCvv: formData.card_cvv,
          } : undefined,
          // Dados do negócio
          business_name: formData.business_name,
          business_slug: formData.business_slug,
          business_type: formData.business_type,
          // Dados do admin
          admin_name: formData.admin_name,
          admin_email: formData.admin_email,
          admin_password: formData.admin_password,
          // Dados para pagamento
          customer_name: formData.customer_name,
          customer_cpf_cnpj: formData.customer_cpf_cnpj,
          customer_phone: formData.customer_phone,
          customer_postal_code: formData.customer_postal_code,
          customer_address: formData.customer_address,
          customer_address_number: formData.customer_address_number,
          customer_address_complement: formData.customer_address_complement,
          customer_province: formData.customer_province,
          customer_city: formData.customer_city,
          customer_state: formData.customer_state,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erro ao processar checkout");
      }

      if (data.success) {
        if (data.payment_id || data.subscription_id) {
          // Redirecionar para página de confirmação
          router.push(
            `/checkout/confirmacao?payment_id=${data.payment_id || ""}&subscription_id=${data.subscription_id || ""}&method=${formData.payment_method}`
          );
        } else {
          setError("Erro ao processar pagamento");
        }
      }
    } catch (err: any) {
      setError(err.message || "Erro ao processar checkout");
    } finally {
      setLoading(false);
    }
  };

  const selectedPlan = {
    name: pricing.planType === "basic" ? "Básico" : pricing.planType === "complete" ? "Completo" : "Premium",
    price: pricing.cycle === "yearly" ? pricing.yearlyPrice : pricing.monthlyPrice,
  };

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

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Plano Selecionado */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-1">
                Plano {selectedPlan.name} ({pricing.cycle === "yearly" ? "Anual" : "Mensal"})
              </h2>
              <p className="text-gray-600">
                {pricing.cycle === "yearly" 
                  ? `${formatCurrency(pricing.monthlyEquivalent)}/mês (${formatCurrency(pricing.yearlyPrice)}/ano)`
                  : `${formatCurrency(selectedPlan.price)}/mês`}
              </p>
              {pricing.cycle === "yearly" && pricing.discount && (
                <p className="text-sm text-green-600 font-semibold mt-1">
                  Economia de {pricing.discount}%
                </p>
              )}
            </div>
            <a
              href="/vendas"
              className="text-primary-600 hover:text-primary-700 text-sm font-medium"
            >
              Alterar plano
            </a>
          </div>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Dados do Negócio */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              Dados do Negócio
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome do Negócio *
                </label>
                <input
                  type="text"
                  name="business_name"
                  value={formData.business_name}
                  onChange={handleBusinessNameChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Ex: Tamboril Burguer"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo de Negócio *
                </label>
                <select
                  name="business_type"
                  value={formData.business_type}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="RESTAURANTE">Restaurante</option>
                  <option value="DENTISTA">Clínica Dental</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  URL do Negócio (slug)
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-gray-500">pedidos.dmtn.com.br/</span>
                  <input
                    type="text"
                    name="business_slug"
                    value={formData.business_slug}
                    onChange={handleInputChange}
                    required
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="tamboril-burguer"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Dados do Administrador */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              Dados do Administrador
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome Completo *
                </label>
                <input
                  type="text"
                  name="admin_name"
                  value={formData.admin_name}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  E-mail *
                </label>
                <input
                  type="email"
                  name="admin_email"
                  value={formData.admin_email}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Senha *
                </label>
                <input
                  type="password"
                  name="admin_password"
                  value={formData.admin_password}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Confirmar Senha *
                </label>
                <input
                  type="password"
                  name="admin_password_confirm"
                  value={formData.admin_password_confirm}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Dados para Pagamento */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              Dados para Pagamento
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome Completo / Razão Social *
                </label>
                <input
                  type="text"
                  name="customer_name"
                  value={formData.customer_name}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  CPF/CNPJ *
                </label>
                <input
                  type="text"
                  name="customer_cpf_cnpj"
                  value={formData.customer_cpf_cnpj}
                  onChange={handleCPFChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="000.000.000-00"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Telefone *
                </label>
                <input
                  type="text"
                  name="customer_phone"
                  value={formData.customer_phone}
                  onChange={handlePhoneChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="(21) 99999-9999"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  CEP *
                </label>
                <input
                  type="text"
                  name="customer_postal_code"
                  value={formData.customer_postal_code}
                  onChange={handleCEPChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="00000-000"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Endereço *
                </label>
                <input
                  type="text"
                  name="customer_address"
                  value={formData.customer_address}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Número *
                </label>
                <input
                  type="text"
                  name="customer_address_number"
                  value={formData.customer_address_number}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Complemento
                </label>
                <input
                  type="text"
                  name="customer_address_complement"
                  value={formData.customer_address_complement}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Bairro *
                </label>
                <input
                  type="text"
                  name="customer_province"
                  value={formData.customer_province}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cidade *
                </label>
                <input
                  type="text"
                  name="customer_city"
                  value={formData.customer_city}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Estado (UF) *
                </label>
                <input
                  type="text"
                  name="customer_state"
                  value={formData.customer_state}
                  onChange={handleInputChange}
                  required
                  maxLength={2}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent uppercase"
                  placeholder="RJ"
                />
              </div>
            </div>
          </div>

          {/* Configuração de Pagamento */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              Configuração de Pagamento
            </h3>
            
            {/* Ciclo de Pagamento */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ciclo de Pagamento
              </label>
              <div className="grid md:grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => {
                    setFormData((prev) => ({ ...prev, billing_cycle: "monthly", installments: "1" }));
                    router.push(`/checkout?plan=${planType}&cycle=monthly`);
                  }}
                  className={`p-4 border-2 rounded-lg text-left ${
                    formData.billing_cycle === "monthly"
                      ? "border-primary-600 bg-primary-50"
                      : "border-gray-300"
                  }`}
                >
                  <div className="font-semibold">Mensal</div>
                  <div className="text-sm text-gray-600">
                    {formatCurrency(pricing.monthlyPrice)}/mês
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setFormData((prev) => ({ ...prev, billing_cycle: "yearly" }));
                    router.push(`/checkout?plan=${planType}&cycle=yearly`);
                  }}
                  className={`p-4 border-2 rounded-lg text-left relative ${
                    formData.billing_cycle === "yearly"
                      ? "border-primary-600 bg-primary-50"
                      : "border-gray-300"
                  }`}
                >
                  <span className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-0.5 rounded-full">
                    -{pricing.discount}%
                  </span>
                  <div className="font-semibold">Anual</div>
                  <div className="text-sm text-gray-600">
                    {formatCurrency(pricing.monthlyEquivalent)}/mês
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {formatCurrency(pricing.yearlyPrice)}/ano
                  </div>
                </button>
              </div>
            </div>

            {/* Dia de Pagamento */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Dia do Pagamento (1-28) *
              </label>
              <input
                type="number"
                name="payment_day"
                value={formData.payment_day}
                onChange={handleInputChange}
                min="1"
                max="28"
                required
                className="w-full md:w-32 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Ex: 10"
              />
              <p className="text-xs text-gray-500 mt-1">
                Escolha o dia do mês em que deseja ser cobrado
              </p>
            </div>

            {/* Parcelamento (apenas para anual + cartão) */}
            {formData.billing_cycle === "yearly" && formData.payment_method === "credit_card" && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Parcelamento (até 12x) *
                </label>
                <select
                  name="installments"
                  value={formData.installments}
                  onChange={handleInputChange}
                  required
                  className="w-full md:w-48 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((num) => (
                    <option key={num} value={num.toString()}>
                      {num === 1 ? `${num}x de ${formatCurrency(pricing.yearlyPrice)} (à vista)` : `${num}x de ${formatCurrency(pricing.yearlyPrice / num)}`}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Parcelamento disponível apenas para pagamento anual no cartão. PIX paga valor cheio à vista.
                </p>
              </div>
            )}
            
            {/* Aviso PIX Anual */}
            {formData.billing_cycle === "yearly" && formData.payment_method === "pix" && (
              <div className="mb-6 bg-blue-50 border-l-4 border-blue-400 p-4 rounded">
                <p className="text-sm text-blue-700">
                  <strong>Pagamento PIX Anual:</strong> O valor total de {formatCurrency(pricing.yearlyPrice)} será cobrado à vista via PIX.
                </p>
              </div>
            )}
          </div>

          {/* Método de Pagamento */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              Método de Pagamento
            </h3>
            <div className="grid md:grid-cols-2 gap-4 mb-4">
              <button
                type="button"
                onClick={() => setFormData((prev) => ({ ...prev, payment_method: "pix" }))}
                className={`p-4 border-2 rounded-lg flex items-center gap-3 ${
                  formData.payment_method === "pix"
                    ? "border-primary-600 bg-primary-50"
                    : "border-gray-300"
                }`}
              >
                <Smartphone size={24} className={formData.payment_method === "pix" ? "text-primary-600" : "text-gray-400"} />
                <div className="text-left">
                  <div className="font-semibold">PIX</div>
                  <div className="text-sm text-gray-600">Aprovação imediata</div>
                </div>
              </button>
              <button
                type="button"
                onClick={() => setFormData((prev) => ({ ...prev, payment_method: "credit_card" }))}
                className={`p-4 border-2 rounded-lg flex items-center gap-3 ${
                  formData.payment_method === "credit_card"
                    ? "border-primary-600 bg-primary-50"
                    : "border-gray-300"
                }`}
              >
                <CreditCard size={24} className={formData.payment_method === "credit_card" ? "text-primary-600" : "text-gray-400"} />
                <div className="text-left">
                  <div className="font-semibold">Cartão de Crédito</div>
                  <div className="text-sm text-gray-600">Parcelamento disponível</div>
                </div>
              </button>
            </div>

            {formData.payment_method === "credit_card" && (
              <div className="grid md:grid-cols-2 gap-4 mt-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Número do Cartão *
                  </label>
                  <input
                    type="text"
                    name="card_number"
                    value={formData.card_number}
                    onChange={handleInputChange}
                    required={formData.payment_method === "credit_card"}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="0000 0000 0000 0000"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nome no Cartão *
                  </label>
                  <input
                    type="text"
                    name="card_name"
                    value={formData.card_name}
                    onChange={handleInputChange}
                    required={formData.payment_method === "credit_card"}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Validade *
                  </label>
                  <input
                    type="text"
                    name="card_expiry"
                    value={formData.card_expiry}
                    onChange={handleInputChange}
                    required={formData.payment_method === "credit_card"}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="MM/AA"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    CVV *
                  </label>
                  <input
                    type="text"
                    name="card_cvv"
                    value={formData.card_cvv}
                    onChange={handleInputChange}
                    required={formData.payment_method === "credit_card"}
                    maxLength={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="000"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Erro */}
          {error && (
            <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded">
              <div className="flex items-center gap-2">
                <AlertCircle size={20} className="text-red-600" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          )}

          {/* Botão Submit */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-gray-600">Total a pagar</p>
                {formData.billing_cycle === "yearly" && formData.payment_method === "credit_card" && parseInt(formData.installments) > 1 ? (
                  <>
                    <p className="text-3xl font-bold text-gray-900">
                      {formData.installments}x de {formatCurrency(pricing.yearlyPrice / parseInt(formData.installments))}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      Total: {formatCurrency(pricing.yearlyPrice)} (Economia de {pricing.discount}%)
                    </p>
                  </>
                ) : formData.billing_cycle === "yearly" && formData.payment_method === "pix" ? (
                  <>
                    <p className="text-3xl font-bold text-gray-900">
                      {formatCurrency(pricing.yearlyPrice)}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      Pagamento à vista via PIX (Economia de {pricing.discount}%)
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-3xl font-bold text-gray-900">
                      {formatCurrency(selectedPlan.price)}
                    </p>
                    {formData.billing_cycle === "yearly" && (
                      <p className="text-sm text-gray-500 mt-1">
                        Plano anual - Economia de {pricing.discount}%
                      </p>
                    )}
                  </>
                )}
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white px-6 py-4 rounded-lg font-bold text-lg shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  Processando...
                </>
              ) : (
                <>
                  Finalizar Pagamento
                </>
              )}
            </button>
            <p className="text-xs text-gray-500 text-center mt-4">
              Ao finalizar, você será redirecionado para confirmar o pagamento
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-primary-600" />
      </div>
    }>
      <CheckoutContent />
    </Suspense>
  );
}
