"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { CheckCircle2, Wifi, WifiOff, Settings, Copy, ArrowLeft, Plus, X } from "lucide-react";

interface Tenant {
  id: string;
  name: string;
  slug: string;
  is_active: boolean;
  business_type?: string;
  show_prices_on_bot?: boolean;
  created_at: string;
  whatsapp_phone?: string | null;
  bot_configured?: boolean | null;
  bot_last_heartbeat?: string | null;
  plan_type?: string;
  subscription_payment_date?: string | null;
  subscription_expires_at?: string | null;
  subscription_status?: string | null;
  _count?: {
    orders: number;
    users: number;
  };
}

interface BotStatus {
  tenant_id: string;
  tenant_name: string;
  is_online: boolean;
  last_heartbeat?: string;
  total_orders_today: number;
  total_orders_month: number;
}

interface User {
  id: string;
  username: string;
  name: string;
  role: string;
  tenant_id: string;
}

export default function ClientesPage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [botStatuses, setBotStatuses] = useState<BotStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showUserForm, setShowUserForm] = useState<string | null>(null);
  const [showWhatsAppForm, setShowWhatsAppForm] = useState<string | null>(null);
  const [createdTenant, setCreatedTenant] = useState<{
    name: string;
    slug: string;
    api_key: string;
  } | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    business_type: "RESTAURANTE" as "RESTAURANTE" | "DENTISTA" | "BARBEIRO",
    show_prices_on_bot: true,
    plan_type: "basic" as "basic" | "complete" | "premium",
    username: "",
    password: "",
    userName: "",
    whatsapp_phone: "",
    meta_phone_number_id: "",
    meta_access_token: "",
    meta_verify_token: "",
    meta_business_account_id: "",
    desktop_api_url: "",
    configureDynamoDB: false,
  });

  useEffect(() => {
    loadData();
    // Atualizar a cada 30 segundos
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      // Carregar tenants
      const res = await fetch("/api/admin/tenants");
      const data = await res.json();
      if (data.success) {
        setTenants(data.tenants || []);
      }

      // Carregar status dos bots
      const botsRes = await fetch("/api/admin/bot-status");
      const botsData = await botsRes.json();
      if (botsData.success) {
        setBotStatuses(botsData.bots || []);
      }
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/admin/tenants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          slug: formData.slug,
          business_type: formData.business_type,
          show_prices_on_bot: formData.show_prices_on_bot,
          plan_type: formData.plan_type,
          createUser: showUserForm !== null,
          username: showUserForm ? formData.username : undefined,
          password: showUserForm ? formData.password : undefined,
          userName: showUserForm ? formData.userName : undefined,
        }),
      });

      const data = await res.json();
      if (!data.success) {
        alert(`❌ Erro ao criar tenant: ${data.error}`);
        return;
      }

      const tenant = data.tenant;

      // Se configurar DynamoDB foi marcado, criar registro lá também
      if (formData.configureDynamoDB && formData.meta_phone_number_id && formData.meta_access_token) {
        try {
          const dynamoRes = await fetch(`/api/admin/tenants/${tenant.id}/dynamodb`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              phone_number_id: formData.meta_phone_number_id,
              business_account_id: formData.meta_business_account_id || undefined,
              token_api_meta: formData.meta_access_token,
              meta_verify_token: formData.meta_verify_token || undefined,
              desktop_api_url: formData.desktop_api_url || undefined,
            }),
          });

          const dynamoData = await dynamoRes.json();
          if (!dynamoData.success) {
            alert(`⚠️ Tenant criado, mas erro ao configurar DynamoDB: ${dynamoData.error}`);
          }
        } catch (dynamoError) {
          console.error("Erro ao configurar DynamoDB:", dynamoError);
          alert("⚠️ Tenant criado, mas erro ao configurar DynamoDB");
        }
      }

      setCreatedTenant(tenant);
      setShowCreateForm(false);
      setShowUserForm(null);
      setFormData({
        name: "",
        slug: "",
        business_type: "RESTAURANTE",
        show_prices_on_bot: true,
        plan_type: "basic",
        username: "",
        password: "",
        userName: "",
        whatsapp_phone: "",
        meta_phone_number_id: "",
        meta_access_token: "",
        meta_verify_token: "",
        meta_business_account_id: "",
        desktop_api_url: "",
        configureDynamoDB: false,
      });
      loadData();
    } catch (error) {
      console.error("Erro ao criar tenant:", error);
      alert("❌ Erro ao criar restaurante");
    }
  };

  const handleCreateUser = async (tenantId: string) => {
    if (!formData.username || !formData.password) {
      alert("Preencha email e senha");
      return;
    }

    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenant_id: tenantId,
          username: formData.username,
          password: formData.password,
          name: formData.userName || formData.username,
        }),
      });

      const data = await res.json();
      if (data.success) {
        alert("Usuário criado com sucesso!");
        setShowUserForm(null);
        setFormData({
          name: "",
          slug: "",
          business_type: "RESTAURANTE",
          show_prices_on_bot: true,
          plan_type: "basic",
          username: "",
          password: "",
          userName: "",
          whatsapp_phone: "",
          meta_phone_number_id: "",
          meta_access_token: "",
          meta_verify_token: "",
          meta_business_account_id: "",
          desktop_api_url: "",
          configureDynamoDB: false,
        });
        loadData();
      } else {
        alert(`❌ Erro: ${data.error}`);
      }
    } catch (error) {
      console.error("Erro ao criar usuário:", error);
      alert("❌ Erro ao criar usuário");
    }
  };

  const toggleTenantStatus = async (
    tenantId: string,
    currentStatus: boolean
  ) => {
    try {
      const res = await fetch(`/api/admin/tenants/${tenantId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !currentStatus }),
      });

      const data = await res.json();
      if (data.success) {
        loadData();
      } else {
        alert(`❌ Erro: ${data.error}`);
      }
    } catch (error) {
      console.error("Erro ao atualizar tenant:", error);
      alert("❌ Erro ao atualizar restaurante");
    }
  };

  const handleSaveWhatsAppConfig = async (tenantId: string) => {
    if (!formData.whatsapp_phone || !formData.meta_phone_number_id || !formData.meta_access_token) {
      alert("Preencha pelo menos: Telefone, Phone Number ID e Access Token");
      return;
    }

    try {
      const res = await fetch(`/api/admin/tenants/${tenantId}/whatsapp`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          whatsapp_phone: formData.whatsapp_phone,
          meta_phone_number_id: formData.meta_phone_number_id,
          meta_access_token: formData.meta_access_token,
          meta_verify_token: formData.meta_verify_token || undefined,
        }),
      });

      const data = await res.json();
      if (data.success) {
        alert("✅ Configuração do WhatsApp salva com sucesso!");
        setShowWhatsAppForm(null);
        setFormData({
          name: "",
          slug: "",
          business_type: "RESTAURANTE",
          show_prices_on_bot: true,
          plan_type: "basic",
          username: "",
          password: "",
          userName: "",
          whatsapp_phone: "",
          meta_phone_number_id: "",
          meta_access_token: "",
          meta_verify_token: "",
          meta_business_account_id: "",
          desktop_api_url: "",
          configureDynamoDB: false,
        });
        loadData();
      } else {
        alert(`❌ Erro: ${data.error}`);
      }
    } catch (error) {
      console.error("Erro ao salvar configuração WhatsApp:", error);
      alert("❌ Erro ao salvar configuração");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <Link 
                  href="/admin"
                  className="inline-flex items-center justify-center w-9 h-9 rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-colors"
                  title="Voltar para Dashboard Master"
                >
                  <ArrowLeft size={18} />
                </Link>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 font-display">
                    Gerenciar Clientes
                  </h1>
                </div>
              </div>
              <p className="text-sm text-gray-500 ml-12">
                Criar e gerenciar clientes do sistema (Restaurantes e Clínicas)
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowCreateForm(!showCreateForm)}
                className="inline-flex items-center gap-2 bg-primary-600 text-white px-4 py-2.5 rounded-lg font-semibold hover:bg-primary-700 transition-colors shadow-sm hover:shadow-md"
              >
                <Plus size={18} />
                {showCreateForm ? "Cancelar" : "Novo Cliente"}
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Alert de Sucesso com API Key */}
        {createdTenant && (
          <div className="bg-green-50 border-2 border-green-200 rounded-lg p-6 mb-8">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h3 className="text-lg font-bold text-green-900 mb-2 flex items-center gap-2">
                  <CheckCircle2
                    size={22}
                    className="text-green-600 flex-shrink-0"
                  />
                  Cliente criado com sucesso!
                </h3>
                <div className="space-y-2 text-sm">
                  <p>
                    <strong>Nome:</strong> {createdTenant.name}
                  </p>
                  <p>
                    <strong>Slug:</strong> {createdTenant.slug}
                  </p>
                  <div className="bg-white p-3 rounded border border-green-300 mt-3">
                    <p className="font-semibold text-green-900 mb-1">
                      API Key (IMPORTANTE):
                    </p>
                    <code className="text-xs break-all text-gray-800 block">
                      {createdTenant.api_key}
                    </code>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(createdTenant.api_key);
                        alert("API Key copiada!");
                      }}
                      className="mt-2 text-xs bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
                    >
                      Copiar API Key
                    </button>
                  </div>
                  <p className="text-green-800 mt-3">
                    ⚠️ <strong>Salve esta API Key!</strong> Ela será necessária
                    para configurar o bot WhatsApp.
                  </p>
                  <div className="bg-blue-50 p-3 rounded mt-3">
                    <p className="text-sm text-blue-900">
                      <strong>Configuração do Bot WhatsApp:</strong>
                      <br />
                      No Railway/Render, adicione as variáveis:
                      <br />
                      <code className="text-xs block mt-1">
                        TENANT_ID={createdTenant.slug}
                      </code>
                      <code className="text-xs block">
                        TENANT_API_KEY={createdTenant.api_key}
                      </code>
                    </p>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setCreatedTenant(null)}
                className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                aria-label="Fechar"
              >
                <X size={18} />
              </button>
            </div>
          </div>
        )}

        {/* Formulário de Criação */}
        {showCreateForm && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4 font-display">
              Criar Novo Cliente
            </h2>
            <form onSubmit={handleCreateTenant} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nome do Cliente *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder={formData.business_type === "DENTISTA" ? "Ex: Clínica Dental XYZ" : formData.business_type === "BARBEIRO" ? "Ex: Barbearia do João" : "Ex: Pizzaria do João"}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Slug (identificador único) *
                </label>
                <input
                  type="text"
                  required
                  value={formData.slug}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      slug: e.target.value
                        .toLowerCase()
                        .replace(/[^a-z0-9-]/g, "-"),
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder={formData.business_type === "DENTISTA" ? "Ex: clinica-dental-xyz" : formData.business_type === "BARBEIRO" ? "Ex: barbearia-do-joao" : "Ex: pizzaria-do-joao"}
                />
                <p className="mt-1 text-sm text-gray-500">
                  Apenas letras minúsculas, números e hífens
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de Negócio *
                </label>
                <select
                  required
                  value={formData.business_type}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      business_type: e.target.value as "RESTAURANTE" | "DENTISTA" | "BARBEIRO",
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="RESTAURANTE">Restaurante</option>
                  <option value="DENTISTA">Dentista</option>
                  <option value="BARBEIRO">Barbeiro</option>
                </select>
                <p className="mt-1 text-sm text-gray-500">
                  Define o tipo de negócio e adapta a interface automaticamente
                </p>
              </div>

              {formData.business_type === "DENTISTA" && (
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="show_prices_on_bot"
                    checked={formData.show_prices_on_bot}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        show_prices_on_bot: e.target.checked,
                      })
                    }
                    className="mr-2"
                  />
                  <label
                    htmlFor="show_prices_on_bot"
                    className="text-sm text-gray-700"
                  >
                    Exibir preços no bot WhatsApp
                  </label>
                  <p className="ml-2 text-xs text-gray-500">
                    (Se desmarcado, o bot informará que valores dependem de avaliação clínica)
                  </p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Plano *
                </label>
                <select
                  required
                  value={formData.plan_type}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      plan_type: e.target.value as "basic" | "complete" | "premium",
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="basic">Básico (1.000 mensagens/mês)</option>
                  <option value="complete">Completo (5.000 mensagens/mês)</option>
                  <option value="premium">Premium (Ilimitado)</option>
                </select>
                <p className="mt-1 text-sm text-gray-500">
                  Define o limite de mensagens e recursos disponíveis
                </p>
              </div>

              <div className="border-t pt-4 mt-4">
                <div className="flex items-center mb-4">
                  <input
                    type="checkbox"
                    id="configureDynamoDB"
                    checked={formData.configureDynamoDB}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        configureDynamoDB: e.target.checked,
                      })
                    }
                    className="mr-2"
                  />
                  <label htmlFor="configureDynamoDB" className="text-sm font-medium text-gray-700">
                    Configurar Bot WhatsApp (DynamoDB)
                  </label>
                </div>

                {formData.configureDynamoDB && (
                  <div className="bg-blue-50 p-4 rounded-lg space-y-4">
                    <h3 className="font-semibold text-gray-900">
                      Credenciais Meta (WhatsApp Business API)
                    </h3>
                    <p className="text-xs text-gray-600 mb-4">
                      Configure as credenciais do Meta para o número de telefone deste cliente.
                      Essas informações serão salvas no DynamoDB para o bot funcionar.
                    </p>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Phone Number ID (Meta) *
                      </label>
                      <input
                        type="text"
                        required={formData.configureDynamoDB}
                        value={formData.meta_phone_number_id}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            meta_phone_number_id: e.target.value,
                          })
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        placeholder="123456789012345"
                      />
                      <p className="mt-1 text-xs text-gray-500">
                        Phone Number ID do número de telefone do cliente no Meta
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Access Token (Meta) *
                      </label>
                      <input
                        type="text"
                        required={formData.configureDynamoDB}
                        value={formData.meta_access_token}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            meta_access_token: e.target.value,
                          })
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        placeholder="EAAxxxxxxxxxxxxx"
                      />
                      <p className="mt-1 text-xs text-gray-500">
                        Access Token do Meta (pode ser da sua conta Meta)
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Business Account ID (WABA ID) - Opcional
                      </label>
                      <input
                        type="text"
                        value={formData.meta_business_account_id}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            meta_business_account_id: e.target.value,
                          })
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        placeholder="987654321098765"
                      />
                      <p className="mt-1 text-xs text-gray-500">
                        WhatsApp Business Account ID (opcional, mas recomendado)
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Verify Token - Opcional
                      </label>
                      <input
                        type="text"
                        value={formData.meta_verify_token}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            meta_verify_token: e.target.value,
                          })
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        placeholder="seu-verify-token"
                      />
                      <p className="mt-1 text-xs text-gray-500">
                        Token para verificação do webhook (opcional)
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Desktop API URL - Opcional
                      </label>
                      <input
                        type="text"
                        value={formData.desktop_api_url}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            desktop_api_url: e.target.value,
                          })
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        placeholder="https://seu-dominio.vercel.app"
                      />
                      <p className="mt-1 text-xs text-gray-500">
                        URL da API (deixe vazio para usar padrão)
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="createUser"
                  checked={showUserForm !== null}
                  onChange={(e) =>
                    setShowUserForm(e.target.checked ? "new" : null)
                  }
                  className="mr-2"
                />
                <label htmlFor="createUser" className="text-sm text-gray-700">
                  Criar usuário admin agora
                </label>
              </div>

              {showUserForm && (
                <div className="bg-gray-50 p-4 rounded-lg space-y-4">
                  <h3 className="font-semibold text-gray-900">
                    Dados do Usuário Admin
                  </h3>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email (username) *
                    </label>
                    <input
                      type="email"
                      required={showUserForm !== null}
                      value={formData.username}
                      onChange={(e) =>
                        setFormData({ ...formData, username: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="admin@pizzaria.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Senha *
                    </label>
                    <input
                      type="password"
                      required={showUserForm !== null}
                      value={formData.password}
                      onChange={(e) =>
                        setFormData({ ...formData, password: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="Senha inicial"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nome do Usuário
                    </label>
                    <input
                      type="text"
                      value={formData.userName}
                      onChange={(e) =>
                        setFormData({ ...formData, userName: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="Ex: João Admin"
                    />
                  </div>
                </div>
              )}

              <div className="flex gap-4">
                <button
                  type="submit"
                  className="bg-primary-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-primary-700 transition"
                >
                  Criar Cliente
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateForm(false);
                    setShowUserForm(null);
                    setFormData({
                      name: "",
                      slug: "",
                      business_type: "RESTAURANTE",
                      show_prices_on_bot: true,
                      plan_type: "basic",
                      username: "",
                      password: "",
                      userName: "",
                      whatsapp_phone: "",
                      meta_phone_number_id: "",
                      meta_access_token: "",
                      meta_verify_token: "",
                      meta_business_account_id: "",
                      desktop_api_url: "",
                      configureDynamoDB: false,
                    });
                  }}
                  className="bg-gray-200 text-gray-800 px-6 py-2 rounded-lg font-semibold hover:bg-gray-300 transition"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Lista de Clientes */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            <p className="mt-4 text-gray-600">Carregando...</p>
          </div>
        ) : (
          <>
            {/* Seção de Restaurantes */}
            {tenants.filter(t => !t.business_type || t.business_type === "RESTAURANTE").length > 0 && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
                <div className="px-6 py-4 border-b bg-gradient-to-r from-orange-50 to-orange-100/50">
                  <h2 className="text-xl font-bold text-gray-900 font-display flex items-center gap-2">
                    <span className="text-2xl">🍔</span> 
                    <span>Restaurantes</span>
                    <span className="ml-2 px-2.5 py-0.5 bg-orange-200 text-orange-800 text-sm font-semibold rounded-full">
                      {tenants.filter(t => !t.business_type || t.business_type === "RESTAURANTE").length}
                    </span>
                  </h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Nome
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Slug
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Bot WhatsApp
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Plano
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Último Pagamento
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Pedidos
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Usuários
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Criado em
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Ações
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {tenants.filter(t => !t.business_type || t.business_type === "RESTAURANTE").map((tenant) => {
                    const botStatus = botStatuses.find(b => b.tenant_id === tenant.id);
                    const isBotOnline = botStatus?.is_online || false;
                    return (
                      <tr key={tenant.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                          {tenant.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                          <code className="text-xs bg-gray-100 px-2 py-1 rounded">{tenant.slug}</code>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={() =>
                              toggleTenantStatus(tenant.id, tenant.is_active)
                            }
                            className={`px-2 py-1 rounded-full text-xs font-semibold ${
                              tenant.is_active
                                ? "bg-amber-100 text-amber-700"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {tenant.is_active ? "Ativo" : "Inativo"}
                          </button>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-col gap-1">
                            {tenant.bot_configured ? (
                              <>
                                <div className="flex items-center gap-2">
                                  <div className={`w-2 h-2 rounded-full ${isBotOnline ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                                  <span className={`text-xs font-medium ${isBotOnline ? 'text-green-600' : 'text-red-600'}`}>
                                    {isBotOnline ? 'Online' : 'Offline'}
                                  </span>
                                </div>
                                {botStatus && (
                                  <span className="text-xs text-gray-500">
                                    {botStatus.total_orders_today} pedidos hoje
                                  </span>
                                )}
                                {tenant.whatsapp_phone && (
                                  <span className="text-xs text-gray-400 font-mono">
                                    {tenant.whatsapp_phone}
                                  </span>
                                )}
                              </>
                            ) : (
                              <span className="text-xs text-gray-400">Não configurado</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            tenant.plan_type === "premium" 
                              ? "bg-purple-100 text-purple-700"
                              : tenant.plan_type === "complete"
                              ? "bg-blue-100 text-blue-700"
                              : "bg-gray-100 text-gray-700"
                          }`}>
                            {tenant.plan_type === "premium" ? "Premium" : tenant.plan_type === "complete" ? "Completo" : "Básico"}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-500 text-sm">
                          {tenant.subscription_payment_date 
                            ? new Date(tenant.subscription_payment_date).toLocaleDateString("pt-BR")
                            : <span className="text-gray-400">—</span>
                          }
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                          {tenant._count?.orders || 0}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                          {tenant._count?.users || 0}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-500 text-sm">
                          {new Date(tenant.created_at).toLocaleDateString("pt-BR")}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex gap-2 flex-wrap">
                            <button
                              onClick={() => {
                                const currentTenant = tenants.find((t) => t.id === tenant.id);
                                if (showWhatsAppForm === tenant.id) {
                                  setShowWhatsAppForm(null);
                                } else {
                                  setShowWhatsAppForm(tenant.id);
                                  // Pré-preencher campos se já existirem
                                  setFormData({
                                    ...formData,
                                    whatsapp_phone: currentTenant?.whatsapp_phone || "",
                                    meta_phone_number_id: "",
                                    meta_access_token: "",
                                    meta_verify_token: "",
                                  });
                                }
                              }}
                              className="text-blue-600 hover:text-blue-800 text-xs font-medium flex items-center gap-1"
                              title="Configurar WhatsApp"
                            >
                              <Settings size={14} />
                              WhatsApp
                            </button>
                            <button
                              onClick={() =>
                                setShowUserForm(
                                  showUserForm === tenant.id ? null : tenant.id
                                )
                              }
                              className="text-amber-600 hover:text-amber-800 text-xs font-medium"
                            >
                              {showUserForm === tenant.id ? "Cancelar" : "+ Usuário"}
                            </button>
                            <button
                              onClick={() => {
                                if (
                                  confirm(
                                    `Tem certeza que deseja ${
                                      tenant.is_active ? "desativar" : "ativar"
                                    } ${tenant.name}?`
                                  )
                                ) {
                                  toggleTenantStatus(tenant.id, tenant.is_active);
                                }
                              }}
                              className={`text-xs font-medium ${
                                tenant.is_active
                                  ? "text-red-600 hover:text-red-800"
                                  : "text-amber-600 hover:text-amber-800"
                              }`}
                            >
                              {tenant.is_active ? "Desativar" : "Ativar"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Seção de Clínicas/Dentistas */}
            {tenants.filter(t => t.business_type === "DENTISTA").length > 0 && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
                <div className="px-6 py-4 border-b bg-gradient-to-r from-blue-50 to-blue-100/50">
                  <h2 className="text-xl font-bold text-gray-900 font-display flex items-center gap-2">
                    <span className="text-2xl">🦷</span> 
                    <span>Clínicas</span>
                    <span className="ml-2 px-2.5 py-0.5 bg-blue-200 text-blue-800 text-sm font-semibold rounded-full">
                      {tenants.filter(t => t.business_type === "DENTISTA").length}
                    </span>
                  </h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Nome
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Slug
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Bot WhatsApp
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Plano
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Último Pagamento
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Agendamentos
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Usuários
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Criado em
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Ações
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {tenants.filter(t => t.business_type === "DENTISTA").map((tenant) => {
                        const botStatus = botStatuses.find(b => b.tenant_id === tenant.id);
                        const isBotOnline = botStatus?.is_online || false;
                        return (
                          <tr key={tenant.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                              {tenant.name}
                              <span className="ml-2 px-2 py-0.5 rounded text-xs font-semibold bg-blue-100 text-blue-700">
                                🦷 Dentista
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                              <code className="text-xs bg-gray-100 px-2 py-1 rounded">{tenant.slug}</code>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <button
                                onClick={() =>
                                  toggleTenantStatus(tenant.id, tenant.is_active)
                                }
                                className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                  tenant.is_active
                                    ? "bg-green-100 text-green-700"
                                    : "bg-red-100 text-red-800"
                                }`}
                              >
                                {tenant.is_active ? "Ativo" : "Inativo"}
                              </button>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex flex-col gap-1">
                                {tenant.bot_configured ? (
                                  <>
                                    <div className="flex items-center gap-2">
                                      <div className={`w-2 h-2 rounded-full ${isBotOnline ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                                      <span className={`text-xs font-medium ${isBotOnline ? 'text-green-600' : 'text-red-600'}`}>
                                        {isBotOnline ? 'Online' : 'Offline'}
                                      </span>
                                    </div>
                                    {botStatus && (
                                      <span className="text-xs text-gray-500">
                                        {botStatus.total_orders_today} agendamentos hoje
                                      </span>
                                    )}
                                    {tenant.whatsapp_phone && (
                                      <span className="text-xs text-gray-400 font-mono">
                                        {tenant.whatsapp_phone}
                                      </span>
                                    )}
                                  </>
                                ) : (
                                  <span className="text-xs text-gray-400">Não configurado</span>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                              {tenant._count?.orders || 0}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                              {tenant._count?.users || 0}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-gray-500 text-sm">
                              {new Date(tenant.created_at).toLocaleDateString("pt-BR")}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex flex-col gap-1">
                                <button
                                  onClick={() => {
                                    const currentTenant = tenants.find((t) => t.id === tenant.id);
                                    if (showWhatsAppForm === tenant.id) {
                                      setShowWhatsAppForm(null);
                                    } else {
                                      setShowWhatsAppForm(tenant.id);
                                      setFormData({
                                        ...formData,
                                        whatsapp_phone: currentTenant?.whatsapp_phone || "",
                                        meta_phone_number_id: "",
                                        meta_access_token: "",
                                        meta_verify_token: "",
                                      });
                                    }
                                  }}
                                  className="text-blue-600 hover:text-blue-800 text-xs font-medium flex items-center gap-1"
                                  title="Configurar WhatsApp"
                                >
                                  <Settings size={14} />
                                  WhatsApp
                                </button>
                                <button
                                  onClick={() =>
                                    setShowUserForm(
                                      showUserForm === tenant.id ? null : tenant.id
                                    )
                                  }
                                  className="text-amber-600 hover:text-amber-800 text-xs font-medium"
                                >
                                  {showUserForm === tenant.id ? "Cancelar" : "+ Usuário"}
                                </button>
                                <button
                                  onClick={() => {
                                    if (
                                      confirm(
                                        `Tem certeza que deseja ${
                                          tenant.is_active ? "desativar" : "ativar"
                                        } ${tenant.name}?`
                                      )
                                    ) {
                                      toggleTenantStatus(tenant.id, tenant.is_active);
                                    }
                                  }}
                                  className={`text-xs font-medium ${
                                    tenant.is_active
                                      ? "text-red-600 hover:text-red-800"
                                      : "text-green-600 hover:text-green-800"
                                  }`}
                                >
                                  {tenant.is_active ? "Desativar" : "Ativar"}
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Seção de Barbeiros */}
            {tenants.filter(t => t.business_type === "BARBEIRO").length > 0 && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
                <div className="px-6 py-4 border-b bg-gradient-to-r from-amber-50 to-amber-100/50">
                  <h2 className="text-xl font-bold text-gray-900 font-display flex items-center gap-2">
                    <span className="text-2xl">✂️</span>
                    <span>Barbeiros</span>
                    <span className="ml-2 px-2.5 py-0.5 bg-amber-200 text-amber-800 text-sm font-semibold rounded-full">
                      {tenants.filter(t => t.business_type === "BARBEIRO").length}
                    </span>
                  </h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nome</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Slug</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Bot WhatsApp</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {tenants.filter(t => t.business_type === "BARBEIRO").map((tenant) => {
                        const botStatus = botStatuses.find(b => b.tenant_id === tenant.id);
                        const isBotOnline = botStatus?.is_online || false;
                        return (
                          <tr key={tenant.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                              {tenant.name}
                              <span className="ml-2 px-2 py-0.5 rounded text-xs font-semibold bg-amber-100 text-amber-700">✂️ Barbeiro</span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                              <code className="text-xs bg-gray-100 px-2 py-1 rounded">{tenant.slug}</code>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 py-1 rounded-full text-xs font-semibold ${tenant.is_active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-800"}`}>
                                {tenant.is_active ? "Ativo" : "Inativo"}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 py-1 rounded text-xs ${isBotOnline ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>
                                {isBotOnline ? "Online" : "Offline"}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              <button
                                onClick={() => {
                                  const currentTenant = tenants.find((t) => t.id === tenant.id);
                                  if (showWhatsAppForm === tenant.id) {
                                    setShowWhatsAppForm(null);
                                  } else {
                                    setShowWhatsAppForm(tenant.id);
                                    setFormData({
                                      ...formData,
                                      whatsapp_phone: currentTenant?.whatsapp_phone || "",
                                      meta_phone_number_id: "",
                                      meta_access_token: "",
                                      meta_verify_token: "",
                                    });
                                  }
                                }}
                                className="text-amber-600 hover:text-amber-800 font-medium mr-2 flex items-center gap-1"
                                title="Configurar WhatsApp"
                              >
                                <Settings size={14} />
                                WhatsApp
                              </button>
                              <button onClick={() => setShowUserForm(showUserForm === tenant.id ? null : tenant.id)} className="text-amber-600 hover:text-amber-800 text-xs font-medium">+ Usuário</button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Mensagem quando não há clientes */}
            {tenants.length === 0 && !loading && (
              <div className="bg-white rounded-lg shadow p-12 text-center">
                <p className="text-gray-500 text-lg">Nenhum cliente cadastrado ainda.</p>
                <p className="text-gray-400 text-sm mt-2">Clique em "+ Novo Cliente" para começar.</p>
              </div>
            )}
          </>
        )}

        {/* Formulário de Criar Usuário para Tenant Existente */}
        {showUserForm && showUserForm !== "new" && (
          <div className="bg-white rounded-lg shadow-lg p-6 mt-8 border-2 border-primary-200">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900 font-display">
                Criar Usuário Admin para{" "}
                {tenants.find((t) => t.id === showUserForm)?.name}
              </h2>
              <button
                onClick={() => {
                  setShowUserForm(null);
                  setFormData({
                    name: "",
                    slug: "",
                    business_type: "RESTAURANTE",
                    show_prices_on_bot: true,
                    plan_type: "basic",
                    username: "",
                    password: "",
                    userName: "",
                    whatsapp_phone: "",
                    meta_phone_number_id: "",
                    meta_access_token: "",
                    meta_verify_token: "",
                    meta_business_account_id: "",
                    desktop_api_url: "",
                    configureDynamoDB: false,
                  });
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleCreateUser(showUserForm);
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email (username) *
                </label>
                <input
                  type="email"
                  required
                  value={formData.username}
                  onChange={(e) =>
                    setFormData({ ...formData, username: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="admin@pizzaria.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Senha *
                </label>
                <input
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Senha inicial"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nome do Usuário
                </label>
                <input
                  type="text"
                  value={formData.userName}
                  onChange={(e) =>
                    setFormData({ ...formData, userName: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Ex: João Admin"
                />
              </div>

              <div className="flex gap-4">
                <button
                  type="submit"
                  className="bg-primary-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-primary-700 transition"
                >
                  Criar Usuário
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowUserForm(null);
                    setFormData({
                      name: "",
                      slug: "",
                      business_type: "RESTAURANTE",
                      show_prices_on_bot: true,
                      plan_type: "basic",
                      username: "",
                      password: "",
                      userName: "",
                      whatsapp_phone: "",
                      meta_phone_number_id: "",
                      meta_access_token: "",
                      meta_verify_token: "",
                      meta_business_account_id: "",
                      desktop_api_url: "",
                      configureDynamoDB: false,
                    });
                  }}
                  className="bg-gray-200 text-gray-800 px-6 py-2 rounded-lg font-semibold hover:bg-gray-300 transition"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Formulário de Configuração WhatsApp */}
        {showWhatsAppForm && showWhatsAppForm !== "new" && (() => {
          const tenant = tenants.find((t) => t.id === showWhatsAppForm);
          if (!tenant) return null;
          return (
          <div className="bg-white rounded-lg shadow-lg p-6 mt-8 border-2 border-blue-200">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900 font-display">
                Configurar WhatsApp para {tenant.name}
              </h2>
              <button
                onClick={() => {
                  setShowWhatsAppForm(null);
                  setFormData({
                    ...formData,
                    whatsapp_phone: "",
                    meta_phone_number_id: "",
                    meta_access_token: "",
                    meta_verify_token: "",
                  });
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            <div className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg mb-4">
                <p className="text-sm text-blue-900">
                  <strong>📋 Passos para configurar:</strong>
                  <br />
                  1. Criar conta no Meta Business (business.facebook.com)
                  <br />
                  2. Criar App WhatsApp Business
                  <br />
                  3. Adicionar número de telefone e verificar
                  <br />
                  4. Obter Phone Number ID e Access Token
                  <br />
                  5. Configurar webhook apontando para: <code className="text-xs bg-white px-1 rounded">https://pedidos.dmtn.com.br/api/bot/webhook</code>
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Telefone WhatsApp (com código do país) *
                </label>
                <input
                  type="text"
                  required
                  value={formData.whatsapp_phone}
                  onChange={(e) =>
                    setFormData({ ...formData, whatsapp_phone: e.target.value.replace(/\D/g, "") })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="5521999999999"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Apenas números, com código do país (55 para Brasil)
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Meta Phone Number ID *
                </label>
                <input
                  type="text"
                  required
                  value={formData.meta_phone_number_id}
                  onChange={(e) =>
                    setFormData({ ...formData, meta_phone_number_id: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                  placeholder="123456789012345"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Meta Access Token *
                </label>
                <input
                  type="password"
                  required
                  value={formData.meta_access_token}
                  onChange={(e) =>
                    setFormData({ ...formData, meta_access_token: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                  placeholder="EAAxxxxxxxxxxxxx"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Token de acesso permanente da Meta Cloud API
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Meta Verify Token (opcional)
                </label>
                <input
                  type="text"
                  value={formData.meta_verify_token}
                  onChange={(e) =>
                    setFormData({ ...formData, meta_verify_token: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                  placeholder="meu_token_secreto"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Token para verificação do webhook (pode ser qualquer string)
                </p>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => handleSaveWhatsAppConfig(showWhatsAppForm)}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 transition"
                >
                  Salvar Configuração
                </button>
                <button
                  onClick={() => {
                    setShowWhatsAppForm(null);
                    setFormData({
                      ...formData,
                      whatsapp_phone: "",
                      meta_phone_number_id: "",
                      meta_access_token: "",
                      meta_verify_token: "",
                    });
                  }}
                  className="bg-gray-200 text-gray-800 px-6 py-2 rounded-lg font-semibold hover:bg-gray-300 transition"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
          );
        })()}
      </div>
    </div>
  );
}
