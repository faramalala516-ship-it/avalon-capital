export type NetworkMode = "ONLINE" | "SYNC_ONLY" | "OFFLINE_LOCK";
export type SecurityStatus = "SECURE" | "DEGRADED" | "LOCKED" | "COMPROMISED_SUSPECTED" | "UNKNOWN";

export type PlatformStatus = {
  version: string;
  build: string;
  security_status: SecurityStatus;
  network_mode: NetworkMode;
  vault_unlocked: boolean;
  safe_mode: string;
  agent_count: number;
  running_agents: number;
  failed_agents: number;
  cpu_percent: number;
  memory_used_mb: number;
  memory_total_mb: number;
  last_backup: string | null;
  last_data_sync: string | null;
  warnings: string[];
  secrets: { secret_id: string; provider: string; label: string; configured: boolean }[];
  identity_id: string;
  root_key_provider: string;
  updater_enabled: boolean;
  first_run_complete?: boolean;
  health?: {
    overall: SecurityStatus;
    components: { name: string; healthy: boolean; detail: string }[];
  };
};

const API_BASE = import.meta.env.VITE_AVALON_API ?? "http://127.0.0.1:8741";

async function token(): Promise<string | null> {
  // Tauri command may provide token; browser/dev reads from localStorage after first fetch helper
  return localStorage.getItem("avalon_api_token");
}

export async function fetchJson<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set("Content-Type", "application/json");
  const t = await token();
  if (t) headers.set("x-avalon-token", t);

  // Prefer Tauri invoke when available
  try {
    const { invoke } = await import("@tauri-apps/api/core");
    if (path === "/v1/platform/status") {
      return await invoke<T>("platform_status");
    }
    if (path === "/v1/agents") {
      return await invoke<T>("list_agents");
    }
    if (path === "/v1/events") {
      return await invoke<T>("list_events");
    }
    if (path === "/v1/matrix") {
      return await invoke<T>("matrix");
    }
    if (path === "/v1/security/status") {
      return await invoke<T>("security_status");
    }
    if (path.startsWith("/v1/agents/") && path.endsWith("/start") && init.method === "POST") {
      const id = path.split("/")[3];
      return await invoke<T>("start_agent", { id });
    }
    if (path.startsWith("/v1/agents/") && path.endsWith("/stop") && init.method === "POST") {
      const id = path.split("/")[3];
      return await invoke<T>("stop_agent", { id });
    }
    if (path === "/v1/agents/install" && init.method === "POST") {
      const body = JSON.parse(String(init.body ?? "{}"));
      if (body.path) {
        return await invoke<T>("install_agent", { path: body.path });
      }
      return await invoke<T>("install_agent_preferred", { id: body.agent_id ?? "macro-x" });
    }
    if (path === "/v1/network/mode" && init.method === "POST") {
      const body = JSON.parse(String(init.body ?? "{}"));
      return await invoke<T>("set_network_mode", { mode: body.mode });
    }
  } catch {
    // fall through to HTTP local API
  }

  const resp = await fetch(`${API_BASE}${path}`, { ...init, headers });
  if (!resp.ok) {
    throw new Error(`API ${resp.status} for ${path}`);
  }
  return resp.json() as Promise<T>;
}

export function statusClass(s: string | undefined): string {
  if (!s) return "";
  if (s === "SECURE" || s === "RUNNING" || s === "OK") return "status-ok";
  if (s === "DEGRADED" || s === "STOPPED" || s === "NOT_INSTALLED" || s === "SYNC_ONLY") return "status-warn";
  if (s === "FAILED" || s === "CRASHED" || s === "LOCKED" || s === "COMPROMISED_SUSPECTED" || s === "OFFLINE_LOCK") return "status-bad";
  return "";
}
