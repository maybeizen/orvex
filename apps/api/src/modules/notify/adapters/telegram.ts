import { createWebhookAdapter, formatNotifyText, isHttpsUrl } from "./http.js";

export const telegramAdapter = createWebhookAdapter({
  requireSecret: true,
  buildUrl: (destination, secret) => {
    if (isHttpsUrl(destination)) {
      return destination;
    }
    if (secret === null || secret.length === 0) {
      return null;
    }
    return `https://api.telegram.org/bot${secret}/sendMessage`;
  },
  buildBody: (destination, secret, payload) => {
    if (isHttpsUrl(destination)) {
      return {
        chat_id: secret,
        text: formatNotifyText(payload),
      };
    }
    return {
      chat_id: destination,
      text: formatNotifyText(payload),
    };
  },
});
