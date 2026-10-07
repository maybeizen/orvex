import { EventEmitter } from "node:events";
import type { ClientRequest, IncomingMessage, RequestOptions } from "node:http";
import { Readable } from "node:stream";
import { afterEach, expect, test } from "vitest";
import { setSafePostTestHooks } from "../../../lib/safe-fetch.js";
import { discordAdapter } from "./discord.js";
import { msteamsAdapter } from "./msteams.js";
import { slackAdapter } from "./slack.js";
import { webhookAdapter } from "./webhook.js";
import type { ChannelAdapter, NotifyPayload } from "../types.js";

const payload: NotifyPayload = {
  event: "on_down",
  organizationId: "org-1",
  incidentId: null,
  summary: "down",
  monitorName: "api",
};

const adapters: Array<[string, ChannelAdapter, string | null]> = [
  ["webhook", webhookAdapter, null],
  ["slack", slackAdapter, null],
  ["discord", discordAdapter, null],
  ["teams", msteamsAdapter, "team-secret"],
];

afterEach(() => {
  setSafePostTestHooks({});
});

function captureRequest(): ClientRequest {
  const req = new EventEmitter() as ClientRequest;
  req.end = () => {
    const response = Readable.from([]) as IncomingMessage;
    response.statusCode = 204;
    return req;
  };
  req.destroy = () => req;
  return req;
}

for (const [name, adapter, secret] of adapters) {
  test(`${name} rejects http and attempts an https public url`, async () => {
    const seen: RequestOptions[] = [];
    setSafePostTestHooks({
      lookup: () => Promise.resolve([{ address: "8.8.8.8", family: 4 }]),
      request: (options, callback) => {
        seen.push(options);
        const req = captureRequest();
        req.end = () => {
          const response = Readable.from([]) as IncomingMessage;
          response.statusCode = 204;
          callback?.(response);
          return req;
        };
        return req;
      },
    });

    const rejected = await adapter.send({
      destination: "http://notify.example/hook",
      secret,
      payload,
    });
    expect(rejected).toEqual({
      status: "skipped",
      error: "missing destination",
    });
    expect(rejected).not.toEqual({
      status: "failed",
      error: "blocked destination",
    });
    expect(seen).toHaveLength(0);

    const sent = await adapter.send({
      destination: "https://notify.example/hook",
      secret,
      payload,
    });
    expect(sent).toEqual({ status: "sent", providerId: null });
    expect(seen).toHaveLength(1);
    expect(seen[0]?.hostname).toBe("8.8.8.8");
    expect(String(seen[0]?.protocol)).toBe("https:");
  });
}
