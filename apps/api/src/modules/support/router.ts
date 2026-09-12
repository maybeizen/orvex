import { z } from "zod";
import { orgProcedure } from "../../trpc/org-procedure.js";
import { router } from "../../trpc/trpc.js";
import { createSupportTicket } from "./support-service.js";

const orgRefFields = {
  organizationId: z.uuid().optional(),
  organizationSlug: z.string().min(1).optional(),
};

export const supportRouter = router({
  create: orgProcedure("team.read")
    .input(
      z.object({
        ...orgRefFields,
        subject: z.string().trim().min(1).max(200),
        body: z.string().trim().min(1).max(8000),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return createSupportTicket(ctx.supabase, {
        organizationId: ctx.organization.id,
        organizationName: ctx.organization.name,
        userId: ctx.user.id,
        fromName: ctx.user.displayName,
        fromEmail: ctx.user.email,
        subject: input.subject,
        body: input.body,
      });
    }),
});
