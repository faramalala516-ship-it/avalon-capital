import { describe, expect, it } from "vitest";
import { buildMarketAnalysis } from "../lib/market-ai";

describe("buildMarketAnalysis", () => {
  it("returns an institutional BTC analysis with support and probabilities", () => {
    const answer = buildMarketAnalysis("Analyse BTC");

    expect(answer).toContain("Bitcoin");
    expect(answer).toContain("Support");
    expect(answer).toContain("Scenarios");
  });
});
