import { useEffect, useState } from "react";
import { fetchJson } from "../lib/api";

type MatrixData = {
  nodes: { id: string; kind: string }[];
  edges: { from: string; to: string; active: boolean }[];
};

export default function Matrix() {
  const [data, setData] = useState<MatrixData | null>(null);
  useEffect(() => {
    void fetchJson<MatrixData>("/v1/matrix").then(setData).catch(() => setData(null));
  }, []);

  return (
    <>
      <h1 className="page-title">The Matrix</h1>
      <p className="page-sub">Live topology from Core — not a decorative animation.</p>
      {!data ? <p className="status-warn">Matrix unavailable</p> : (
        <>
          <div className="matrix">
            {data.nodes.map((n) => {
              const active = data.edges.some((e) => (e.from === n.id || e.to === n.id) && e.active);
              return (
                <div className={`node ${active ? "active" : ""}`} key={n.id}>
                  <div className="label">{n.kind}</div>
                  <div className="mono">{n.id}</div>
                </div>
              );
            })}
          </div>
          <div className="edge-list">
            {data.edges.map((e, i) => (
              <div key={i}>{e.from} ↔ {e.to} · {e.active ? "ACTIVE" : "idle"}</div>
            ))}
          </div>
        </>
      )}
    </>
  );
}
