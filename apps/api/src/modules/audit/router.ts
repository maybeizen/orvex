import { z } from "zod";
import { orgProcedure } from "../../trpc/org-procedure.js";
import { router } from "../../trpc/trpc.js";
import { exportAuditEvents, listAuditEvents } from "./audit-service.js";

const orgRefFields = {
  organizationId: z.uuid().optional(),
  organizationSlug: z.string().min(1).optional(),
};

const auditFilterSchema = z.object({
  ...orgRefFields,
  action: z.string().trim().min(1).optional(),
  resourceType: z.string().trim().min(1).optional(),
  from: z.string().min(1).optional(),
  to: z.string().min(1).optional(),
});

export const auditRouter = router({
  list: orgProcedure("audit.read")
    .input(auditFilterSchema)
    .query(async ({ ctx, input }) => {
      return listAuditEvents(ctx.supabase, ctx.organization.id, {
        action: input.action,
        resourceType: input.resourceType,
        from: input.from,
        to: input.to,
      });
    }),
  export: orgProcedure("audit.read")
    .input(auditFilterSchema)
    .query(async ({ ctx, input }) => {
      return exportAuditEvents(ctx.supabase, ctx.organization.id, {
        action: input.action,
        resourceType: input.resourceType,
        from: input.from,
        to: input.to,
      });
    }),
});
