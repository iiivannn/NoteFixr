import Groq from "groq-sdk";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";
import { NextResponse } from "next/server";
import { prompts, PromptMode } from "@/app/lib/prompts";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY!,
});

const TASKS_MODEL = "openai/gpt-oss-120b";
const WEB_SEARCH_MODEL = "groq/compound";
const CHUNK_SIZE = 40000;
const TPM_LIMIT = 8000;

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function estimateMaxTokens(content: string, systemPrompt: string): number {
  const inputTokens = Math.ceil((content.length + systemPrompt.length) / 4);
  const available = TPM_LIMIT - inputTokens;
  return available > 0 ? available : 256;
}

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

      const userContent = contextPrefix + chunk;
      const result = await groq.chat.completions.create({
        model,
        max_tokens: estimateMaxTokens(userContent, systemPrompt),
        stream: false,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userContent },
        ],
      });

      const text = result.choices[0]?.message?.content ?? "";

      chunkSummaries[i] = text.slice(0, 300).replace(/\s+/g, " ").trim();

      return text;
    }),
  );

  const combined = chunkResults.join("\n");

  const assemblyPrompt = `You are a note assembly assistant. You will receive multiple cleaned sections of a single note that were processed separately. Combine them into one cohesive, well-structured document. Remove duplicate headings or repeated content. Maintain logical flow. Return only clean HTML.`;
  const finalResult = await groq.chat.completions.create({
    model,
    max_tokens: estimateMaxTokens(combined, assemblyPrompt),
    stream: false,
    messages: [
      {
        role: "system",
        content: assemblyPrompt,
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
  const plainContent = stripHtml(content);

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
    try {
      const result = await processLongContent(plainContent, systemPrompt, model);
      return new Response(result, {
        headers: { "Content-Type": "text/plain; charset=utf-8" },
      });
    } catch (err) {
      const is413 = (err as { status?: number })?.status === 413;
      return NextResponse.json(
        { error: is413
            ? "Your note is too large for the AI to process. Please paste a smaller amount of content and try again."
            : "Something went wrong — please try again."
        },
        { status: is413 ? 413 : 500 },
      );
    }
  }

  let stream;
  try {
    stream = await groq.chat.completions.create({
      model,
      max_tokens: estimateMaxTokens(plainContent, systemPrompt),
      stream: true,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: plainContent },
      ],
    });
  } catch (err) {
    const is413 = (err as { status?: number })?.status === 413;
    return NextResponse.json(
      { error: is413
          ? "Your note is too large for the AI to process. Please paste a smaller amount of content and try again."
          : "Something went wrong — please try again."
      },
      { status: is413 ? 413 : 500 },
    );
  }

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
