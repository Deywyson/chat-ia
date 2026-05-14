"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "./lib/supabase";

type Chat = {
  id: number;
  titulo: string;
  created_at: string;
};

type Message = {
  role: "user" | "ai";
  text: string;
};

const mensagemPadrao =
  "Saudações, jovem padawan. Eu sou o YodAI. Em que posso ajudar?";

export default function Home() {
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChat, setActiveChat] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [musicOn, setMusicOn] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    loadChats();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages, loading]);

  function playSound(src: string, volume = 0.5) {
    const audio = new Audio(src);
    audio.volume = volume;
    audio.play();
  }

  function toggleMusic() {
    const audioElement = document.getElementById(
      "bg-music"
    ) as HTMLAudioElement;

    if (!audioElement) return;

    if (musicOn) {
      audioElement.pause();
    } else {
      audioElement.volume = 0.15;
      audioElement.play();
    }

    setMusicOn(!musicOn);
  }

  async function loadChats() {
    const { data } = await supabase
      .from("chats")
      .select("*")
      .order("created_at", { ascending: false });

    if (data && data.length > 0) {
      setChats(data);
      setActiveChat(data[0].id);
      loadMessages(data[0].id);
    } else {
      createNewChat();
    }
  }

  async function loadMessages(chatId: number) {
    const { data } = await supabase
      .from("mensagens")
      .select("*")
      .eq("chat_id", chatId)
      .order("created_at", { ascending: true });

    if (!data || data.length === 0) {
      setMessages([{ role: "ai", text: mensagemPadrao }]);
      return;
    }

    const loadedMessages: Message[] = [
      { role: "ai", text: mensagemPadrao },
    ];

    data.forEach((item) => {
      loadedMessages.push({
        role: "user",
        text: item.pergunta,
      });

      loadedMessages.push({
        role: "ai",
        text: item.resposta,
      });
    });

    setMessages(loadedMessages);
  }

  async function createNewChat() {
    const { data } = await supabase
      .from("chats")
      .insert([{ titulo: "Novo chat" }])
      .select()
      .single();

    if (data) {
      setChats((prev) => [data, ...prev]);
      setActiveChat(data.id);

      setMessages([
        {
          role: "ai",
          text: mensagemPadrao,
        },
      ]);

      if (window.innerWidth < 768) {
        setSidebarOpen(false);
      }
    }
  }

  async function selectChat(chatId: number) {
    setActiveChat(chatId);
    await loadMessages(chatId);

    if (window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  }

  async function deleteChat(chatId: number) {
    playSound("/delete-chat.mp3", 0.8);

    await supabase
      .from("mensagens")
      .delete()
      .eq("chat_id", chatId);

    await supabase
      .from("chats")
      .delete()
      .eq("id", chatId);

    const updatedChats = chats.filter(
      (chat) => chat.id !== chatId
    );

    setChats(updatedChats);

    if (activeChat === chatId) {
      if (updatedChats.length > 0) {
        setActiveChat(updatedChats[0].id);
        loadMessages(updatedChats[0].id);
      } else {
        createNewChat();
      }
    }
  }

  async function sendMessage() {
    if (!input.trim() || loading || !activeChat) return;

    const userMessage = input;

    setInput("");
    setLoading(true);

    setMessages((prev) => [
      ...prev,
      {
        role: "user",
        text: userMessage,
      },
    ]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          message: userMessage,
          chatId: activeChat,
        }),
      });

      const data = await res.json();

      if (messages.length <= 1) {
        await supabase
          .from("chats")
          .update({
            titulo: userMessage.slice(0, 28),
          })
          .eq("id", activeChat);

        setChats((prev) =>
          prev.map((chat) =>
            chat.id === activeChat
              ? {
                  ...chat,
                  titulo: userMessage.slice(0, 28),
                }
              : chat
          )
        );
      }

      const respostaCompleta = data.reply || "";

      setMessages((prev) => [
        ...prev,
        {
          role: "ai",
          text: "",
        },
      ]);

      let index = 0;

      const interval = setInterval(() => {
        index++;

        setMessages((prev) => {
          const novasMensagens = [...prev];

          const ultimaMensagem =
            novasMensagens[novasMensagens.length - 1];

          if (ultimaMensagem?.role === "ai") {
            ultimaMensagem.text =
              respostaCompleta.slice(0, index);
          }

          return novasMensagens;
        });

        if (index >= respostaCompleta.length) {
          clearInterval(interval);
        }
      }, 20);

    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "ai",
          text:
            "Algo errado aconteceu na Força. Tente novamente.",
        },
      ]);
    }

    setLoading(false);
  }

  return (
    <main className="h-screen bg-[#020a05] text-white flex overflow-hidden">

      <audio id="bg-music" loop>
        <source
          src="/space-theme.mp3"
          type="audio/mpeg"
        />
      </audio>

      <aside
        className={`
          h-full bg-black/80 border-r border-green-900/50
          flex flex-col overflow-hidden shrink-0
          transition-all duration-300 ease-in-out
          ${sidebarOpen ? "w-72 p-4" : "w-0 p-0 border-r-0"}
        `}
      >

        <div className="min-w-64">

          <div className="mb-6 flex items-center gap-3">

            <div className="w-14 h-14 rounded-2xl border border-green-400 bg-gradient-to-br from-green-300 via-green-700 to-black flex items-center justify-center shadow-[0_0_22px_#4ade80] overflow-hidden">

              <img
                src="/yoda.png"
                alt="YodAI"
                className="w-full h-full object-cover scale-125 drop-shadow-[0_0_15px_#bbf7d0]"
              />

            </div>

            <div>
              <h1 className="text-3xl font-black text-green-400 drop-shadow-[0_0_12px_#4ade80]">
                YodAI
              </h1>

              <p className="text-xs text-green-200">
                Conselho intergaláctico de IA
              </p>
            </div>

          </div>

          <button
            onClick={() => {
              playSound("/new-chat.mp3", 0.7);
              createNewChat();
            }}
            className="w-full mb-4 rounded-xl bg-green-500 hover:bg-green-400 text-black px-4 py-3 font-black transition shadow-[0_0_18px_#4ade80]"
          >
            + Novo chat
          </button>

          <div className="space-y-2 overflow-y-auto max-h-[calc(100vh-180px)] pr-1">

            {chats.map((chat) => (

              <div
                key={chat.id}
                className={`flex items-center gap-2 rounded-xl px-3 py-3 transition ${
                  activeChat === chat.id
                    ? "bg-green-500/20 border border-green-400 text-green-300"
                    : "bg-green-950/30 hover:bg-green-900/50 text-zinc-300"
                }`}
              >

                <button
                  onClick={() => selectChat(chat.id)}
                  className="flex-1 text-left truncate"
                >
                  {chat.titulo}
                </button>

                <button
                  onClick={() => deleteChat(chat.id)}
                  className="text-red-400 hover:text-red-300 font-bold"
                  title="Apagar chat"
                >
                  ✕
                </button>

              </div>

            ))}

          </div>

        </div>

      </aside>

      <section className="flex-1 min-w-0 min-h-0 flex flex-col bg-[radial-gradient(circle_at_top,#0f3d1f,#020a05_60%)]">

        <header className="p-3 md:p-5 border-b border-green-900/50 bg-black/40 shrink-0">

          <div className="flex items-center gap-3 md:gap-4">

            <button
              onClick={() =>
                setSidebarOpen(!sidebarOpen)
              }
              className="rounded-xl border border-green-400/40 px-3 py-2 text-green-300 hover:bg-green-400 hover:text-black transition"
            >
              {sidebarOpen ? "←" : "☰"}
            </button>

            <div className="w-14 h-14 md:w-24 md:h-24 rounded-2xl md:rounded-3xl border border-green-400 bg-gradient-to-br from-green-300 via-green-700 to-black flex items-center justify-center shadow-[0_0_25px_#4ade80] overflow-hidden shrink-0">

              <img
                src="/yoda.png"
                alt="YodAI"
                className="w-full h-full object-cover scale-125 drop-shadow-[0_0_15px_#bbf7d0]"
              />

            </div>

            <div className="min-w-0">

              <h2 className="text-3xl md:text-5xl font-black tracking-wide text-green-300 drop-shadow-[0_0_12px_#4ade80] leading-none">
                YodAI
              </h2>

              <p className="hidden sm:block text-xs md:text-sm text-green-200 truncate">
                Sábia IA da galáxia • online • digitando com a Força
              </p>

            </div>

            <button
              onClick={toggleMusic}
              className="ml-auto rounded-xl border border-green-400/40 px-3 md:px-4 py-2 text-xs md:text-base text-green-300 hover:bg-green-400 hover:text-black transition shrink-0"
            >
              {musicOn ? "Pausar" : "Música"}
            </button>

          </div>

        </header>

        <div className="flex-1 min-h-0 overflow-y-auto p-3 md:p-6 space-y-4 md:space-y-5">

          {messages.map((msg, index) => (

            <div
              key={index}
              className={`flex ${
                msg.role === "user"
                  ? "justify-end"
                  : "justify-start"
              }`}
            >

              <div
                className={`max-w-[92%] md:max-w-[75%] rounded-3xl px-4 md:px-5 py-3 md:py-4 shadow-xl ${
                  msg.role === "user"
                    ? "bg-green-500 text-black rounded-br-md font-medium"
                    : "bg-black/70 border border-green-400/30 text-green-100 rounded-bl-md text-sm md:text-base leading-6"
                }`}
              >

                <p className="whitespace-pre-wrap break-words">
                  {msg.text}
                </p>

              </div>

            </div>

          ))}

          {loading && (

            <div className="flex justify-start">

              <div className="bg-black/70 border border-green-400/30 rounded-3xl rounded-bl-md px-5 py-4">

                <p className="text-green-300 text-sm mb-2">
                  YodAI está digitando...
                </p>

                <div className="flex gap-2">

                  <span className="w-2 h-2 bg-green-400 rounded-full animate-bounce"></span>

                  <span className="w-2 h-2 bg-green-400 rounded-full animate-bounce [animation-delay:0.15s]"></span>

                  <span className="w-2 h-2 bg-green-400 rounded-full animate-bounce [animation-delay:0.3s]"></span>

                </div>

              </div>

            </div>

          )}

          <div ref={messagesEndRef} />

        </div>

        <footer className="p-3 md:p-5 border-t border-green-900/50 bg-black/50 shrink-0">

          <div className="flex gap-2 md:gap-3">

            <input
              value={input}
              onChange={(e) =>
                setInput(e.target.value)
              }

              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  sendMessage();
                }
              }}

              placeholder="Envie sua mensagem..."

              className="min-w-0 flex-1 rounded-2xl bg-black/70 border border-green-700 px-4 md:px-5 py-3 md:py-4 outline-none focus:border-green-400 transition"
            />

            <button
              onClick={sendMessage}
              disabled={loading}
              className="rounded-2xl bg-green-400 hover:bg-green-300 text-black px-4 md:px-7 py-3 md:py-4 font-black disabled:opacity-50 transition shadow-[0_0_18px_#4ade80] shrink-0"
            >
              Enviar
            </button>

          </div>

        </footer>

      </section>

    </main>
  );
}