export type PipelineStep = {
  id: string;
  title: string;
  body: string;
};

export const PIPELINE_STEPS: readonly PipelineStep[] = [
  {
    id: "01",
    title: "Probe",
    body: "Each region hits the URL, TLS cert, or agent socket on the interval you set.",
  },
  {
    id: "02",
    title: "Collect",
    body: "Samples land on one timeline. Failures keep the payload, not a redacted blip.",
  },
  {
    id: "03",
    title: "Route",
    body: "Slack, Discord, PagerDuty, or a webhook. Same rule table for every check.",
  },
  {
    id: "04",
    title: "Page",
    body: "On-call is paged. The public status page updates from the same events.",
  },
];
