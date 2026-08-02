import { PlatformStatus, statusClass } from "../lib/api";
import { frStatus } from "../lib/i18n";

export default function Security({ status }: { status: PlatformStatus | null }) {
  if (!status) return <p className="status-warn">État de sécurité INCONNU</p>;
  const scoreParts = [
    status.vault_unlocked,
    status.security_status === "SECURE",
    !status.updater_enabled,
    status.root_key_provider.length > 0
  ];
  const score = Math.round((scoreParts.filter(Boolean).length / scoreParts.length) * 100);

  return (
    <>
      <h1 className="page-title">Centre de sécurité</h1>
      <p className="page-sub">
        Score de sécurité : coffre déverrouillé, statut SÉCURISÉ, mise à jour auto non activée silencieusement, fournisseur de clé racine présent.
      </p>
      <div className="grid">
        <div className="metric">
          <div className="label">Coffre-fort</div>
          <div className={`value ${status.vault_unlocked ? "status-ok" : "status-bad"}`}>
            {status.vault_unlocked ? "DÉVERROUILLÉ" : "VERROUILLÉ"}
          </div>
        </div>
        <div className="metric">
          <div className="label">Statut</div>
          <div className={`value ${statusClass(status.security_status)}`}>{frStatus(status.security_status)}</div>
        </div>
        <div className="metric">
          <div className="label">Clé racine</div>
          <div className="value mono">{status.root_key_provider}</div>
        </div>
        <div className="metric">
          <div className="label">Politique réseau</div>
          <div className={`value ${statusClass(status.network_mode)}`}>{frStatus(status.network_mode)}</div>
        </div>
        <div className="metric">
          <div className="label">Mises à jour</div>
          <div className="value">{status.updater_enabled ? "ACTIVÉES" : "DÉSACTIVÉES (sûr V1)"}</div>
        </div>
        <div className="metric">
          <div className="label">Score sécurité</div>
          <div className="value">{score}/100</div>
        </div>
      </div>
      <div className="panel">
        <h2 style={{ fontSize: "1rem" }}>Métadonnées des secrets (valeurs jamais envoyées à l’UI)</h2>
        {status.secrets.length === 0 ? (
          <p className="mono">Aucun secret configuré.</p>
        ) : (
          <ul className="mono">
            {status.secrets.map((s) => (
              <li key={s.secret_id}>
                {s.label} · {s.provider} · configuré={String(s.configured)} · id={s.secret_id}
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
