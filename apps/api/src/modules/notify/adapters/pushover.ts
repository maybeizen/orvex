import { createWebhookAdapter, formatNotifyText, isHttpsUrl } from "./http.js";

export const pushoverAdapter = createWebhookAdapter({
  requireSecret: true,
  buildUrl: (destination) =>
    isHttpsUrl(destination)
      ? destination
      : "https://api.pushover.net/1/messages.json",
  buildBody: (destination, secret, payload) => ({
    token: secret,
    user: isHttpsUrl(destination) ? secret : destination,
    message: formatNotifyText(payload),
  }),
});
