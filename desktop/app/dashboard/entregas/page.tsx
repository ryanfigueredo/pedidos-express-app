"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface DeliveryConfig {
  restaurantAddress: string;
  deliveryBaseFee: number;
  deliveryFeePerKm: number;
  maxDeliveryKm: number;
  lastUpdated: string;
}

export default function EntregasPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState<DeliveryConfig>({
    restaurantAddress: "",
    deliveryBaseFee: 0,
    deliveryFeePerKm: 0,
    maxDeliveryKm: 0,
    lastUpdated: "",
  });

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

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/delivery-config");
      const data = await res.json();
      if (data.config) {
        setConfig({
          restaurantAddress: data.config.restaurantAddress ?? "",
          deliveryBaseFee: Number(data.config.deliveryBaseFee) ?? 0,
          deliveryFeePerKm: Number(data.config.deliveryFeePerKm) ?? 0,
          maxDeliveryKm: Number(data.config.maxDeliveryKm) ?? 0,
          lastUpdated: data.config.lastUpdated ?? "",
        });
      }
    } catch (error) {
      console.error("Erro ao carregar config de entregas:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      const res = await fetch("/api/admin/delivery-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          restaurantAddress: config.restaurantAddress,
          deliveryBaseFee: config.deliveryBaseFee,
          deliveryFeePerKm: config.deliveryFeePerKm,
          maxDeliveryKm: config.maxDeliveryKm,
        }),
      });
      const data = await res.json();
      if (data.success || data.config) {
        setConfig((c) => ({
          ...c,
          ...data.config,
          lastUpdated: data.config?.lastUpdated ?? c.lastUpdated,
        }));
        alert("Configuração de entregas salva!");
      } else {
        alert(`❌ Erro: ${data.message || "Erro ao salvar"}`);
      }
    } catch (error) {
      console.error("Erro ao salvar:", error);
      alert("❌ Erro ao salvar");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-2xl mx-auto">
          <p className="text-gray-500">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Configuração de entregas
        </h1>
        <p className="text-gray-600 mb-6">
          Defina o endereço do restaurante e os valores de entrega. A distância
          do endereço do cliente até o restaurante pode ser usada para calcular
          o valor (ex.: taxa fixa + valor por km).
        </p>

        <form
          onSubmit={handleSave}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-5"
        >
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Endereço do restaurante
            </label>
            <input
              type="text"
              value={config.restaurantAddress}
              onChange={(e) =>
                setConfig((c) => ({ ...c, restaurantAddress: e.target.value }))
              }
              placeholder="Ex: Rua das Flores, 123 - Centro - Rio de Janeiro, RJ"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
            <p className="mt-1 text-xs text-gray-500">
              Usado para calcular a distância até o endereço do cliente.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Taxa fixa (R$)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={config.deliveryBaseFee || ""}
                onChange={(e) =>
                  setConfig((c) => ({
                    ...c,
                    deliveryBaseFee: parseFloat(e.target.value) || 0,
                  }))
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Por km (R$)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={config.deliveryFeePerKm || ""}
                onChange={(e) =>
                  setConfig((c) => ({
                    ...c,
                    deliveryFeePerKm: parseFloat(e.target.value) || 0,
                  }))
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Raio máx. (km)
              </label>
              <input
                type="number"
                min="0"
                step="0.5"
                value={config.maxDeliveryKm || ""}
                onChange={(e) =>
                  setConfig((c) => ({
                    ...c,
                    maxDeliveryKm: parseFloat(e.target.value) || 0,
                  }))
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="0 = sem limite"
              />
            </div>
          </div>

          {config.lastUpdated && (
            <p className="text-xs text-gray-400">
              Última atualização:{" "}
              {new Date(config.lastUpdated).toLocaleString("pt-BR")}
            </p>
          )}

          <button
            type="submit"
            disabled={saving}
            className="w-full py-3 px-4 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 disabled:opacity-50"
          >
            {saving ? "Salvando..." : "Salvar configuração"}
          </button>
        </form>
      </div>
    </div>
  );
}
