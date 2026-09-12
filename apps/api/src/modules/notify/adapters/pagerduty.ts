import { createWebhookAdapter, isHttpsUrl } from "./http.js";

export const pagerdutyAdapter = createWebhookAdapter({
  requireSecret: true,
  buildUrl: (destination) =>
    isHttpsUrl(destination)
      ? destination
      : "https://events.pagerduty.com/v2/enqueue",
  buildBody: (_destination, secret, payload) => ({
    routing_key: secret,
    event_action: payload.event === "on_recovery" ? "resolve" : "trigger",
    payload: {
      summary: payload.summary,
      severity: payload.event === "on_down" ? "critical" : "error",
      source: "orvex",
    },
  }),
});
