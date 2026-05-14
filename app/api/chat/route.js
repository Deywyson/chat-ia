import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export async function POST(req) {
  try {
    const body = await req.json();
    const message = body.message;
    const chatId = body.chatId;

    const { data: historico } = await supabase
      .from("mensagens")
      .select("*")
      .eq("chat_id", chatId)
      .order("created_at", { ascending: true });

    let contexto = "";

    if (historico && historico.length > 0) {
      const ultimasMensagens = historico.slice(-5);

      ultimasMensagens.forEach((item) => {
        contexto += `Usuário: ${item.pergunta}\n`;
        contexto += `YodAI: ${item.resposta}\n`;
      });
    }

    contexto += `Usuário: ${message}`;

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://chat-t1kz7n0h7-deywyson-s-projects.vercel.app",
        "X-Title": "YodAI",
      },
      body: JSON.stringify({
        model: "openrouter/free",
       messages: [
  {
    role: "system",
    content:
      "Você é o YodAI, uma IA em português com estilo sábio e divertido. Responda de forma natural, clara e organizada. Não use markdown. Não use asteriscos, títulos com ##, blocos de citação ou símbolos como >. Use frases curtas, parágrafos simples e listas apenas quando necessário.",
  },
  {
    role: "user",
    content: contexto,
  },
],
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("ERRO OPENROUTER:", data);
      return Response.json({
        reply: "Erro ao responder pela API alternativa.",
      });
    }

    return Response.json({
      reply: data.choices?.[0]?.message?.content || "Não consegui responder.",
    });
  } catch (error) {
    console.error("ERRO API:", error);

    return Response.json({
      reply: "Erro ao responder.",
    });
  }
}