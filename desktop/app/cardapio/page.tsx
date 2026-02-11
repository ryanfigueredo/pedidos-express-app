"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Pencil } from "lucide-react";

interface MenuItem {
  id: string;
  name: string;
  price: number;
  category: string;
  available: boolean;
  order?: number;
}

interface ItemStats {
  name: string;
  quantity: number;
  revenue: number;
}

export default function CardapioPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [stats, setStats] = useState<ItemStats[]>([]);
  const [filter, setFilter] = useState<
    "padrao" | "maisVendidos" | "nome" | "precoMenor" | "precoMaior"
  >("padrao");
  const [deletingItem, setDeletingItem] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    price: "",
    category: "hamburguer",
    available: true,
  });
  const [editFormData, setEditFormData] = useState({
    name: "",
    price: "",
    available: true,
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
    loadMenu();
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const res = await fetch("/api/admin/menu/stats");
      const data = await res.json();
      if (data.success) setStats(data.stats || []);
    } catch {
      //
    }
  };

  const loadMenu = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/menu");
      if (!res.ok) {
        throw new Error("Erro ao carregar cardápio");
      }
      const data = await res.json();
      if (data.items) {
        setMenuItems(data.items);
      }
    } catch (error) {
      console.error("Erro ao carregar cardápio:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (item: MenuItem) => {
    setEditingItem(item);
    setEditFormData({
      name: item.name,
      price: item.price.toString(),
      available: item.available,
    });
  };

  const handleSaveEdit = async () => {
    if (!editingItem) return;

    try {
      const res = await fetch("/api/admin/menu", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingItem.id,
          name: editFormData.name,
          price: parseFloat(editFormData.price),
          available: editFormData.available,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Erro ao atualizar");
      }
      const data = await res.json();
      if (data.success) {
        alert("Item atualizado com sucesso!");
        setEditingItem(null);
        loadMenu();
      } else {
        alert(`❌ Erro: ${data.message || "Erro desconhecido"}`);
      }
    } catch (error) {
      console.error("Erro ao atualizar item:", error);
      alert("❌ Erro ao atualizar item");
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.price) {
      alert("Preencha nome e preço");
      return;
    }

    try {
      const newId = formData.name.toLowerCase().replace(/[^a-z0-9]/g, "_");
      const res = await fetch("/api/admin/menu", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: newId,
          name: formData.name,
          price: parseFloat(formData.price),
          category: formData.category,
          available: formData.available,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Erro ao adicionar");
      }
      const data = await res.json();
      if (data.success) {
        alert("Item adicionado com sucesso!");
        setShowAddForm(false);
        setFormData({
          name: "",
          price: "",
          category: "hamburguer",
          available: true,
        });
        loadMenu();
      } else {
        alert(`❌ Erro: ${data.message || "Erro desconhecido"}`);
      }
    } catch (error) {
      console.error("Erro ao adicionar item:", error);
      alert("❌ Erro ao adicionar item");
    }
  };

  const toggleAvailable = async (item: MenuItem) => {
    try {
      const res = await fetch("/api/admin/menu", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: item.id,
          available: !item.available,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        console.error("Erro:", errorData);
        return;
      }
      const data = await res.json();
      if (data.success) {
        loadMenu();
      }
    } catch (error) {
      console.error("Erro ao atualizar disponibilidade:", error);
    }
  };

  const handleDelete = async (item: MenuItem) => {
    if (
      !confirm(
        `Tem certeza que deseja deletar "${item.name}"? Esta ação não pode ser desfeita.`
      )
    ) {
      return;
    }

    try {
      setDeletingItem(item.id);
      const res = await fetch(`/api/admin/menu?id=${item.id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Erro ao deletar");
      }

      const data = await res.json();
      if (data.success) {
        alert("Item deletado com sucesso!");
        loadMenu();
      }
    } catch (error: any) {
      console.error("Erro ao deletar item:", error);
      alert(`❌ Erro: ${error.message || "Erro ao deletar item"}`);
    } finally {
      setDeletingItem(null);
    }
  };

  const handleMoveItem = async (item: MenuItem, direction: "up" | "down") => {
    const categoryItems = menuItems
      .filter((i) => i.category === item.category)
      .sort((a, b) => (a.order || 0) - (b.order || 0));

    const currentIndex = categoryItems.findIndex((i) => i.id === item.id);
    if (currentIndex === -1) return;

    const newIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= categoryItems.length) return;

    const targetItem = categoryItems[newIndex];

    // Trocar orders
    const itemsToUpdate = [
      { id: item.id, order: targetItem.order || 0 },
      { id: targetItem.id, order: item.order || 0 },
    ];

    try {
      const res = await fetch("/api/admin/menu", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: itemsToUpdate }),
      });

      if (!res.ok) {
        throw new Error("Erro ao reordenar");
      }

      loadMenu();
    } catch (error) {
      console.error("Erro ao reordenar item:", error);
      alert("❌ Erro ao reordenar item");
    }
  };

  const statsMap = Object.fromEntries(stats.map((s) => [s.name, s]));
  const getItemCount = (name: string) => statsMap[name]?.quantity ?? 0;

  const categories = ["hamburguer", "bebida", "acompanhamento", "sobremesa"];
  const categoryLabels: Record<string, string> = {
    hamburguer: "Hambúrgueres",
    bebida: "Bebidas",
    acompanhamento: "Acompanhamentos",
    sobremesa: "Sobremesas",
  };

  const sortItems = (items: MenuItem[]) => {
    const sorted = [...items];
    switch (filter) {
      case "maisVendidos":
        return sorted.sort(
          (a, b) => getItemCount(b.name) - getItemCount(a.name)
        );
      case "nome":
        return sorted.sort((a, b) => a.name.localeCompare(b.name));
      case "precoMenor":
        return sorted.sort((a, b) => a.price - b.price);
      case "precoMaior":
        return sorted.sort((a, b) => b.price - a.price);
      default:
        return sorted.sort((a, b) => (a.order || 0) - (b.order || 0));
    }
  };

  const groupedItems = categories.reduce((acc, category) => {
    const items = menuItems.filter((item) => item.category === category);
    acc[category] = sortItems(items);
    return acc;
  }, {} as Record<string, MenuItem[]>);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-gray-50 animate-fade-in">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8 animate-slide-in">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 font-display mb-2">
              Cardápio
            </h1>
            <p className="text-gray-600 text-lg">
              Mesmo cardápio exibido no bot (por categoria: Lanches, Bebidas,
              etc.)
            </p>
          </div>
          <div className="flex gap-3 flex-wrap items-center">
            <select
              value={filter}
              onChange={(e) =>
                setFilter(
                  e.target.value as
                    | "padrao"
                    | "maisVendidos"
                    | "nome"
                    | "precoMenor"
                    | "precoMaior"
                )
              }
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-sm"
            >
              <option value="padrao">Padrão (categoria)</option>
              <option value="maisVendidos">Mais vendidos</option>
              <option value="nome">Nome A–Z</option>
              <option value="precoMenor">Preço: menor</option>
              <option value="precoMaior">Preço: maior</option>
            </select>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="btn-primary"
            >
              {showAddForm ? "Cancelar" : "+ Novo Item"}
            </button>
          </div>
        </div>

        {/* Formulário de Adicionar */}
        {showAddForm && (
          <div className="card-modern p-6 mb-8 border-2 border-primary-200 animate-fade-in">
            <h2 className="text-xl font-bold text-gray-900 mb-4 font-display">
              Adicionar Novo Item
            </h2>
            <form onSubmit={handleAdd} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nome do Item *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Ex: Hamb. Especial"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Preço (R$) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={formData.price}
                    onChange={(e) =>
                      setFormData({ ...formData, price: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Categoria *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {categoryLabels[cat] || cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.available}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          available: e.target.checked,
                        })
                      }
                      className="mr-2 w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                    />
                    <span className="text-sm text-gray-700">Disponível</span>
                  </label>
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  type="submit"
                  className="bg-primary-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-primary-700 transition"
                >
                  Adicionar Item
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddForm(false);
                    setFormData({
                      name: "",
                      price: "",
                      category: "hamburguer",
                      available: true,
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

        {/* Lista de Itens por Categoria */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            <p className="mt-4 text-gray-600">Carregando cardápio...</p>
          </div>
        ) : menuItems.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-500 text-lg">Nenhum item no cardápio</p>
            <p className="text-gray-400 text-sm mt-2">
              Clique em "+ Novo Item" para adicionar
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {categories.map((category) => {
              const items = groupedItems[category];
              if (!items || items.length === 0) return null;

              return (
                <div
                  key={category}
                  className="card-modern overflow-hidden animate-fade-in"
                >
                  <div className="px-6 py-4 border-b bg-gradient-to-r from-primary-50 to-white">
                    <h2 className="text-xl font-bold text-gray-900 font-display">
                      {categoryLabels[category] || category}
                    </h2>
                  </div>
                  <div className="divide-y divide-gray-200">
                    {items.map((item) => (
                      <div
                        key={item.id}
                        className="px-6 py-4 hover:bg-gray-50 transition"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 flex-wrap">
                              <h3 className="text-lg font-semibold text-gray-900">
                                {item.name}
                              </h3>
                              <span
                                className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                  item.available
                                    ? "bg-primary-100 text-primary-700"
                                    : "bg-red-100 text-red-800"
                                }`}
                              >
                                {item.available ? "Disponível" : "Indisponível"}
                              </span>
                              {getItemCount(item.name) > 0 && (
                                <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                  {getItemCount(item.name)} vendidos
                                </span>
                              )}
                            </div>
                            <p className="text-xl font-bold text-primary-600 mt-1">
                              R$ {item.price.toFixed(2).replace(".", ",")}
                            </p>
                          </div>
                          <div className="flex gap-2 items-center">
                            {/* Botões de Reordenar */}
                            <div className="flex flex-col gap-1">
                              <button
                                onClick={() => handleMoveItem(item, "up")}
                                className="text-gray-400 hover:text-gray-600 text-xs"
                                title="Mover para cima"
                              >
                                ▲
                              </button>
                              <button
                                onClick={() => handleMoveItem(item, "down")}
                                className="text-gray-400 hover:text-gray-600 text-xs"
                                title="Mover para baixo"
                              >
                                ▼
                              </button>
                            </div>
                            <button
                              onClick={() => toggleAvailable(item)}
                              className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                                item.available
                                  ? "bg-red-100 text-red-700 hover:bg-red-200"
                                  : "bg-primary-100 text-primary-600 hover:bg-primary-200"
                              }`}
                            >
                              {item.available ? "Desativar" : "Ativar"}
                            </button>
                            <button
                              onClick={() => handleEdit(item)}
                              className="p-2 rounded-lg bg-primary-100 text-primary-600 hover:bg-primary-200 transition"
                              title="Editar"
                            >
                              <Pencil size={18} />
                            </button>
                            <button
                              onClick={() => handleDelete(item)}
                              disabled={deletingItem === item.id}
                              className="p-2 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 transition disabled:opacity-50"
                              title="Excluir"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Modal de Edição */}
        {editingItem && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-900 font-display">
                  Editar Item
                </h2>
                <button
                  onClick={() => setEditingItem(null)}
                  className="text-gray-400 hover:text-gray-600 p-1"
                  aria-label="Fechar"
                >
                  ×
                </button>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSaveEdit();
                }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nome do Item *
                  </label>
                  <input
                    type="text"
                    required
                    value={editFormData.name}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, name: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Preço (R$) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={editFormData.price}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        price: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>

                <div className="flex items-center">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editFormData.available}
                      onChange={(e) =>
                        setEditFormData({
                          ...editFormData,
                          available: e.target.checked,
                        })
                      }
                      className="mr-2 w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                    />
                    <span className="text-sm text-gray-700">Disponível</span>
                  </label>
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    type="submit"
                    className="flex-1 bg-primary-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-primary-700 transition"
                  >
                    Salvar
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingItem(null)}
                    className="flex-1 bg-gray-200 text-gray-800 px-6 py-2 rounded-lg font-semibold hover:bg-gray-300 transition"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
