import OpenAI from "openai";
import { NextResponse } from "next/server";
import { z } from "zod";
import { buildConciergeReply, CONCIERGE_SYSTEM_PROMPT } from "@/lib/concierge-ai";

const schema = z.object({
  question: z.string().min(2).max(1000)
});

export function GET() {
  return NextResponse.json({
    service: "gses-concierge",
    status: process.env.OPENAI_API_KEY ? "openai_ready" : "local_fallback",
    expertise: ["gemmologie", "photographie", "galerie", "encheres"]
  });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Question invalide" }, { status: 400 });
  }

  const { question } = parsed.data;

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({
      answer: buildConciergeReply(question),
      source: "local-fallback",
      providerStatus: "openai_not_configured"
    });
  }

  try {
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const completion = await client.responses.create({
      model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
      input: [
        { role: "system", content: CONCIERGE_SYSTEM_PROMPT },
        { role: "user", content: question }
      ]
    });

    const answer =
      completion.output_text?.trim() ||
      buildConciergeReply(question);

    return NextResponse.json({
      answer,
      source: "openai",
      providerStatus: "openai_live"
    });
  } catch {
    return NextResponse.json({
      answer: buildConciergeReply(question),
      source: "local-fallback",
      providerStatus: "openai_unavailable"
    });
  }
}
