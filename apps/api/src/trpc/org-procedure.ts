import { hasPermission, type PermissionBit } from "@orvex/types";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  resolveAccessibleOrganization,
  type ResolvedOrganization,
} from "../modules/organization/organization-service.js";
import type { Context } from "./context.js";
import { protectedProcedure } from "./trpc.js";

export const orgRefInput = z
  .object({
    organizationId: z.uuid().optional(),
    organizationSlug: z.string().min(1).optional(),
  })
  .refine(
    (value) =>
      value.organizationId !== undefined ||
      value.organizationSlug !== undefined,
    { message: "Organization id or slug is required" },
  );

export type OrgContext = Context & ResolvedOrganization;

export function orgProcedure(bit: PermissionBit) {
  return protectedProcedure.use(async ({ ctx, getRawInput, next }) => {
    const parsed = orgRefInput.safeParse(await getRawInput());
    if (!parsed.success) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Organization id or slug is required",
      });
    }

    const resolved = await resolveAccessibleOrganization(
      ctx.supabase,
      ctx.user,
      parsed.data,
    );

    if (
      resolved.membership.status === "locked" ||
      resolved.membership.locked_at !== null
    ) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "This membership is locked",
      });
    }

    if (!hasPermission(resolved.membership.permission_mask, bit)) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Missing permission",
      });
    }

    return next({
      ctx: {
        ...ctx,
        organization: resolved.organization,
        membership: resolved.membership,
      },
    });
  });
}
