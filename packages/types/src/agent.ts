export type AgentMode = "daemon" | "cron";

export type AgentHeartbeatMetrics = Record<string, number>;

export type AgentHeartbeatPayload = {
  id: string;
  version: string;
  metrics: AgentHeartbeatMetrics;
};
