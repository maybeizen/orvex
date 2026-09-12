import type { AdapterResult } from "../types.js";
import { failed, sent, skipped } from "./http.js";

export function twilioCredentials(): {
  accountSid: string;
  authToken: string;
  from: string;
} | null {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_FROM_NUMBER;
  if (
    accountSid === undefined ||
    accountSid.length === 0 ||
    authToken === undefined ||
    authToken.length === 0 ||
    from === undefined ||
    from.length === 0
  ) {
    return null;
  }
  return { accountSid, authToken, from };
}

export async function twilioFormPost(
  path: string,
  fields: Record<string, string>,
): Promise<AdapterResult> {
  const credentials = twilioCredentials();
  if (credentials === null) {
    return skipped("provider not configured");
  }

  const url = `https://api.twilio.com/2010-04-01/Accounts/${credentials.accountSid}/${path}`;
  const body = new URLSearchParams({
    From: credentials.from,
    ...fields,
  });
  const auth = Buffer.from(
    `${credentials.accountSid}:${credentials.authToken}`,
  ).toString("base64");

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        authorization: `Basic ${auth}`,
        "content-type": "application/x-www-form-urlencoded",
      },
      body,
    });
    if (!response.ok) {
      return failed(`HTTP ${String(response.status)}`);
    }
    const json: unknown = await response.json().catch(() => null);
    const providerId =
      json !== null &&
      typeof json === "object" &&
      "sid" in json &&
      typeof json.sid === "string"
        ? json.sid
        : null;
    return sent(providerId);
  } catch (error) {
    return failed(error instanceof Error ? error.message : "request failed");
  }
}
