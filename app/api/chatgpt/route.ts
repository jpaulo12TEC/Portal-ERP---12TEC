// app/api/chatgpt/route.ts

import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { prompt } = body;

  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    console.error("Chave da OpenAI não configurada!");
    return NextResponse.json({ error: "Chave da OpenAI ausente" }, { status: 500 });
  }

  try {
    const resposta = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "Você é um assistente...",
          },
          { role: "user", content: prompt },
        ],
        max_tokens: 100,
      }),
    });

    const dados = await resposta.json();

    const content = dados?.choices?.[0]?.message?.content;

    if (!content) {
      console.error("Resposta inválida da OpenAI:", dados);
      return NextResponse.json({ error: "Resposta inválida da OpenAI" }, { status: 500 });
    }

    const resultado = JSON.parse(content);
    return NextResponse.json(resultado);
  } catch (error) {
    console.error("Erro ao conectar com o ChatGPT:", error);
    return NextResponse.json({ error: "Erro ao conectar com ChatGPT" }, { status: 500 });
  }
}
