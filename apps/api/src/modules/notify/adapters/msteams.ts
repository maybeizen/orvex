import { createWebhookAdapter, formatNotifyText } from "./http.js";

export const msteamsAdapter = createWebhookAdapter({
  requireSecret: true,
  requireHttps: true,
  buildBody: (_destination, _secret, payload) => ({
    text: formatNotifyText(payload),
  }),
  headers: (secret) =>
    secret === null || secret.length === 0
      ? {}
      : { authorization: `Bearer ${secret}` },
});
