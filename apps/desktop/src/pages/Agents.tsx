import { useEffect, useState } from "react";
import { fetchJson, statusClass } from "../lib/api";

type Agent = {
  status: string;
  workspace: string;
  last_error?: string | null;
  manifest: {
    agent_id: string;
    name: string;
    version: string;
    publisher?: string;
  };
};

export default function Agents() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Agent | null>(null);

  async function load() {
    try {
      const list = await fetchJson<Agent[]>("/v1/agents");
      setAgents(list);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "failed");
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function start(id: string) {
    await fetchJson(`/v1/agents/${id}/start`, { method: "POST" });
    await load();
  }
  async function stop(id: string) {
    await fetchJson(`/v1/agents/${id}/stop`, { method: "POST" });
    await load();
  }

  return (
    <>
      <h1 className="page-title">Agent Control Center</h1>
      <p className="page-sub">Real runtime state from Avalon Agent Host.</p>
      {error ? <p className="status-bad">{error}</p> : null}
      {agents.map((a) => (
        <div className="agent-row" key={a.manifest.agent_id}>
          <div>
            <strong>{a.manifest.name}</strong>
            <div className="mono">{a.manifest.agent_id} · v{a.manifest.version}</div>
          </div>
          <div className={statusClass(a.status)}>{a.status}</div>
          <div className="mono">ws: {a.workspace}</div>
          <div className="mono">{a.last_error ?? "—"}</div>
          <div className="actions">
            <button onClick={() => start(a.manifest.agent_id)} disabled={a.status === "NOT_INSTALLED"}>Start</button>
            <button onClick={() => stop(a.manifest.agent_id)}>Stop</button>
            <button onClick={() => setSelected(a)}>Inspect</button>
            {a.status === "NOT_INSTALLED" ? <button className="primary">Install Agent Package</button> : null}
          </div>
        </div>
      ))}
      {selected ? (
        <div className="panel">
          <h2 style={{ fontSize: "1rem" }}>Agent Inspector — {selected.manifest.name}</h2>
          <pre className="mono">{JSON.stringify(selected, null, 2)}</pre>
        </div>
      ) : null}
    </>
  );
}
