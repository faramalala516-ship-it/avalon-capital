/** Libellés FR pour le Command Center Avalon (UI locale par défaut). */

export const frStatus = (raw: string | undefined | null): string => {
  if (!raw) return "—";
  const map: Record<string, string> = {
    SECURE: "SÉCURISÉ",
    DEGRADED: "DÉGRADÉ",
    LOCKED: "VERROUILLÉ",
    COMPROMISED_SUSPECTED: "COMPROMISSION SUSPECTÉE",
    UNKNOWN: "INCONNU",
    RUNNING: "EN COURS",
    STOPPED: "ARRÊTÉ",
    FAILED: "ÉCHEC",
    CRASHED: "PLANTÉ",
    NOT_INSTALLED: "NON INSTALLÉ",
    STARTING: "DÉMARRAGE",
    STOPPING: "ARRÊT",
    ONLINE: "EN LIGNE",
    SYNC_ONLY: "SYNC UNIQUEMENT",
    OFFLINE_LOCK: "VERROUILLAGE HORS LIGNE",
    UNLOCKED: "DÉVERROUILLÉ",
    OK: "OK",
    NONE: "AUCUN",
    ACTIVE: "ACTIF",
    idle: "inactif"
  };
  return map[raw] ?? raw;
};
