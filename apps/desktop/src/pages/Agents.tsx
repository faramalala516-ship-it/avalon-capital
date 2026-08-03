import { useEffect, useState } from "react";
import { fetchJson, statusClass } from "../lib/api";
import { frStatus } from "../lib/i18n";

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
  const [busy, setBusy] = useState<string | null>(null);

  async function load() {
    try {
      const list = await fetchJson<Agent[]>("/v1/agents");
      setAgents(list);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "échec");
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function start(id: string) {
    setBusy(id);
    try {
      await fetchJson(`/v1/agents/${id}/start`, { method: "POST" });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "échec démarrage");
    } finally {
      setBusy(null);
    }
  }
  async function stop(id: string) {
    setBusy(id);
    try {
      await fetchJson(`/v1/agents/${id}/stop`, { method: "POST" });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "échec arrêt");
    } finally {
      setBusy(null);
    }
  }

  async function installPreferred(id: string) {
    setBusy(id);
    try {
      await fetchJson("/v1/agents/install", {
        method: "POST",
        body: JSON.stringify({ agent_id: id })
      });
      await load();
    } catch (e) {
      const detail = e instanceof Error ? e.message : String(e);
      setError(
        `Installation impossible (${detail}). ` +
          `Déposez le paquet dans %LOCALAPPDATA%\\Avalon Capital\\Agentique Platform\\agents\\incoming\\${id} ` +
          `puis réessayez (ou lancez .\\scripts\\install-agent-windows.ps1).`
      );
    } finally {
      setBusy(null);
    }
  }

  return (
    <>
      <h1 className="page-title">Centre de contrôle des agents</h1>
      <p className="page-sub">
        État réel du runtime. Macro-X : copier le paquet dans{" "}
        <span className="mono">%LOCALAPPDATA%\Avalon Capital\Agentique Platform\agents\incoming\macro-x</span>
        {" "}puis cliquer Installer (ou <span className="mono">.\scripts\install-agent-windows.ps1</span>).
      </p>
      {error ? <p className="status-bad">{error}</p> : null}
      {agents.map((a) => (
        <div className="agent-row" key={a.manifest.agent_id}>
          <div>
            <strong>{a.manifest.name}</strong>
            <div className="mono">
              {a.manifest.agent_id} · v{a.manifest.version}
            </div>
          </div>
          <div className={statusClass(a.status)}>{frStatus(a.status)}</div>
          <div className="mono">espace : {a.workspace}</div>
          <div className="mono">{a.last_error ?? "—"}</div>
          <div className="actions">
            <button
              onClick={() => start(a.manifest.agent_id)}
              disabled={a.status === "NOT_INSTALLED" || busy === a.manifest.agent_id}
            >
              Démarrer
            </button>
            <button onClick={() => stop(a.manifest.agent_id)} disabled={busy === a.manifest.agent_id}>
              Arrêter
            </button>
            <button onClick={() => setSelected(a)}>Inspecter</button>
            <button
              className="primary"
              onClick={() => installPreferred(a.manifest.agent_id)}
              disabled={busy === a.manifest.agent_id}
            >
              {a.status === "NOT_INSTALLED" ? "Installer le paquet agent" : "Réinstaller / mettre à jour"}
            </button>
          </div>
        </div>
      ))}
      {selected ? (
        <div className="panel">
          <h2 style={{ fontSize: "1rem" }}>Inspecteur agent — {selected.manifest.name}</h2>
          <pre className="mono">{JSON.stringify(selected, null, 2)}</pre>
        </div>
      ) : null}
    </>
  );
}
