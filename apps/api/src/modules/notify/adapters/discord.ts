import { createWebhookAdapter, formatNotifyText } from "./http.js";

export const discordAdapter = createWebhookAdapter({
  requireHttps: true,
  buildBody: (_destination, _secret, payload) => ({
    content: formatNotifyText(payload),
  }),
});
