import { cn } from "@/lib/utils";

export function MetricCard({
  label,
  value,
  detail,
  tone = "neutral"
}: {
  label: string;
  value: string;
  detail: string;
  tone?: "positive" | "negative" | "neutral";
}) {
  return (
    <div className="glass rounded-lg p-5">
      <p className="text-sm text-slate-400">{label}</p>
      <div className="mt-3 flex items-end justify-between gap-4">
        <strong className="text-3xl font-semibold text-white">{value}</strong>
        <span
          className={cn(
            "rounded-md px-2 py-1 text-xs font-semibold",
            tone === "positive" && "bg-emerald/10 text-emerald",
            tone === "negative" && "bg-red-500/10 text-red-300",
            tone === "neutral" && "bg-white/10 text-slate-300"
          )}
        >
          {detail}
        </span>
      </div>
    </div>
  );
}
