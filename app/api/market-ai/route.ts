import OpenAI from "openai";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getAgentPromptProfile } from "@/lib/agent-prompts";
import { institutionalControls } from "@/lib/api-status";
import { buildAgentAnalysis } from "@/lib/market-ai";

const schema = z.object({
  question: z.string().min(2).max(1000),
  agentId: z.string().min(2).max(64).optional()
});

type ProviderStatus =
  | "openai_live"
  | "openai_not_configured"
  | "openai_billing_inactive"
  | "openai_rate_limited"
  | "openai_auth_error"
  | "openai_unavailable";

function getProviderStatus(error: unknown): ProviderStatus {
  const maybeError = error as {
    status?: number;
    code?: string;
    type?: string;
    error?: { code?: string; type?: string };
  };
  const code = maybeError?.code ?? maybeError?.error?.code;
  const type = maybeError?.type ?? maybeError?.error?.type;

  if (code === "billing_not_active" || type === "billing_not_active") {
    return "openai_billing_inactive";
  }

  if (maybeError?.status === 429) {
    return "openai_rate_limited";
  }

  if (maybeError?.status === 401 || maybeError?.status === 403) {
    return "openai_auth_error";
  }

  return "openai_unavailable";
}

function buildFallbackResponse(question: string, agentId: string | undefined, providerStatus: ProviderStatus) {
  const agentProfile = getAgentPromptProfile(agentId);

  return {
    answer: buildAgentAnalysis(question, agentId),
    agent: agentProfile.name,
    source: "local-fallback",
    providerStatus,
    compliance: institutionalControls
  };
}

export function GET() {
  return NextResponse.json({
    service: "market-ai",
    status: process.env.OPENAI_API_KEY ? "openai_configured" : "fallback_ready",
    supportedAgents: [
      "macro-x",
      "gem-trading-x",
      "macro-policy",
      "sentiment",
      "swing",
      "daily",
      "cross-asset",
      "risk",
      "portfolio",
      "gemini"
    ],
    compliance: institutionalControls
  });
}

export async function POST(request: Request) {
  const payload = schema.safeParse(await request.json());

  if (!payload.success) {
    return NextResponse.json({ error: "Question invalide" }, { status: 400 });
  }

  const agentProfile = getAgentPromptProfile(payload.data.agentId);

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(buildFallbackResponse(payload.data.question, payload.data.agentId, "openai_not_configured"));
  }

  try {
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const response = await client.responses.create({
      model: process.env.OPENAI_MODEL ?? "gpt-5.6-luna",
      input: [
        {
          role: "system",
          content: agentProfile.systemPrompt
        },
        {
          role: "user",
          content: `Agent selectionne: ${agentProfile.name}
Demande utilisateur: ${payload.data.question}

Rappel de validation obligatoire:
- Ne pas inventer de prix, chiffres macro, flux, news, options, COT ou evenements non fournis.
- Classer les donnees utilisees: fourni, contexte Avalon, hypothese ou non fourni.
- Inclure validation institutionnelle, donnees manquantes, hypotheses, invalidation et conditions de non-trade/non-allocation.`
        }
      ],
      text: {
        format: {
          type: "json_schema",
          name: "market_analysis",
          schema: {
            type: "object",
            additionalProperties: false,
            properties: {
              answer: { type: "string" }
            },
            required: ["answer"]
          }
        }
      }
    });

    const output = response.output_text
      ? (JSON.parse(response.output_text) as { answer: string })
      : { answer: buildAgentAnalysis(payload.data.question, payload.data.agentId) };
    return NextResponse.json({
      ...output,
      agent: agentProfile.name,
      source: "openai",
      providerStatus: "openai_live",
      compliance: institutionalControls
    });
  } catch (error) {
    return NextResponse.json(
      buildFallbackResponse(payload.data.question, payload.data.agentId, getProviderStatus(error))
    );
  }
}
