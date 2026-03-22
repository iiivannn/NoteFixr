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
  const TASKS_MODEL = "moonshotai/kimi-k2-instruct";
  const WEB_SEARCH_MODEL = "groq/compound";

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

  const model =
    mode === "clean" || mode === "summarize" || mode === "extractTasks"
      ? TASKS_MODEL
      : WEB_SEARCH_MODEL;

  const stream = await groq.chat.completions.create({
    model,
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
