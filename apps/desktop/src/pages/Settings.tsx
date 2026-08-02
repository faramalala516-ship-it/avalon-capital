import { NetworkMode, PlatformStatus } from "../lib/api";
import { frStatus } from "../lib/i18n";

export default function Settings({
  status,
  onNetwork
}: {
  status: PlatformStatus | null;
  onNetwork: (m: NetworkMode) => void;
}) {
  return (
    <>
      <h1 className="page-title">Paramètres</h1>
      <p className="page-sub">
        Identité locale et politique réseau. Les secrets ne sont jamais stockés dans des fichiers de config.
      </p>
      <div className="panel mono">
        <div>Identité : {status?.identity_id ?? "—"}</div>
        <div>Réseau : {status ? frStatus(status.network_mode) : "—"}</div>
        <div style={{ marginTop: "0.75rem", display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          <button onClick={() => onNetwork("ONLINE")}>EN LIGNE</button>
          <button onClick={() => onNetwork("SYNC_ONLY")}>SYNC UNIQUEMENT</button>
          <button onClick={() => onNetwork("OFFLINE_LOCK")}>VERROUILLAGE HORS LIGNE</button>
        </div>
      </div>
    </>
  );
}
