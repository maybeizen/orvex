import type { ChannelAdapter } from "../types.js";
import { formatNotifyText, skipped } from "./http.js";
import { twilioFormPost } from "./twilio.js";

function escapeXml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

export const voiceAdapter: ChannelAdapter = {
  async send({ destination, payload }) {
    if (destination.trim().length === 0) {
      return skipped("missing destination");
    }
    const text = escapeXml(formatNotifyText(payload));
    return twilioFormPost("Calls.json", {
      To: destination,
      Twiml: `<Response><Say>${text}</Say></Response>`,
    });
  },
};
