import { createWebhookAdapter, formatNotifyText, isHttpsUrl } from "./http.js";

export const opsgenieAdapter = createWebhookAdapter({
  requireSecret: true,
  buildUrl: (destination) =>
    isHttpsUrl(destination)
      ? destination
      : "https://api.opsgenie.com/v2/alerts",
  buildBody: (_destination, _secret, payload) => ({
    message: payload.summary,
    description: formatNotifyText(payload),
  }),
  headers: (secret) =>
    secret === null || secret.length === 0
      ? {}
      : { authorization: `GenieKey ${secret}` },
});
