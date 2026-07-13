import { CalendarDays } from "lucide-react";
import { PageShell } from "@/components/page-shell";

const events = [
  ["Lundi", "PMI Manufacturier", "USD", "High"],
  ["Mardi", "CPI Flash", "EUR", "High"],
  ["Mercredi", "FOMC Minutes", "USD", "Critical"],
  ["Jeudi", "BoJ Outlook", "JPY", "Medium"],
  ["Vendredi", "NFP", "USD", "Critical"]
];

export default function EconomicCalendarPage() {
  return (
    <PageShell title="Calendrier economique" eyebrow="Macro events" description="Evenements macro, consensus, surprises et impact multi-assets." icon={CalendarDays}>
      <div className="glass overflow-hidden rounded-lg">
        {events.map((event) => (
          <div key={event.join("-")} className="grid grid-cols-4 gap-4 border-b border-white/10 p-4 text-sm last:border-b-0">
            {event.map((cell) => <span key={cell}>{cell}</span>)}
          </div>
        ))}
      </div>
    </PageShell>
  );
}
