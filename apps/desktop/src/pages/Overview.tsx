import { PlatformStatus, NetworkMode, statusClass } from "../lib/api";

export default function Overview({
  status,
  loading,
  onRefresh,
  onNetwork
}: {
  status: PlatformStatus | null;
  loading: boolean;
  onRefresh: () => void;
  onNetwork: (m: NetworkMode) => void;
}) {
  return (
    <>
      <h1 className="page-title">Overview</h1>
      <p className="page-sub">Live Avalon Core health — institutional Command Center.</p>
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem", flexWrap: "wrap" }}>
        <button className="primary" onClick={onRefresh} disabled={loading}>Refresh</button>
        <button onClick={() => onNetwork("ONLINE")}>ONLINE</button>
        <button onClick={() => onNetwork("SYNC_ONLY")}>SYNC ONLY</button>
        <button onClick={() => onNetwork("OFFLINE_LOCK")}>OFFLINE LOCK</button>
      </div>
      {!status ? (
        <p className="status-warn">Core status UNKNOWN — start `avalon-core serve` or the Tauri shell.</p>
      ) : (
        <>
          <div className="grid">
            <Metric label="Platform health" value={status.health?.overall ?? status.security_status} />
            <Metric label="Security" value={status.security_status} />
            <Metric label="Network" value={status.network_mode} />
            <Metric label="Vault" value={status.vault_unlocked ? "UNLOCKED" : "LOCKED"} />
            <Metric label="Agents" value={`${status.running_agents}/${status.agent_count} running`} />
            <Metric label="Failed agents" value={String(status.failed_agents)} />
            <Metric label="CPU" value={`${status.cpu_percent.toFixed(1)}%`} />
            <Metric label="RAM" value={`${status.memory_used_mb}/${status.memory_total_mb} MB`} />
            <Metric label="Last backup" value={status.last_backup ?? "NONE"} />
            <Metric label="Last data sync" value={status.last_data_sync ?? "NONE"} />
          </div>
          <div className="panel">
            <h2 style={{ fontSize: "1rem" }}>Warnings</h2>
            {status.warnings.length === 0 ? (
              <p className="mono">No warnings.</p>
            ) : (
              <ul>{status.warnings.map((w) => <li key={w}>{w}</li>)}</ul>
            )}
          </div>
        </>
      )}
    </>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="metric">
      <div className="label">{label}</div>
      <div className={`value ${statusClass(value)}`}>{value}</div>
    </div>
  );
}
