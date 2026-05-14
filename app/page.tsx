"use client";

import { useState } from "react";
import { supabase } from "./lib/supabase";

type Message = {
  role: "user" | "ai";
  text: string;
};

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "ai",
      text: "Olá! Eu sou a NexusAI. Como posso ajudar você hoje?",
    },
  ]);

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  async function sendMessage() {
    if (!input.trim() || loading) return;

    const userMessage = input;

    setMessages((prev) => [...prev, { role: "user", text: userMessage }]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: userMessage }),
      });

      const data = await res.json();

      await supabase.from("mensagens").insert([
        {
          pergunta: userMessage,
          resposta: data.reply,
        },
      ]);

      setMessages((prev) => [...prev, { role: "ai", text: data.reply }]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        { role: "ai", text: "Erro ao responder. Tente novamente." },
      ]);
    }

    setLoading(false);
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-zinc-950 via-slate-950 to-blue-950 text-white flex items-center justify-center p-4">
      <div className="w-full max-w-5xl h-[90vh] rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl flex flex-col overflow-hidden">
        <header className="p-6 border-b border-white/10 bg-black/20">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center font-bold text-xl shadow-lg">
              N
            </div>

            <div>
              <h1 className="text-3xl font-bold">NexusAI</h1>
              <p className="text-sm text-zinc-400">
                Assistente inteligente com IA e banco de dados
              </p>
            </div>
          </div>
        </header>

        <section className="flex-1 overflow-y-auto p-6 space-y-5">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`flex ${
                msg.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[80%] rounded-3xl px-5 py-4 leading-relaxed shadow-lg ${
                  msg.role === "user"
                    ? "bg-blue-600 text-white rounded-br-md"
                    : "bg-zinc-800/80 text-zinc-100 rounded-bl-md border border-white/10"
                }`}
              >
                <p className="whitespace-pre-wrap">{msg.text}</p>
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="bg-zinc-800/80 border border-white/10 rounded-3xl rounded-bl-md px-5 py-4 shadow-lg">
                <div className="flex gap-2">
                  <span className="w-2 h-2 bg-zinc-300 rounded-full animate-bounce"></span>
                  <span className="w-2 h-2 bg-zinc-300 rounded-full animate-bounce [animation-delay:0.15s]"></span>
                  <span className="w-2 h-2 bg-zinc-300 rounded-full animate-bounce [animation-delay:0.3s]"></span>
                </div>
              </div>
            </div>
          )}
        </section>

        <footer className="p-5 border-t border-white/10 bg-black/20">
          <div className="flex gap-3">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") sendMessage();
              }}
              placeholder="Digite sua mensagem..."
              className="flex-1 rounded-2xl bg-zinc-900/80 border border-white/10 px-5 py-4 outline-none focus:border-blue-500 transition"
            />

            <button
              onClick={sendMessage}
              disabled={loading}
              className="rounded-2xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed px-7 py-4 font-semibold shadow-lg transition"
            >
              Enviar
            </button>
          </div>
        </footer>
      </div>
    </main>
  );
}