import type { AdapterResult, ChannelAdapter, NotifyPayload } from "../types.js";

export function skipped(error: string | null = null): AdapterResult {
  return { status: "skipped", error };
}

export function failed(error: string): AdapterResult {
  return { status: "failed", error };
}

export function sent(providerId: string | null = null): AdapterResult {
  return { status: "sent", providerId };
}

export function isHttpsUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:";
  } catch {
    return false;
  }
}

export function formatNotifyText(payload: NotifyPayload): string {
  const name =
    payload.monitorName !== null && payload.monitorName.length > 0
      ? payload.monitorName
      : "Monitor";
  switch (payload.event) {
    case "on_down":
      return `${name} is down. ${payload.summary}`;
    case "on_recovery":
      return `${name} recovered. ${payload.summary}`;
    case "on_incident":
      return `Incident: ${payload.summary}`;
    case "on_maintenance":
      return `Maintenance: ${payload.summary}`;
  }
}

export type WebhookAdapterOptions = {
  requireSecret?: boolean;
  requireHttps?: boolean;
  buildUrl?: (destination: string, secret: string | null) => string | null;
  buildBody?: (
    destination: string,
    secret: string | null,
    payload: NotifyPayload,
  ) => unknown;
  headers?: (secret: string | null) => Record<string, string>;
};

export function createWebhookAdapter(
  options: WebhookAdapterOptions = {},
): ChannelAdapter {
  return {
    async send({ destination, secret, payload }) {
      if (destination.trim().length === 0) {
        return skipped("missing destination");
      }
      if (
        options.requireSecret === true &&
        (secret === null || secret.length === 0)
      ) {
        return skipped("missing secret");
      }

      const url =
        options.buildUrl === undefined
          ? destination
          : options.buildUrl(destination, secret);
      if (url === null || url.length === 0) {
        return skipped("missing destination");
      }
      if (options.requireHttps === true && !isHttpsUrl(url)) {
        return skipped("missing destination");
      }

      const body =
        options.buildBody === undefined
          ? {
              event: payload.event,
              summary: payload.summary,
              monitorName: payload.monitorName,
              incidentId: payload.incidentId,
              organizationId: payload.organizationId,
              text: formatNotifyText(payload),
            }
          : options.buildBody(destination, secret, payload);

      const extra =
        options.headers === undefined ? {} : options.headers(secret);

      return postJson(url, body, extra);
    },
  };
}

export async function postJson(
  url: string,
  body: unknown,
  headers: Record<string, string> = {},
): Promise<AdapterResult> {
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...headers,
      },
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      return failed(`HTTP ${String(response.status)}`);
    }
    return sent();
  } catch (error) {
    return failed(error instanceof Error ? error.message : "request failed");
  }
}
