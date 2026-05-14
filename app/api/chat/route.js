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

    let contexto = "HISTÓRICO DA CONVERSA:\n\n";

    ultimasMensagens.forEach((item) => {
      contexto += `Usuário: ${item.pergunta}\n`;
      contexto += `YodAI: ${item.resposta}\n\n`;
    });

    contexto += `
IMPORTANTE:
Analise o histórico acima. Se o usuário informou o próprio nome anteriormente, responda usando exatamente o nome que aparece no histórico. Não invente nomes. Nunca diga que não lembra se o nome estiver no histórico.

PERGUNTA ATUAL:
${message}
`;

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
                "Você é o YodAI, uma IA inteligente inspirada em ficção científica. Você recebe o histórico da conversa e deve usar esse histórico para lembrar informações que o usuário já disse, como nome, preferências e contexto. Se o usuário disser 'me chamo X', 'meu nome é X' ou algo parecido, memorize X dentro da conversa. Se depois perguntarem 'qual meu nome?', responda usando o nome que aparece no histórico. Nunca invente um nome. Nunca diga que não lembra se o nome estiver no histórico. Responda de forma natural, curta, clara e em português. Não use markdown.",
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