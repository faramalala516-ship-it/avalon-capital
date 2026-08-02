import { useEffect, useState } from "react";
import { fetchJson } from "../lib/api";

type Ev = {
  timestamp: string;
  event_type: string;
  source: string;
  payload: unknown;
};

export default function Audit() {
  const [events, setEvents] = useState<Ev[]>([]);

  useEffect(() => {
    void fetchJson<Ev[]>("/v1/events").then(setEvents).catch(() => setEvents([]));
  }, []);

  function exportJson() {
    const blob = new Blob([JSON.stringify(events, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "avalon-events.json";
    a.click();
  }

  return (
    <>
      <h1 className="page-title">Audit / flux d’événements</h1>
      <p className="page-sub">
        L’audit anti-falsification est stocké par le Core. L’UI affiche les événements récents sans secrets.
      </p>
      <button onClick={exportJson}>Exporter JSON</button>
      <div className="panel stream">
        {events.map((e, i) => (
          <div key={i}>
            {e.timestamp} · {e.source} · {e.event_type}
          </div>
        ))}
        {events.length === 0 ? <div>Aucun événement pour le moment.</div> : null}
      </div>
    </>
  );
}
