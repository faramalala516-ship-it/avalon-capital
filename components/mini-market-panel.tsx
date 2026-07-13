import { marketSeries } from "@/lib/data";

export function MiniMarketPanel() {
  const values = marketSeries.map((point) => point.gold);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const points = values
    .map((value, index) => {
      const x = (index / (values.length - 1)) * 100;
      const y = 92 - ((value - min) / (max - min)) * 74;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <div className="relative h-72 w-full overflow-hidden rounded-lg border border-white/10 bg-black/30">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,.06)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.06)_1px,transparent_1px)] bg-[length:44px_44px]" />
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full">
        <defs>
          <linearGradient id="miniChartFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#d8aa46" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#d8aa46" stopOpacity="0" />
          </linearGradient>
        </defs>
        <polygon points={`0,100 ${points} 100,100`} fill="url(#miniChartFill)" />
        <polyline points={points} fill="none" stroke="#d8aa46" strokeWidth="1.3" vectorEffect="non-scaling-stroke" />
      </svg>
      <div className="absolute left-4 top-4">
        <p className="text-xs uppercase tracking-[.2em] text-slate-500">XAUUSD model</p>
        <p className="mt-1 text-2xl font-semibold text-white">4 120</p>
      </div>
      <div className="absolute bottom-4 right-4 rounded-md bg-emerald/10 px-2 py-1 text-xs font-semibold text-emerald">
        Hedge macro actif
      </div>
    </div>
  );
}
