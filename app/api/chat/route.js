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

    const { data: historico, error } = await supabase
      .from("mensagens")
      .select("pergunta, resposta, created_at")
      .eq("chat_id", chatId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("ERRO SUPABASE:", error);
    }

    const ultimasMensagens = historico ? historico.slice(-10) : [];

    let contexto = "";

    ultimasMensagens.forEach((item) => {
      contexto += `Usuário: ${item.pergunta}\n`;
      contexto += `YodAI: ${item.resposta}\n`;
    });

    contexto += `Usuário: ${message}`;

    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer":
            "https://chat-t1kz7n0h7-deywyson-s-projects.vercel.app",
          "X-Title": "YodAI",
        },
        body: JSON.stringify({
          model: "openrouter/free",
          messages: [
            {
              role: "system",
              content:
                "Você é o YodAI, uma IA inteligente inspirada em Star Wars. Você DEVE usar o histórico da conversa para lembrar informações do usuário como nome, gostos e contexto. Se o usuário já disse o nome no histórico, responda corretamente com esse nome. Nunca diga que não tem acesso ao histórico se ele foi enviado. Responda de forma natural, curta, inteligente e amigável. Não use markdown, asteriscos ou símbolos desnecessários.",
            },
            {
              role: "user",
              content: contexto,
            },
          ],
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("ERRO OPENROUTER:", data);

      return Response.json({
        reply: "Erro ao responder pela API.",
      });
    }

    const reply =
      data.choices?.[0]?.message?.content ||
      "Não consegui responder agora.";

    await supabase.from("mensagens").insert([
      {
        chat_id: chatId,
        pergunta: message,
        resposta: reply,
      },
    ]);

    return Response.json({
      reply,
    });
  } catch (error) {
    console.error("ERRO API:", error);

    return Response.json({
      reply: "Erro ao responder.",
    });
  }
}