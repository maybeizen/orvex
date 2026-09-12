import { z } from "zod";
import { orgProcedure } from "../../trpc/org-procedure.js";
import { router } from "../../trpc/trpc.js";
import { getReferralProgram } from "./referral-service.js";

const orgRefFields = {
  organizationId: z.uuid().optional(),
  organizationSlug: z.string().min(1).optional(),
};

export const referralRouter = router({
  mine: orgProcedure("billing.read")
    .input(z.object(orgRefFields))
    .query(async ({ ctx }) => {
      return getReferralProgram(ctx.supabase, ctx.organization.id);
    }),
});
