import Groq from "groq-sdk";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";
import { NextResponse } from "next/server";
import { prompts, PromptMode } from "@/app/lib/prompts";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY!,
});

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { content, mode } = await req.json();

  if (!content || !mode) {
    return NextResponse.json(
      { error: "Missing content or mode" },
      { status: 400 },
    );
  }

  const systemPrompt = prompts[mode as PromptMode];
  if (!systemPrompt) {
    return NextResponse.json({ error: "Invalid mode" }, { status: 400 });
  }

  if (mode === "titleTag") {
    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      max_tokens: 200,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content },
      ],
    });

    const text = completion.choices[0]?.message?.content ?? "";

    try {
      const clean = text.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(clean);
      return NextResponse.json(parsed);
    } catch {
      return NextResponse.json(
        { error: "Failed to parse AI response" },
        { status: 500 },
      );
    }
  }

  const stream = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    max_tokens: 2048,
    stream: true,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content },
    ],
  });

  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    async start(controller) {
      for await (const chunk of stream) {
        const text = chunk.choices[0]?.delta?.content ?? "";
        if (text) {
          controller.enqueue(encoder.encode(text));
        }
      }
      controller.close();
    },
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Transfer-Encoding": "chunked",
    },
  });
}
