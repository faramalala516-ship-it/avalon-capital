import { NetworkMode, PlatformStatus } from "../lib/api";

export default function Settings({
  status,
  onNetwork
}: {
  status: PlatformStatus | null;
  onNetwork: (m: NetworkMode) => void;
}) {
  return (
    <>
      <h1 className="page-title">Settings</h1>
      <p className="page-sub">Local identity and network policy. Secrets are never stored in config files.</p>
      <div className="panel mono">
        <div>Identity: {status?.identity_id ?? "—"}</div>
        <div>Network: {status?.network_mode ?? "—"}</div>
        <div style={{ marginTop: "0.75rem", display: "flex", gap: "0.5rem" }}>
          <button onClick={() => onNetwork("ONLINE")}>ONLINE</button>
          <button onClick={() => onNetwork("SYNC_ONLY")}>SYNC ONLY</button>
          <button onClick={() => onNetwork("OFFLINE_LOCK")}>OFFLINE LOCK</button>
        </div>
      </div>
    </>
  );
}
