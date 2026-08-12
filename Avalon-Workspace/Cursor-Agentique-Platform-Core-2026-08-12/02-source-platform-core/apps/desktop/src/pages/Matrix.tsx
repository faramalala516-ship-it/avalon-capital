import { useEffect, useState } from "react";
import { fetchJson } from "../lib/api";
import { frStatus } from "../lib/i18n";

type MatrixData = {
  nodes: { id: string; kind: string }[];
  edges: { from: string; to: string; active: boolean }[];
};

const kindFr: Record<string, string> = {
  agent: "agent",
  core: "noyau",
  service: "service",
  broker: "courtier",
  vault: "coffre",
  network: "réseau"
};

export default function Matrix() {
  const [data, setData] = useState<MatrixData | null>(null);
  useEffect(() => {
    void fetchJson<MatrixData>("/v1/matrix").then(setData).catch(() => setData(null));
  }, []);

  return (
    <>
      <h1 className="page-title">La Matrice</h1>
      <p className="page-sub">Topologie live du Core — pas une animation décorative.</p>
      {!data ? (
        <p className="status-warn">Matrice indisponible</p>
      ) : (
        <>
          <div className="matrix">
            {data.nodes.map((n) => {
              const active = data.edges.some((e) => (e.from === n.id || e.to === n.id) && e.active);
              return (
                <div className={`node ${active ? "active" : ""}`} key={n.id}>
                  <div className="label">{kindFr[n.kind] ?? n.kind}</div>
                  <div className="mono">{n.id}</div>
                </div>
              );
            })}
          </div>
          <div className="edge-list">
            {data.edges.map((e, i) => (
              <div key={i}>
                {e.from} ↔ {e.to} · {e.active ? frStatus("ACTIVE") : frStatus("idle")}
              </div>
            ))}
          </div>
        </>
      )}
    </>
  );
}
