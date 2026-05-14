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
    console.error(error);

    return Response.json({
      reply: "Erro ao responder.",
    });
  }
}