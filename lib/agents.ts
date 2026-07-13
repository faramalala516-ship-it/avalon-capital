import { buildAgentAnalysis, buildMarketAnalysis } from "@/lib/market-ai";

export type AgentToolCall = {
  name: string;
  arguments: Record<string, string | number | boolean>;
};

export type AgentResult = {
  agent: "market-intelligence" | "macro-x" | "gem-trading-x" | "portfolio-risk" | "gemstone-valuation";
  toolCall: AgentToolCall;
  output: string;
};

export const avalonTools = [
  {
    name: "analyze_market",
    description: "Return fundamental, technical, macro and scenario analysis for a listed market.",
    parameters: {
      type: "object",
      properties: {
        question: { type: "string" }
      },
      required: ["question"]
    }
  },
  {
    name: "run_macro_x",
    description: "Return a top-down macroeconomic cycle, liquidity and cross-asset allocation report.",
    parameters: {
      type: "object",
      properties: {
        question: { type: "string" }
      },
      required: ["question"]
    }
  },
  {
    name: "run_gem_trading_x",
    description: "Return a structured trading report with macro, sentiment, technical levels, scenarios and risk plan.",
    parameters: {
      type: "object",
      properties: {
        question: { type: "string" }
      },
      required: ["question"]
    }
  },
  {
    name: "estimate_portfolio_risk",
    description: "Estimate portfolio VaR, drawdown and correlation regime.",
    parameters: {
      type: "object",
      properties: {
        riskProfile: { type: "string", enum: ["conservative", "balanced", "growth"] }
      },
      required: ["riskProfile"]
    }
  },
  {
    name: "rate_gemstone",
    description: "Rate gemstone rarity using origin, certification and carat information.",
    parameters: {
      type: "object",
      properties: {
        gemstoneType: { type: "string" },
        origin: { type: "string" },
        carat: { type: "number" }
      },
      required: ["gemstoneType", "origin", "carat"]
    }
  }
];

export function runAvalonAgent(prompt: string): AgentResult {
  const normalized = prompt.toLowerCase();

  if (normalized.includes("macro-x") || normalized.includes("macro x") || normalized.includes("top-down")) {
    return {
      agent: "macro-x",
      toolCall: { name: "run_macro_x", arguments: { question: prompt } },
      output: buildAgentAnalysis(prompt, "macro-x")
    };
  }

  if (
    normalized.includes("gem-trading") ||
    normalized.includes("gem trading") ||
    normalized.includes("tp1") ||
    normalized.includes("tp2") ||
    normalized.includes("tp3")
  ) {
    return {
      agent: "gem-trading-x",
      toolCall: { name: "run_gem_trading_x", arguments: { question: prompt } },
      output: buildAgentAnalysis(prompt, "gem-trading-x")
    };
  }

  if (normalized.includes("portfolio") || normalized.includes("portefeuille")) {
    return {
      agent: "portfolio-risk",
      toolCall: { name: "estimate_portfolio_risk", arguments: { riskProfile: "balanced" } },
      output: "VaR 95% estimee a 4.2%, drawdown attendu de 8.7%, correlation moyenne 0.31. Reequilibrage suggere vers duration courte, or et strategies market neutral."
    };
  }

  if (normalized.includes("gem") || normalized.includes("pierre") || normalized.includes("diamant")) {
    return {
      agent: "gemstone-valuation",
      toolCall: { name: "rate_gemstone", arguments: { gemstoneType: "diamond", origin: "tier-one", carat: 3.2 } },
      output: "Notation IA A: rarete elevee, certification prioritaire, liquidite dependante de l'origine et de l'absence de traitement."
    };
  }

  return {
    agent: "market-intelligence",
    toolCall: { name: "analyze_market", arguments: { question: prompt } },
    output: buildMarketAnalysis(prompt)
  };
}
