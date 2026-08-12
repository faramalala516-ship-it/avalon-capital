import { useCallback, useEffect, useState } from "react";
import { fetchJson, PlatformStatus, NetworkMode } from "./api";

export function usePlatform() {
  const [status, setStatus] = useState<(PlatformStatus & { first_run_complete?: boolean }) | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const s = await fetchJson<PlatformStatus & { first_run_complete?: boolean }>("/v1/platform/status");
      setStatus(s);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Core unreachable");
      setStatus(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const setNetworkMode = useCallback(async (mode: NetworkMode) => {
    await fetchJson("/v1/network/mode", { method: "POST", body: JSON.stringify({ mode }) });
    await refresh();
  }, [refresh]);

  useEffect(() => {
    void refresh();
    const id = window.setInterval(() => void refresh(), 5000);
    return () => window.clearInterval(id);
  }, [refresh]);

  return { status, loading, error, refresh, setNetworkMode };
}
