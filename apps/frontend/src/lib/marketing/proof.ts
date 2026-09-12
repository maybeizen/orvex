export type ProofStat = {
  value: string;
  label: string;
  detail: string;
};

export const PROOF_STATS: readonly ProofStat[] = [
  {
    value: "6",
    label: "Probe regions",
    detail: "IAD · SJC · LHR · FRA · SIN · SYD",
  },
  {
    value: "5s",
    label: "Fastest interval",
    detail: "Command. Sentinel is 15s. Probe is 60s.",
  },
  {
    value: "5",
    label: "Check kinds",
    detail: "HTTP, TLS, keyword, heartbeat, Go agent",
  },
  {
    value: "1",
    label: "Event stream",
    detail: "Incidents and status pages share the same probes",
  },
];
