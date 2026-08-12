# Agent Runtime

`AgentRuntimeManager` validates `avalon-agent.json` (JSON Schema), creates workspaces, grants minimal workspace permissions explicitly, supervises processes, contains crashes.

Statuses: NOT_INSTALLED, REGISTERED, STARTING, RUNNING, STOPPED, FAILED, CRASHED.
