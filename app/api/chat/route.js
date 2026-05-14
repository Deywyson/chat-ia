import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(req) {
  try {
    const body = await req.json();
    const message = body.message;

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

    const model = genAI.getGenerativeModel({
     model: "gemini-2.5-flash",
    });

    const result = await model.generateContent(message);

    const response = await result.response;

    const text = response.text();

    return Response.json({
      reply: text,
    });

  } catch (error) {
  console.error("ERRO GEMINI:", error);

  if (error.status === 429) {
    return Response.json({
      reply: "Muitas mensagens em pouco tempo. Aguarde alguns segundos e tente novamente."
    });
  }

  return Response.json({
    reply: "Erro ao responder."
  });
}
  }
