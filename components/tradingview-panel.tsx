"use client";

import { useEffect, useRef } from "react";

declare global {
  interface Window {
    TradingView?: {
      widget: new (options: Record<string, unknown>) => unknown;
    };
  }
}

export function TradingViewPanel({ symbol = "NASDAQ:NDX" }: { symbol?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) {
      return;
    }

    if (!window.TradingView) {
      ref.current.innerHTML =
        "<div class='flex h-full items-center justify-center text-sm text-slate-400'>TradingView Advanced Charts: ajoutez charting_library/ pour activer le terminal proprietaire.</div>";
      return;
    }

    ref.current.innerHTML = "";
    new window.TradingView.widget({
      container: ref.current,
      symbol,
      interval: "60",
      theme: "dark",
      autosize: true,
      timezone: "Etc/UTC",
      locale: "fr",
      studies: ["Volume@tv-basicstudies", "RSI@tv-basicstudies", "MACD@tv-basicstudies"]
    });
  }, [symbol]);

  return <div ref={ref} className="h-[420px] w-full rounded-lg border border-white/10 bg-black/30" />;
}
