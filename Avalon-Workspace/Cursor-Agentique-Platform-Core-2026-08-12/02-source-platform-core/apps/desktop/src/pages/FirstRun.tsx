export default function FirstRun({ onComplete }: { onComplete: () => void }) {
  return (
    <>
      <h1 className="page-title">Assistant de premier lancement</h1>
      <p className="page-sub">
        Bienvenue sur Avalon Agentique Platform. Aucune clé API n’est requise pour démarrer.
      </p>
      <ol className="mono" style={{ lineHeight: 1.8 }}>
        <li>Bienvenue</li>
        <li>Vérifier l’environnement</li>
        <li>Initialiser le coffre sécurisé (déjà créé par le bootstrap Core)</li>
        <li>Créer l’identité locale</li>
        <li>Choisir l’emplacement de l’espace de travail (défaut LocalAppData)</li>
        <li>Détecter Excel (optionnel)</li>
        <li>Détecter les modèles locaux (optionnel)</li>
        <li>Choisir la politique hors ligne / réseau (défaut VERROUILLAGE HORS LIGNE)</li>
        <li>Créer la politique de récupération / sauvegarde</li>
        <li>Terminer</li>
      </ol>
      <button
        className="primary"
        onClick={() => {
          localStorage.setItem("avalon_first_run_complete", "1");
          onComplete();
        }}
      >
        Terminer
      </button>
    </>
  );
}
