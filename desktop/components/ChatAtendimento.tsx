"use client";

import { useState, useRef, useEffect, useCallback } from "react";

export interface ChatMessage {
  id: string;
  text: string;
  isAttendant: boolean;
  timestamp: Date;
  status?: "sending" | "sent" | "error";
}

interface ChatAtendimentoProps {
  phone: string;
  phoneFormatted: string;
  waitTime?: number;
  onClose?: () => void;
}

export function ChatAtendimento({
  phone,
  phoneFormatted,
  waitTime = 0,
  onClose,
}: ChatAtendimentoProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  const fetchMessages = useCallback(async () => {
    const p = phone.replace(/\D/g, "");
    const query = p.length >= 10 ? (p.startsWith("55") ? p : `55${p}`) : p;
    if (!query) return;
    try {
      const res = await fetch(
        `/api/admin/inbox/conversations/${encodeURIComponent(query)}?_=${Date.now()}`,
        { credentials: "same-origin" }
      );
      const data = await res.json();
      if (res.ok && Array.isArray(data.messages)) {
        setMessages(
          data.messages.map((m: { id: string; body: string; direction: string; created_at: string }) => ({
            id: m.id,
            text: m.body,
            isAttendant: m.direction === "out",
            timestamp: new Date(m.created_at),
            status: "sent" as const,
          }))
        );
      }
    } catch (_) {
      setMessages([]);
    } finally {
      setLoadingHistory(false);
    }
  }, [phone]);

  useEffect(() => {
    setLoadingHistory(true);
    fetchMessages();
  }, [fetchMessages]);

  useEffect(() => {
    const interval = setInterval(fetchMessages, 3000);
    return () => clearInterval(interval);
  }, [fetchMessages]);

  useEffect(() => {
    scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight);
  }, [messages]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || sending) return;
    setInput("");
    const tempId = `temp-${Date.now()}`;
    const newMsg: ChatMessage = {
      id: tempId,
      text,
      isAttendant: true,
      timestamp: new Date(),
      status: "sending",
    };
    setMessages((m) => [...m, newMsg]);

    try {
      setSending(true);
      const res = await fetch("/api/admin/send-whatsapp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          phone: (() => {
            let p = phone.replace(/\D/g, "");
            if (!p.startsWith("55") && p.length >= 10) p = "55" + p;
            return p;
          })(),
          message: text,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setMessages((m) =>
          m.map((msg) =>
            msg.id === tempId ? { ...msg, status: "sent" as const } : msg
          )
        );
        fetchMessages();
      } else {
        setMessages((m) =>
          m.map((msg) =>
            msg.id === tempId ? { ...msg, status: "error" as const } : msg
          )
        );
      }
    } catch (_) {
      setMessages((m) =>
        m.map((msg) =>
          msg.id === tempId ? { ...msg, status: "error" as const } : msg
        )
      );
    } finally {
      setSending(false);
    }
  };

  const formatTime = (d: Date) =>
    d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

  return (
    <div className="flex flex-col h-full bg-primary-50 rounded-2xl overflow-hidden shadow-2xl border border-gray-200">
      {/* Header - estilo do app */}
      <div className="flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-200">
        {onClose && (
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg text-gray-700"
            aria-label="Voltar"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
        )}
        <div className="w-10 h-10 rounded-full bg-primary-600 flex items-center justify-center">
          <svg
            className="w-6 h-6 text-white"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold truncate text-gray-900">{phoneFormatted}</p>
          <p className="text-xs text-gray-500">Histórico da conversa</p>
        </div>
      </div>

      {/* Mensagens */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-2 bg-primary-50"
      >
        {loadingHistory && (
          <div className="flex justify-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary-600 border-t-transparent" />
          </div>
        )}
        {!loadingHistory && messages.length === 0 && (
          <p className="text-center text-gray-500 text-sm py-4">Nenhuma mensagem ainda. Envie a primeira!</p>
        )}
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${
              msg.isAttendant ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-[75%] px-3 py-2 rounded-lg shadow ${
                msg.isAttendant
                  ? "bg-primary-600 text-white rounded-tr-none"
                  : "bg-white text-gray-900 border border-gray-200 border-l-0 rounded-tl-none"
              }`}
            >
              <p className="text-sm whitespace-pre-wrap break-words">
                {msg.text}
              </p>
              <div className="flex items-center justify-end gap-1 mt-1">
                <span
                  className={`text-[10px] ${
                    msg.isAttendant ? "text-white/80" : "text-gray-500"
                  }`}
                >
                  {formatTime(msg.timestamp)}
                </span>
                {msg.isAttendant && msg.status === "sending" && (
                  <span className="text-[10px]">⏳</span>
                )}
                {msg.isAttendant && msg.status === "error" && (
                  <span className="text-[10px] text-red-500">Falhou</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Input - bg até embaixo */}
      <div className="p-3 bg-white border-t border-gray-200 flex gap-2 items-end">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              sendMessage();
            }
          }}
          placeholder="Digite sua mensagem..."
          rows={1}
          className="flex-1 resize-none rounded-lg px-4 py-2.5 bg-primary-50 text-gray-900 placeholder-gray-500 border border-gray-200 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm max-h-24"
        />
        <button
          onClick={sendMessage}
          disabled={!input.trim() || sending}
          className="p-2.5 rounded-full bg-primary-600 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary-700 transition-colors"
          aria-label="Enviar"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
          </svg>
        </button>
      </div>
    </div>
  );
}
