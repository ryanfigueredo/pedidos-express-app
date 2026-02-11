"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { CheckCircle2, MessageCircle } from "lucide-react";
import { ChatAtendimento } from "@/components/ChatAtendimento";

interface PriorityConversation {
  phone: string;
  phoneFormatted: string;
  whatsappUrl: string;
  waitTime: number;
  timestamp: number;
  lastMessage: string;
  customerName?: string | null;
}

function formatPhoneDisplay(phone: string): string {
  const clean = String(phone).replace(/\D/g, "");
  const digits = clean.startsWith("55") && clean.length > 11 ? clean.slice(2) : clean;
  if (digits.length === 11) return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  if (digits.length === 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return phone;
}

const fetcher = (url: string) =>
  fetch(url)
    .then((res) => res.json())
    .then((data) => {
      const list = data.conversations || [];
      return list.map((c: { customer_phone: string; customer_name?: string | null; last_message_at?: string | null; last_message?: string | null; last_direction?: string; message_count?: number }) => ({
        phone: c.customer_phone,
        phoneFormatted: formatPhoneDisplay(c.customer_phone),
        whatsappUrl: `https://wa.me/${c.customer_phone.replace(/\D/g, "").replace(/^(\d{10,11})$/, "55$1")}`,
        waitTime: 0,
        timestamp: c.last_message_at ? new Date(c.last_message_at).getTime() : Date.now(),
        lastMessage: c.last_message ?? "",
        customerName: c.customer_name ?? null,
      }));
    });

export default function AtendimentoPage() {
  const router = useRouter();
  const previousCountRef = useRef<number>(0);
  const [hasNewConversations, setHasNewConversations] = useState(false);
  const [selectedConv, setSelectedConv] = useState<PriorityConversation | null>(
    null
  );

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

  const {
    data: conversations,
    error,
    isLoading,
    mutate,
  } = useSWR<PriorityConversation[]>(
    "/api/admin/inbox/conversations",
    fetcher,
    {
      refreshInterval: 10000,
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      dedupingInterval: 5000,
    }
  );

  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission().catch((err) => {
        console.error("Erro ao solicitar permissão de notificação:", err);
      });
    }
  }, []);

  useEffect(() => {
    if (conversations && conversations.length > 0) {
      const currentCount = conversations.length;
      const previousCount = previousCountRef.current;
      if (currentCount > previousCount && previousCount > 0) {
        setHasNewConversations(true);
        if (Notification.permission === "granted") {
          new Notification("🔔 Novo Cliente Pediu Atendimento", {
            body: `${
              currentCount - previousCount
            } novo(s) cliente(s) aguardando`,
            icon: "/favicon.ico",
          });
        }
        setTimeout(() => setHasNewConversations(false), 5000);
      }
      previousCountRef.current = currentCount;
    } else if (conversations && conversations.length === 0) {
      previousCountRef.current = 0;
    }
  }, [conversations]);

  const formatWaitTime = (minutes: number): string => {
    if (minutes < 1) return "Agora";
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}min`;
  };

  return (
    <div className="min-h-screen bg-gray-100 py-6 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">
            Atendimento ao Cliente
          </h1>
          <p className="text-gray-600 text-sm">
            Responda clientes direto aqui. As mensagens são enviadas pelo
            WhatsApp.
          </p>
        </div>

        {isLoading && (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
            Erro ao carregar conversas.
          </div>
        )}

        {!isLoading &&
          !error &&
          conversations &&
          conversations.length === 0 && (
            <div className="bg-white rounded-xl shadow p-8 text-center">
              <CheckCircle2
                size={48}
                className="text-emerald-500 mx-auto mb-4"
              />
              <p className="text-gray-700 font-semibold mb-2">
                Nenhuma conversa ainda
              </p>
              <p className="text-gray-500 text-sm">
                As conversas dos clientes com o bot aparecerão aqui assim que alguém enviar mensagem.
              </p>
            </div>
          )}

        {!isLoading && !error && conversations && conversations.length > 0 && (
          <div className="flex gap-6 flex-col lg:flex-row">
            {/* Lista de conversas */}
            <div className="lg:w-80 flex-shrink-0">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-gray-900 flex items-center gap-2">
                  <MessageCircle size={20} />
                  Conversas
                </h2>
                <span
                  className={`px-3 py-1 text-white rounded-full text-sm font-semibold ${
                    hasNewConversations
                      ? "bg-green-600 animate-pulse"
                      : "bg-blue-600"
                  }`}
                >
                  {conversations.length}
                </span>
              </div>
              <div className="space-y-2">
                {conversations.map((conv) => (
                  <button
                    key={conv.phone}
                    onClick={() => setSelectedConv(conv)}
                    className={`w-full text-left p-4 rounded-xl transition-all ${
                      selectedConv?.phone === conv.phone
                        ? "bg-blue-600 text-white shadow-lg"
                        : "bg-white hover:bg-gray-50 shadow border border-gray-200"
                    }`}
                  >
                    <p className="font-semibold truncate">
                      {conv.phoneFormatted}
                    </p>
                    <p className="text-xs opacity-80 truncate">
                      {conv.lastMessage ? `"${conv.lastMessage.slice(0, 40)}${conv.lastMessage.length > 40 ? "…" : ""}"` : "Sem mensagens"}
                    </p>
                  </button>
                ))}
              </div>
              <button
                onClick={() => mutate()}
                className="mt-4 w-full py-2 text-sm text-gray-600 hover:text-gray-900"
              >
                Atualizar lista
              </button>
            </div>

            {/* Chat - celular + conversa */}
            <div className="flex-1 min-w-0">
              {selectedConv ? (
                <div className="flex justify-center lg:justify-start">
                  {/* Molde de celular */}
                  <div className="relative w-full max-w-md">
                    <div className="bg-gray-900 rounded-[3rem] p-3 shadow-2xl border-4 border-gray-800">
                      {/* Notch */}
                      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-gray-900 rounded-b-2xl z-10" />
                      {/* Tela */}
                      <div className="bg-gray-800 rounded-[2.25rem] overflow-hidden aspect-[9/19] min-h-[500px]">
                        <ChatAtendimento
                          phone={selectedConv.phone}
                          phoneFormatted={selectedConv.phoneFormatted}
                          waitTime={selectedConv.waitTime}
                          onClose={() => setSelectedConv(null)}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-xl shadow p-12 text-center border border-gray-200">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                    <MessageCircle className="text-gray-400" size={32} />
                  </div>
                  <p className="text-gray-600 font-medium mb-1">
                    Selecione uma conversa
                  </p>
                  <p className="text-gray-500 text-sm">
                    Clique em um cliente na lista para abrir o chat e responder
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
