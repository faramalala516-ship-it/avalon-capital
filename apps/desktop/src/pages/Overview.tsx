import { PlatformStatus, NetworkMode, statusClass } from "../lib/api";
import { frStatus } from "../lib/i18n";

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
      <h1 className="page-title">Vue d'ensemble</h1>
      <p className="page-sub">Santé en direct du Core Avalon — centre de commande institutionnel.</p>
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem", flexWrap: "wrap" }}>
        <button className="primary" onClick={onRefresh} disabled={loading}>Actualiser</button>
        <button onClick={() => onNetwork("ONLINE")}>EN LIGNE</button>
        <button onClick={() => onNetwork("SYNC_ONLY")}>SYNC UNIQUEMENT</button>
        <button onClick={() => onNetwork("OFFLINE_LOCK")}>VERROUILLAGE HORS LIGNE</button>
      </div>
      {!status ? (
        <p className="status-warn">
          État du Core INCONNU — lancez `avalon-core serve` ou le shell Tauri.
        </p>
      ) : (
        <>
          <div className="grid">
            <Metric label="Santé plateforme" value={frStatus(status.health?.overall ?? status.security_status)} raw={status.health?.overall ?? status.security_status} />
            <Metric label="Sécurité" value={frStatus(status.security_status)} raw={status.security_status} />
            <Metric label="Réseau" value={frStatus(status.network_mode)} raw={status.network_mode} />
            <Metric
              label="Coffre-fort"
              value={status.vault_unlocked ? "DÉVERROUILLÉ" : "VERROUILLÉ"}
              raw={status.vault_unlocked ? "UNLOCKED" : "LOCKED"}
            />
            <Metric label="Agents" value={`${status.running_agents}/${status.agent_count} en cours`} />
            <Metric label="Agents en échec" value={String(status.failed_agents)} />
            <Metric label="CPU" value={`${status.cpu_percent.toFixed(1)}%`} />
            <Metric label="RAM" value={`${status.memory_used_mb}/${status.memory_total_mb} Mo`} />
            <Metric label="Dernière sauvegarde" value={status.last_backup ?? "AUCUNE"} />
            <Metric label="Dernière sync données" value={status.last_data_sync ?? "AUCUNE"} />
          </div>
          <div className="panel">
            <h2 style={{ fontSize: "1rem" }}>Avertissements</h2>
            {status.warnings.length === 0 ? (
              <p className="mono">Aucun avertissement.</p>
            ) : (
              <ul>{status.warnings.map((w) => <li key={w}>{w}</li>)}</ul>
            )}
          </div>
        </>
      )}
    </>
  );
}

function Metric({ label, value, raw }: { label: string; value: string; raw?: string }) {
  return (
    <div className="metric">
      <div className="label">{label}</div>
      <div className={`value ${statusClass(raw ?? value)}`}>{value}</div>
    </div>
  );
}
