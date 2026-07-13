import { NextResponse } from "next/server";
import { z } from "zod";
import { avalonTools, runAvalonAgent } from "@/lib/agents";

const schema = z.object({
  prompt: z.string().min(2).max(1000)
});

export async function GET() {
  return NextResponse.json({ tools: avalonTools });
}

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json({ error: "Prompt invalide" }, { status: 400 });
  }

  return NextResponse.json(runAvalonAgent(parsed.data.prompt));
}
