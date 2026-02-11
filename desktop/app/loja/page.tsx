"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface StoreStatus {
  isOpen: boolean;
  nextOpenTime: string | null;
  message: string | null;
  lastUpdated: string;
}

interface TenantProfile {
  name: string;
  logo_url: string | null;
}

export default function LojaPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingName, setSavingName] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [tenantProfile, setTenantProfile] = useState<TenantProfile | null>(null);
  const [storeName, setStoreName] = useState("");
  const [status, setStatus] = useState<StoreStatus>({
    isOpen: true,
    nextOpenTime: null,
    message: null,
    lastUpdated: new Date().toISOString(),
  });
  const [nextOpenTime, setNextOpenTime] = useState("");

  // Verificar se é super admin e redirecionar
  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.user && !data.user.tenant_id) {
          router.push("/admin");
        }
      })
      .catch(() => {});
  }, [router]);
  const [customMessage, setCustomMessage] = useState("");

  useEffect(() => {
    loadStoreStatus();
    loadTenantProfile();
  }, []);

  const loadTenantProfile = async () => {
    try {
      const res = await fetch("/api/admin/tenant-profile");
      const data = await res.json();
      if (data.success && data.profile) {
        setTenantProfile(data.profile);
        setStoreName(data.profile.name || "");
      }
    } catch {
      //
    }
  };

  const loadStoreStatus = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/store-hours");
      const data = await res.json();
      const storeStatus = data.status || data;
      if (storeStatus) {
        setStatus({
          isOpen: storeStatus.isOpen ?? true,
          nextOpenTime: storeStatus.nextOpenTime || null,
          message: storeStatus.message || null,
          lastUpdated: storeStatus.lastUpdated || new Date().toISOString(),
        });
        setNextOpenTime(storeStatus.nextOpenTime || "");
        setCustomMessage(storeStatus.message || "");
      }
    } catch (error) {
      console.error("Erro ao carregar status:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const res = await fetch("/api/admin/store-hours", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          isOpen: status.isOpen,
          nextOpenTime: status.isOpen ? null : nextOpenTime || null,
          message: customMessage || null,
        }),
      });

      const data = await res.json();
      if (data.success || data.status) {
        alert("Status atualizado com sucesso!");
        loadStoreStatus();
      } else {
        alert(`❌ Erro: ${data.error || data.message || "Erro ao salvar"}`);
      }
    } catch (error) {
      console.error("Erro ao salvar status:", error);
      alert("❌ Erro ao salvar status");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveStoreName = async () => {
    if (!storeName.trim()) return;
    try {
      setSavingName(true);
      const res = await fetch("/api/admin/tenant-profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: storeName.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        setTenantProfile((p) => (p ? { ...p, name: storeName.trim() } : null));
        alert("Nome da loja atualizado! O bot usará esse nome nas mensagens do WhatsApp.");
      } else {
        alert(`Erro: ${data.error || "Erro ao salvar"}`);
      }
    } catch {
      alert("Erro ao salvar nome");
    } finally {
      setSavingName(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      alert("Escolha uma imagem (JPEG, PNG ou WebP)");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      alert("Arquivo muito grande (máx 2MB)");
      return;
    }
    try {
      setUploadingLogo(true);
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/admin/upload-logo", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.success && data.logo_url) {
        setTenantProfile((p) => (p ? { ...p, logo_url: data.logo_url } : null));
        alert("Logo enviada para a nuvem (AWS S3)!");
      } else {
        alert(data.error || "Erro ao enviar logo");
      }
    } catch {
      alert("Erro ao enviar logo");
    } finally {
      setUploadingLogo(false);
      e.target.value = "";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          <p className="mt-4 text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-gray-50 animate-fade-in">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8 animate-slide-in">
          <h1 className="text-4xl font-bold text-gray-900 font-display mb-2">
            Controle de Loja
          </h1>
          <p className="text-gray-600 text-lg">
            Nome da loja, logo, status e horários
          </p>
        </div>

        {/* Nome da Loja - atualiza no bot WhatsApp */}
        <div className="card-modern p-6 mb-6 animate-fade-in">
          <h2 className="text-xl font-bold text-gray-900 font-display mb-2">
            Nome da Loja
          </h2>
          <p className="text-sm text-gray-500 mb-4">
            Esse nome aparece nas mensagens do WhatsApp quando o cliente fala com o bot.
          </p>
          <div className="flex gap-4 items-end">
            <input
              type="text"
              value={storeName}
              onChange={(e) => setStoreName(e.target.value)}
              placeholder="Ex: Tamboril Burguer"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            />
            <button
              onClick={handleSaveStoreName}
              disabled={savingName || !storeName.trim()}
              className="btn-primary disabled:opacity-50"
            >
              {savingName ? "Salvando..." : "Salvar Nome"}
            </button>
          </div>
        </div>

        {/* Logo da Loja - upload AWS S3 */}
        <div className="card-modern p-6 mb-6 animate-fade-in">
          <h2 className="text-xl font-bold text-gray-900 font-display mb-2">
            Logo da Loja
          </h2>
          <p className="text-sm text-gray-500 mb-4">
            A logo identifica sua loja no app e no desktop. Será enviada para a nuvem (AWS S3).
          </p>
          <div className="flex items-center gap-6">
            {tenantProfile?.logo_url ? (
              <img
                src={tenantProfile.logo_url}
                alt="Logo"
                className="h-24 w-24 rounded-xl object-cover border border-gray-200"
              />
            ) : (
              <div className="h-24 w-24 rounded-xl bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400 text-sm">
                Sem logo
              </div>
            )}
            <label className="cursor-pointer">
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleLogoUpload}
                disabled={uploadingLogo}
                className="hidden"
              />
              <span className="btn-secondary inline-block">
                {uploadingLogo ? "Enviando..." : "Escolher imagem"}
              </span>
            </label>
          </div>
        </div>

        {/* Status da Loja */}
        <div className="card-modern p-6 mb-6 animate-fade-in">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900 font-display mb-2">
                Status da Loja
              </h2>
              <p className="text-sm text-gray-500">
                Última atualização:{" "}
                {new Date(status.lastUpdated).toLocaleString("pt-BR")}
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={status.isOpen}
                onChange={(e) =>
                  setStatus({ ...status, isOpen: e.target.checked })
                }
                className="sr-only peer"
              />
              <div className="w-16 h-8 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-7 after:w-7 after:transition-all peer-checked:bg-primary-600"></div>
              <span
                className={`ml-3 text-lg font-bold ${
                  status.isOpen ? "text-primary-600" : "text-red-600"
                }`}
              >
                {status.isOpen ? "🟢 ABERTA" : "🔴 FECHADA"}
              </span>
            </label>
          </div>

          {!status.isOpen && (
            <div className="bg-gray-50 p-4 rounded-lg mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Horário de Abertura
              </label>
              <input
                type="time"
                value={nextOpenTime}
                onChange={(e) => setNextOpenTime(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">
                Defina quando a loja voltará a abrir
              </p>
            </div>
          )}

          <div className="bg-gray-50 p-4 rounded-lg">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mensagem Customizada (opcional)
            </label>
            <textarea
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Ex: Voltamos às 18h! Ou: Fechado para manutenção."
            />
            <p className="text-xs text-gray-500 mt-1">
              Esta mensagem será exibida para clientes quando a loja estiver
              fechada
            </p>
          </div>
        </div>

        {/* Preview da Mensagem */}
        {!status.isOpen && (
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200 rounded-xl p-6 mb-6 shadow-sm animate-fade-in">
            <h3 className="text-lg font-bold text-blue-900 mb-3 font-display">
              Preview da Mensagem
            </h3>
            <div className="bg-white p-4 rounded border border-blue-200">
              <p className="text-gray-900 font-semibold mb-2">
                {status.isOpen ? "🟢 Loja Aberta" : "🔴 Loja Fechada"}
              </p>
              {nextOpenTime && (
                <p className="text-gray-700 mb-2">
                  ⏰ Horário de abertura: {nextOpenTime}
                </p>
              )}
              {customMessage && (
                <p className="text-gray-700">{customMessage}</p>
              )}
              {!nextOpenTime && !customMessage && (
                <p className="text-gray-500 italic">
                  Nenhuma mensagem configurada
                </p>
              )}
            </div>
          </div>
        )}

        {/* Botão Salvar */}
        <div className="flex gap-4">
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? "Salvando..." : "Salvar Status"}
          </button>
          <button onClick={loadStoreStatus} className="btn-secondary">
            Atualizar
          </button>
        </div>

        {/* Informações */}
        <div className="mt-8 bg-gradient-to-r from-accent-50 to-accent-100 border border-accent-200 rounded-xl p-4 shadow-sm animate-fade-in">
          <p className="text-sm text-yellow-800">
            <strong>💡 Dica:</strong> Quando a loja estiver fechada, o bot do
            WhatsApp informará automaticamente aos clientes que a loja está
            fechada e mostrará a mensagem configurada acima.
          </p>
        </div>
      </div>
    </div>
  );
}
