import { createWebhookAdapter } from "./http.js";

export const slackAdapter = createWebhookAdapter({
  requireHttps: true,
  buildBody: (_destination, _secret, payload) => ({
    text: payload.summary,
  }),
});
