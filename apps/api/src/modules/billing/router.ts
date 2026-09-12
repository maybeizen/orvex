import { z } from "zod";
import { orgProcedure, orgRefInput } from "../../trpc/org-procedure.js";
import { router } from "../../trpc/trpc.js";
import {
  createCheckoutSession,
  createPortalSession,
  listInvoices,
  listOrders,
} from "./service.js";
import type { StripeClient } from "./stripe.js";

export type BillingRouterDeps = {
  stripe?: StripeClient | null | undefined;
  frontendOrigin?: string | undefined;
};

const checkoutInput = orgRefInput.and(
  z.object({
    planId: z.enum(["free", "probe", "sentinel", "command"]),
    cycle: z.enum(["monthly", "quarterly", "yearly"]),
  }),
);

export function createBillingRouter(deps: BillingRouterDeps = {}) {
  return router({
    createCheckoutSession: orgProcedure("billing.write")
      .input(checkoutInput)
      .mutation(async ({ ctx, input }) => {
        return createCheckoutSession(
          ctx.supabase,
          ctx.user,
          {
            organizationId: ctx.organization.id,
            planId: input.planId,
            cycle: input.cycle,
          },
          {
            stripe: deps.stripe,
            frontendOrigin: deps.frontendOrigin,
            cache: ctx.cache,
          },
        );
      }),
    createPortalSession: orgProcedure("billing.write")
      .input(orgRefInput)
      .mutation(async ({ ctx }) => {
        return createPortalSession(ctx.supabase, ctx.organization.id, {
          stripe: deps.stripe,
          frontendOrigin: deps.frontendOrigin,
        });
      }),
    listInvoices: orgProcedure("billing.read")
      .input(orgRefInput)
      .query(async ({ ctx }) => {
        return listInvoices(ctx.supabase, ctx.organization.id, {
          stripe: deps.stripe,
        });
      }),
    listOrders: orgProcedure("billing.read")
      .input(orgRefInput)
      .query(async ({ ctx }) => {
        return listOrders(ctx.supabase, ctx.organization.id);
      }),
  });
}

export const billingRouter = createBillingRouter();
