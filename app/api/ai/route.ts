import Groq from "groq-sdk";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";
import { NextResponse } from "next/server";
import { prompts, PromptMode } from "@/app/lib/prompts";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY!,
});

const TASKS_MODEL = "moonshotai/kimi-k2-instruct";
const WEB_SEARCH_MODEL = "groq/compound";
const CHUNK_SIZE = 40000;

function splitIntoChunks(content: string, maxChars: number): string[] {
  if (content.length <= maxChars) return [content];

  const chunks: string[] = [];
  const paragraphs = content.split(/(?<=<\/p>|<\/h[1-6]>|<\/li>|<br\s*\/?>)/i);

  let currentChunk = "";
  for (const paragraph of paragraphs) {
    if ((currentChunk + paragraph).length > maxChars && currentChunk) {
      chunks.push(currentChunk);
      currentChunk = paragraph;
    } else {
      currentChunk += paragraph;
    }
  }
  if (currentChunk) chunks.push(currentChunk);

  return chunks;
}

async function processLongContent(
  content: string,
  systemPrompt: string,
  model: string,
): Promise<string> {
  const chunks = splitIntoChunks(content, CHUNK_SIZE);

  const chunkSummaries: string[] = [];

  const chunkResults = await Promise.all(
    chunks.map(async (chunk, i) => {
      const contextPrefix =
        i > 0 && chunkSummaries[i - 1]
          ? `[Context from previous sections: ${chunkSummaries[i - 1]}]\n\n`
          : "";

      const result = await groq.chat.completions.create({
        model,
        max_tokens: 2048,
        stream: false,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: contextPrefix + chunk },
        ],
      });

      const text = result.choices[0]?.message?.content ?? "";

      chunkSummaries[i] = text.slice(0, 300).replace(/\s+/g, " ").trim();

      return text;
    }),
  );

  const combined = chunkResults.join("\n");

  const finalResult = await groq.chat.completions.create({
    model,
    max_tokens: 4096,
    stream: false,
    messages: [
      {
        role: "system",
        content: `You are a note assembly assistant. You will receive multiple cleaned sections of a single note that were processed separately. Combine them into one cohesive, well-structured document. Remove duplicate headings or repeated content. Maintain logical flow. Return only clean HTML.`,
      },
      { role: "user", content: combined },
    ],
  });

  return finalResult.choices[0]?.message?.content ?? combined;
}

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

  const model =
    mode === "clean" || mode === "summarize" || mode === "extractTasks"
      ? TASKS_MODEL
      : WEB_SEARCH_MODEL;

  const isChunkableMode =
    mode === "clean" || mode === "summarize" || mode === "elaborate";

  if (content.length > CHUNK_SIZE && isChunkableMode) {
    const result = await processLongContent(content, systemPrompt, model);
    return new Response(result, {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }

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
