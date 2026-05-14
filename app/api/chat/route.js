import { GoogleGenerativeAI } from "@google/generative-ai";
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

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash-lite",
    });

    // Buscar histórico do chat
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

    const result = await model.generateContent(contexto);

    const response = await result.response;

    const text = response.text();

    return Response.json({
      reply: text,
    });

  } catch (error) {
    console.error("ERRO GEMINI:", error);

    return Response.json({
      reply: "Erro ao responder.",
    });
  }
}