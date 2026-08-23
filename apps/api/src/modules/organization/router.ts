import { planAllowsKind } from "@orvex/types/plans";
import { z } from "zod";
import { protectedProcedure, router } from "../../trpc/trpc.js";
import {
  createOrganization,
  listOrganizations,
  setActiveOrganization,
} from "./organization-service.js";
import { isReservedOrgSlug, ORG_SLUG_PATTERN } from "./slugs.js";

const createSchema = z
  .object({
    name: z.string().trim().min(1).max(80),
    slug: z
      .string()
      .regex(ORG_SLUG_PATTERN)
      .refine((value) => !isReservedOrgSlug(value), {
        message: "That organization slug is not allowed",
      }),
    kind: z.enum(["single", "team"]),
    planId: z.enum(["free", "probe", "sentinel", "command"]),
    billingCycle: z.enum(["monthly", "quarterly", "yearly"]),
    tosAccepted: z.literal(true),
    marketingOptIn: z.boolean(),
  })
  .superRefine((value, ctx) => {
    if (!planAllowsKind(value.planId, value.kind)) {
      ctx.addIssue({
        code: "custom",
        path: ["planId"],
        message: "That plan is not available for this organization type",
      });
    }
  });

export const organizationRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    return listOrganizations(ctx.supabase, ctx.user);
  }),
  create: protectedProcedure
    .input(createSchema)
    .mutation(async ({ ctx, input }) => {
      return createOrganization(ctx.supabase, ctx.user, input);
    }),
  setActive: protectedProcedure
    .input(z.object({ organizationId: z.uuid() }))
    .mutation(async ({ ctx, input }) => {
      return setActiveOrganization(
        ctx.supabase,
        ctx.user,
        input.organizationId,
      );
    }),
});
