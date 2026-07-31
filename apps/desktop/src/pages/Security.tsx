import { PlatformStatus, statusClass } from "../lib/api";

export default function Security({ status }: { status: PlatformStatus | null }) {
  if (!status) return <p className="status-warn">Security status UNKNOWN</p>;
  const scoreParts = [
    status.vault_unlocked,
    status.security_status === "SECURE",
    !status.updater_enabled,
    status.root_key_provider.length > 0
  ];
  const score = Math.round((scoreParts.filter(Boolean).length / scoreParts.length) * 100);

  return (
    <>
      <h1 className="page-title">Security Center</h1>
      <p className="page-sub">
        Security score methodology: vault unlocked, overall SECURE, updater not silently enabled, root key provider present.
      </p>
      <div className="grid">
        <div className="metric"><div className="label">Vault</div><div className={`value ${status.vault_unlocked ? "status-ok" : "status-bad"}`}>{status.vault_unlocked ? "UNLOCKED" : "LOCKED"}</div></div>
        <div className="metric"><div className="label">Status</div><div className={`value ${statusClass(status.security_status)}`}>{status.security_status}</div></div>
        <div className="metric"><div className="label">Root key</div><div className="value mono">{status.root_key_provider}</div></div>
        <div className="metric"><div className="label">Network policy</div><div className={`value ${statusClass(status.network_mode)}`}>{status.network_mode}</div></div>
        <div className="metric"><div className="label">Updater</div><div className="value">{status.updater_enabled ? "ENABLED" : "DISABLED (V1 safe)"}</div></div>
        <div className="metric"><div className="label">Security score</div><div className="value">{score}/100</div></div>
      </div>
      <div className="panel">
        <h2 style={{ fontSize: "1rem" }}>Secret metadata (values never sent to UI)</h2>
        {status.secrets.length === 0 ? <p className="mono">No secrets configured.</p> : (
          <ul className="mono">
            {status.secrets.map((s) => (
              <li key={s.secret_id}>{s.label} · {s.provider} · configured={String(s.configured)} · id={s.secret_id}</li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
