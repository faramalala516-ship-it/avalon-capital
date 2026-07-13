"use client";

import { useQuery } from "@tanstack/react-query";

async function getJson<T>(url: string): Promise<T> {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export function useReports() {
  return useQuery({
    queryKey: ["reports"],
    queryFn: () => getJson<{ reports: unknown[] }>("/api/reports")
  });
}

export function useTradingSignals() {
  return useQuery({
    queryKey: ["trading-signals"],
    queryFn: () => getJson<{ signals: unknown[] }>("/api/trading/signals")
  });
}

export function useMacroEvents() {
  return useQuery({
    queryKey: ["macro-events"],
    queryFn: () => getJson<{ indicators: unknown[]; centralBanks: unknown[] }>("/api/macro/events")
  });
}

export function useGemstones() {
  return useQuery({
    queryKey: ["gemstones"],
    queryFn: () => getJson<{ gemstones: unknown[] }>("/api/gemstones")
  });
}
