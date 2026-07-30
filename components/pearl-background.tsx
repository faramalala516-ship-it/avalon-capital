export function PearlBackground() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute -left-24 top-10 h-72 w-72 rounded-full bg-aqua-soft/40 blur-3xl animate-float" />
      <div className="absolute right-0 top-24 h-80 w-80 rounded-full bg-gold-soft/35 blur-3xl" />
      <div className="absolute bottom-0 left-1/3 h-64 w-64 rounded-full bg-aqua-mist/50 blur-3xl animate-float" style={{ animationDelay: "1.4s" }} />
      <div className="stone-grain absolute inset-0 opacity-40" />
      <div className="absolute left-[12%] top-[38%] h-40 w-40 rounded-full border border-gold/20 animate-ripple" />
      <div className="absolute left-[12%] top-[38%] h-40 w-40 rounded-full border border-aqua/25 animate-ripple" style={{ animationDelay: "1s" }} />
    </div>
  );
}
