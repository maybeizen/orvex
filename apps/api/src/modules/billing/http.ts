import type { CacheClient } from "@orvex/cache";
import express, { Router, type Request, type Response } from "express";
import type { DataClient } from "../../trpc/context.js";
import { HttpError } from "../../utils/http-error.js";
import { applyStripeEvent } from "./service.js";
import { getStripe, type StripeClient } from "./stripe.js";

export type StripeWebhookDeps = {
  supabase: DataClient;
  cache?: CacheClient;
  stripe?: StripeClient | null;
  webhookSecret?: string | null;
};

function resolveWebhookSecret(deps: StripeWebhookDeps): string | null {
  if (deps.webhookSecret === null) {
    return null;
  }
  if (deps.webhookSecret !== undefined) {
    return deps.webhookSecret;
  }
  const fromEnv = process.env.STRIPE_WEBHOOK_SECRET;
  if (fromEnv === undefined || fromEnv.length === 0) {
    return null;
  }
  return fromEnv;
}

function resolveStripe(deps: StripeWebhookDeps): StripeClient | null {
  if (deps.stripe === null) {
    return null;
  }
  if (deps.stripe !== undefined) {
    return deps.stripe;
  }
  return getStripe();
}

function rawBody(req: Request): Buffer {
  if (Buffer.isBuffer(req.body)) {
    return req.body;
  }
  throw new HttpError(400, "Invalid webhook payload");
}

function signatureHeader(req: Request): string {
  const header = req.headers["stripe-signature"];
  if (typeof header === "string" && header.length > 0) {
    return header;
  }
  throw new HttpError(400, "Missing Stripe-Signature header");
}

async function handleStripeWebhook(
  req: Request,
  res: Response,
  deps: StripeWebhookDeps,
): Promise<void> {
  const secret = resolveWebhookSecret(deps);
  const stripe = resolveStripe(deps);
  if (secret === null || stripe === null) {
    throw new HttpError(400, "Billing is not configured");
  }

  const event = stripe.webhooks.constructEvent(
    rawBody(req),
    signatureHeader(req),
    secret,
  );
  await applyStripeEvent(deps.supabase, event, deps.cache);
  res.status(200).json({ received: true });
}

export function createStripeWebhookRouter(deps: StripeWebhookDeps): Router {
  const webhookRouter = Router();
  webhookRouter.post(
    "/webhooks/stripe",
    express.raw({ type: "application/json" }),
    (req, res, next) => {
      handleStripeWebhook(req, res, deps).catch((error: unknown) => {
        if (
          error instanceof Error &&
          (error.name === "StripeSignatureVerificationError" ||
            error.message.toLowerCase().includes("signature"))
        ) {
          res.status(400).json({ error: "Invalid Stripe signature" });
          return;
        }
        if (error instanceof HttpError) {
          res.status(error.status).json({ error: error.message });
          return;
        }
        next(error);
      });
    },
  );
  return webhookRouter;
}
