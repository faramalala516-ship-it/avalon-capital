export function FinancialBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden terminal-grid">
      <div className="absolute left-[-10%] top-[12%] h-px w-[120%] animate-[pulse_8s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-bullion/60 to-transparent" />
      <div className="absolute bottom-[18%] left-0 h-px w-full animate-[pulse_10s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-cobalt/70 to-transparent" />
      <div className="absolute inset-x-0 top-0 h-80 bg-gradient-to-b from-cobalt/10 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-80 bg-gradient-to-t from-obsidian to-transparent" />
    </div>
  );
}
