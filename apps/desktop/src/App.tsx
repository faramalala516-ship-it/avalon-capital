import { NavLink, Route, Routes } from "react-router-dom";
import { usePlatform } from "./lib/platform";
import Overview from "./pages/Overview";
import Agents from "./pages/Agents";
import Security from "./pages/Security";
import Audit from "./pages/Audit";
import Matrix from "./pages/Matrix";
import Settings from "./pages/Settings";
import FirstRun from "./pages/FirstRun";

const NAV = [
  ["/", "Vue d'ensemble"],
  ["/agents", "Agents"],
  ["/macro", "Macro"],
  ["/markets", "Marchés"],
  ["/data", "Données"],
  ["/calendar", "Calendrier"],
  ["/workspaces", "Espaces de travail"],
  ["/models", "Modèles"],
  ["/tools", "Outils"],
  ["/automations", "Automatisations"],
  ["/security", "Sécurité"],
  ["/audit", "Audit"],
  ["/matrix", "La Matrice"],
  ["/settings", "Paramètres"]
] as const;

export default function App() {
  const { status, loading, error, refresh, setNetworkMode } = usePlatform();
  const firstRun =
    !!status &&
    !status.first_run_complete &&
    localStorage.getItem("avalon_first_run_complete") !== "1";

  return (
    <>
      {import.meta.env.DEV ? <div className="banner-dev">Mode développement</div> : null}
      <div className="app-shell">
        <aside className="sidebar">
          <div className="brand">
            Avalon Agentique
            <small>Centre de commande</small>
          </div>
          <nav className="nav">
            {NAV.map(([to, label]) => (
              <NavLink key={to} to={to} end={to === "/"} className={({ isActive }) => (isActive ? "active" : undefined)}>
                {label}
              </NavLink>
            ))}
          </nav>
          <div className="mono" style={{ marginTop: "auto", color: "var(--muted)" }}>
            {status ? `${status.version} · ${status.build}` : "connexion…"}
          </div>
        </aside>
        <main className="main">
          {error ? <p className="status-bad">{error}</p> : null}
          {firstRun ? (
            <FirstRun onComplete={refresh} />
          ) : (
            <Routes>
              <Route path="/" element={<Overview status={status} loading={loading} onRefresh={refresh} onNetwork={setNetworkMode} />} />
              <Route path="/agents" element={<Agents />} />
              <Route path="/security" element={<Security status={status} />} />
              <Route path="/audit" element={<Audit />} />
              <Route path="/matrix" element={<Matrix />} />
              <Route path="/settings" element={<Settings status={status} onNetwork={setNetworkMode} />} />
              <Route path="*" element={<Placeholder />} />
            </Routes>
          )}
        </main>
      </div>
    </>
  );
}

function Placeholder() {
  return (
    <>
      <h1 className="page-title">Section</h1>
      <p className="page-sub">
        Reliée à l’état réel du Core dès que le module est disponible. Aucune donnée de production fictive.
      </p>
    </>
  );
}
