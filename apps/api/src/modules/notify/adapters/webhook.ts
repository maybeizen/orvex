import { createWebhookAdapter } from "./http.js";

export const webhookAdapter = createWebhookAdapter({
  requireHttps: true,
  headers: (secret) =>
    secret === null || secret.length === 0
      ? {}
      : { authorization: `Bearer ${secret}` },
});
