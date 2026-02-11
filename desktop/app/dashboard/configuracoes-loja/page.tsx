"use client";

import { useState, useEffect } from "react";
import { Store, Truck, Save, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";

interface StoreConfig {
  name: string;
  whatsapp_phone: string;
  deliveryBaseFee: number;
  deliveryFeePerKm: number;
  maxDeliveryKm: number;
  restaurantAddress: string;
}

export default function ConfiguracoesLojaPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  const [storeConfig, setStoreConfig] = useState<StoreConfig>({
    name: "",
    whatsapp_phone: "",
    deliveryBaseFee: 0,
    deliveryFeePerKm: 0,
    maxDeliveryKm: 0,
    restaurantAddress: "",
  });

  const [deliveryConfig, setDeliveryConfig] = useState({
    deliveryBaseFee: 0,
    deliveryFeePerKm: 0,
    maxDeliveryKm: 0,
    restaurantAddress: "",
  });

  useEffect(() => {
    // Carregar dados do tenant
    fetch("/api/admin/tenant-profile")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.profile) {
          setStoreConfig({
            name: data.profile.name || "",
            whatsapp_phone: data.profile.whatsapp_phone || "",
            deliveryBaseFee: 0,
            deliveryFeePerKm: 0,
            maxDeliveryKm: 0,
            restaurantAddress: "",
          });
        }
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });

    // Carregar configurações de entrega
    fetch("/api/admin/delivery-config")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.config) {
          setDeliveryConfig(data.config);
        }
      })
      .catch(() => {});
  }, []);

  const handleStoreSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setSaving(true);

    try {
      // Implementar atualização de dados da loja
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || "Erro ao salvar configurações");
    } finally {
      setSaving(false);
    }
  };

  const handleDeliverySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setSaving(true);

    try {
      const response = await fetch("/api/admin/delivery-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(deliveryConfig),
      });

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || "Erro ao salvar configurações");
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || "Erro ao salvar configurações");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin text-primary-600" size={32} />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <Store className="text-primary-600" size={32} />
          Configurações da Loja
        </h1>
        <p className="text-gray-600 mt-2">
          Gerencie as configurações da sua loja e entregas
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
          <AlertCircle className="text-red-600" size={20} />
          <span className="text-red-800">{error}</span>
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
          <CheckCircle2 className="text-green-600" size={20} />
          <span className="text-green-800">Configurações salvas com sucesso!</span>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        {/* Configurações da Loja */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Store size={20} />
            Dados da Loja
          </h2>
          <form onSubmit={handleStoreSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nome da Loja
              </label>
              <input
                type="text"
                value={storeConfig.name}
                onChange={(e) => setStoreConfig({ ...storeConfig, name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Nome da sua loja"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                WhatsApp
              </label>
              <input
                type="text"
                value={storeConfig.whatsapp_phone}
                onChange={(e) => setStoreConfig({ ...storeConfig, whatsapp_phone: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="5511999999999"
              />
            </div>
            <button
              type="submit"
              disabled={saving}
              className="w-full flex items-center justify-center gap-2 bg-primary-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-700 transition disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  Salvando...
                </>
              ) : (
                <>
                  <Save size={20} />
                  Salvar Configurações
                </>
              )}
            </button>
          </form>
        </div>

        {/* Configurações de Entrega */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Truck size={20} />
            Configurações de Entrega
          </h2>
          <form onSubmit={handleDeliverySubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Endereço do Restaurante
              </label>
              <input
                type="text"
                value={deliveryConfig.restaurantAddress}
                onChange={(e) => setDeliveryConfig({ ...deliveryConfig, restaurantAddress: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Endereço completo"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Taxa Base de Entrega (R$)
              </label>
              <input
                type="number"
                step="0.01"
                value={deliveryConfig.deliveryBaseFee}
                onChange={(e) => setDeliveryConfig({ ...deliveryConfig, deliveryBaseFee: parseFloat(e.target.value) || 0 })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Taxa por KM (R$)
              </label>
              <input
                type="number"
                step="0.01"
                value={deliveryConfig.deliveryFeePerKm}
                onChange={(e) => setDeliveryConfig({ ...deliveryConfig, deliveryFeePerKm: parseFloat(e.target.value) || 0 })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Raio Máximo de Entrega (KM)
              </label>
              <input
                type="number"
                value={deliveryConfig.maxDeliveryKm}
                onChange={(e) => setDeliveryConfig({ ...deliveryConfig, maxDeliveryKm: parseInt(e.target.value) || 0 })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="0"
              />
            </div>
            <button
              type="submit"
              disabled={saving}
              className="w-full flex items-center justify-center gap-2 bg-primary-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-700 transition disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  Salvando...
                </>
              ) : (
                <>
                  <Save size={20} />
                  Salvar Configurações
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
