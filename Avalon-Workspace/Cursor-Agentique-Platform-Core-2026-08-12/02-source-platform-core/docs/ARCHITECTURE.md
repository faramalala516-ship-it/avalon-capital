# Architecture

See also `TARGET_ARCHITECTURE.md`.

Trust hierarchy: UI → Core Kernel → Policy → Agents → Brokers → OS.

Crates: `avalon-security`, `avalon-vault`, `avalon-audit`, `avalon-permissions`, `avalon-events`, `avalon-ipc`, `avalon-registry`, `avalon-workspace`, `avalon-network`, `avalon-system`, `avalon-updates`, `avalon-kernel`, plus services `agent-host`, `privilege-broker`, `data-service`, `scheduler`, `llm-gateway`.

Desktop: Tauri 2 + React Command Center in `apps/desktop`.
