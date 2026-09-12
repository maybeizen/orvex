import type { ChannelAdapter } from "../types.js";
import { formatNotifyText, skipped } from "./http.js";
import { twilioFormPost } from "./twilio.js";

export const smsAdapter: ChannelAdapter = {
  async send({ destination, payload }) {
    if (destination.trim().length === 0) {
      return skipped("missing destination");
    }
    return twilioFormPost("Messages.json", {
      To: destination,
      Body: formatNotifyText(payload),
    });
  },
};
