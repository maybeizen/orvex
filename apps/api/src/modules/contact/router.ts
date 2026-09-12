import { NOTIFICATION_CHANNELS } from "@orvex/types";
import { z } from "zod";
import { invalidateOrgCaches } from "../../lib/cached.js";
import { orgProcedure, orgRefInput } from "../../trpc/org-procedure.js";
import { router } from "../../trpc/trpc.js";
import {
  createContact,
  createContactList,
  createNotificationRule,
  deleteContact,
  deleteContactList,
  deleteNotificationRule,
  getContact,
  getContactList,
  getNotificationRule,
  listContactLists,
  listContacts,
  listNotificationRules,
  testSendContact,
  updateContact,
  updateContactList,
  updateNotificationRule,
} from "./contact-service.js";

const channelSchema = z.enum(NOTIFICATION_CHANNELS);

const listIdSchema = orgRefInput.and(z.object({ listId: z.uuid() }));
const contactIdSchema = orgRefInput.and(z.object({ contactId: z.uuid() }));
const ruleIdSchema = orgRefInput.and(z.object({ ruleId: z.uuid() }));

export const contactRouter = router({
  lists: router({
    list: orgProcedure("contact.read")
      .input(orgRefInput)
      .query(async ({ ctx }) => {
        return listContactLists(ctx.supabase, ctx.organization.id);
      }),
    get: orgProcedure("contact.read")
      .input(listIdSchema)
      .query(async ({ ctx, input }) => {
        return getContactList(ctx.supabase, ctx.organization.id, input.listId);
      }),
    create: orgProcedure("contact.write")
      .input(
        orgRefInput.and(
          z.object({
            name: z.string().trim().min(1).max(80),
          }),
        ),
      )
      .mutation(async ({ ctx, input }) => {
        const created = await createContactList(
          ctx.supabase,
          ctx.organization.id,
          input.name,
        );
        await invalidateOrgCaches(ctx.cache, ctx.organization.id, [
          ctx.user.id,
        ]);
        return created;
      }),
    update: orgProcedure("contact.write")
      .input(
        listIdSchema.and(
          z.object({
            name: z.string().trim().min(1).max(80),
          }),
        ),
      )
      .mutation(async ({ ctx, input }) => {
        const updated = await updateContactList(
          ctx.supabase,
          ctx.organization.id,
          input.listId,
          input.name,
        );
        await invalidateOrgCaches(ctx.cache, ctx.organization.id, [
          ctx.user.id,
        ]);
        return updated;
      }),
    delete: orgProcedure("contact.write")
      .input(listIdSchema)
      .mutation(async ({ ctx, input }) => {
        const deleted = await deleteContactList(
          ctx.supabase,
          ctx.organization.id,
          input.listId,
        );
        await invalidateOrgCaches(ctx.cache, ctx.organization.id, [
          ctx.user.id,
        ]);
        return deleted;
      }),
  }),
  contacts: router({
    list: orgProcedure("contact.read")
      .input(
        orgRefInput.and(
          z.object({
            listId: z.uuid().optional(),
          }),
        ),
      )
      .query(async ({ ctx, input }) => {
        return listContacts(ctx.supabase, ctx.organization.id, input.listId);
      }),
    get: orgProcedure("contact.read")
      .input(contactIdSchema)
      .query(async ({ ctx, input }) => {
        return getContact(ctx.supabase, ctx.organization.id, input.contactId);
      }),
    create: orgProcedure("contact.write")
      .input(
        orgRefInput.and(
          z.object({
            listId: z.uuid(),
            label: z.string().trim().min(1).max(80),
            channel: channelSchema,
            destination: z.string().trim().min(1).max(2048),
            secret: z.string().min(1).max(2048).optional(),
            enabled: z.boolean().optional(),
          }),
        ),
      )
      .mutation(async ({ ctx, input }) => {
        const created = await createContact(ctx.supabase, ctx.organization, {
          listId: input.listId,
          label: input.label,
          channel: input.channel,
          destination: input.destination,
          secret: input.secret,
          enabled: input.enabled,
        });
        await invalidateOrgCaches(ctx.cache, ctx.organization.id, [
          ctx.user.id,
        ]);
        return created;
      }),
    update: orgProcedure("contact.write")
      .input(
        contactIdSchema.and(
          z.object({
            listId: z.uuid().optional(),
            label: z.string().trim().min(1).max(80).optional(),
            channel: channelSchema.optional(),
            destination: z.string().trim().min(1).max(2048).optional(),
            secret: z.string().min(1).max(2048).optional(),
            enabled: z.boolean().optional(),
          }),
        ),
      )
      .mutation(async ({ ctx, input }) => {
        const updated = await updateContact(ctx.supabase, ctx.organization, {
          contactId: input.contactId,
          listId: input.listId,
          label: input.label,
          channel: input.channel,
          destination: input.destination,
          secret: input.secret,
          enabled: input.enabled,
        });
        await invalidateOrgCaches(ctx.cache, ctx.organization.id, [
          ctx.user.id,
        ]);
        return updated;
      }),
    delete: orgProcedure("contact.write")
      .input(contactIdSchema)
      .mutation(async ({ ctx, input }) => {
        const deleted = await deleteContact(
          ctx.supabase,
          ctx.organization.id,
          input.contactId,
        );
        await invalidateOrgCaches(ctx.cache, ctx.organization.id, [
          ctx.user.id,
        ]);
        return deleted;
      }),
  }),
  rules: router({
    list: orgProcedure("contact.read")
      .input(orgRefInput)
      .query(async ({ ctx }) => {
        return listNotificationRules(ctx.supabase, ctx.organization.id);
      }),
    get: orgProcedure("contact.read")
      .input(ruleIdSchema)
      .query(async ({ ctx, input }) => {
        return getNotificationRule(
          ctx.supabase,
          ctx.organization.id,
          input.ruleId,
        );
      }),
    create: orgProcedure("contact.write")
      .input(
        orgRefInput.and(
          z.object({
            listId: z.uuid(),
            onDown: z.boolean().optional(),
            onRecovery: z.boolean().optional(),
            onIncident: z.boolean().optional(),
            onMaintenance: z.boolean().optional(),
          }),
        ),
      )
      .mutation(async ({ ctx, input }) => {
        const created = await createNotificationRule(
          ctx.supabase,
          ctx.organization.id,
          {
            listId: input.listId,
            onDown: input.onDown,
            onRecovery: input.onRecovery,
            onIncident: input.onIncident,
            onMaintenance: input.onMaintenance,
          },
        );
        await invalidateOrgCaches(ctx.cache, ctx.organization.id, [
          ctx.user.id,
        ]);
        return created;
      }),
    update: orgProcedure("contact.write")
      .input(
        ruleIdSchema.and(
          z.object({
            onDown: z.boolean().optional(),
            onRecovery: z.boolean().optional(),
            onIncident: z.boolean().optional(),
            onMaintenance: z.boolean().optional(),
          }),
        ),
      )
      .mutation(async ({ ctx, input }) => {
        const updated = await updateNotificationRule(
          ctx.supabase,
          ctx.organization.id,
          {
            ruleId: input.ruleId,
            onDown: input.onDown,
            onRecovery: input.onRecovery,
            onIncident: input.onIncident,
            onMaintenance: input.onMaintenance,
          },
        );
        await invalidateOrgCaches(ctx.cache, ctx.organization.id, [
          ctx.user.id,
        ]);
        return updated;
      }),
    delete: orgProcedure("contact.write")
      .input(ruleIdSchema)
      .mutation(async ({ ctx, input }) => {
        const deleted = await deleteNotificationRule(
          ctx.supabase,
          ctx.organization.id,
          input.ruleId,
        );
        await invalidateOrgCaches(ctx.cache, ctx.organization.id, [
          ctx.user.id,
        ]);
        return deleted;
      }),
  }),
  testSend: orgProcedure("contact.write")
    .input(
      contactIdSchema.and(
        z.object({
          message: z.string().trim().min(1).max(500).optional(),
        }),
      ),
    )
    .mutation(async ({ ctx, input }) => {
      const delivery = await testSendContact(
        ctx.supabase,
        ctx.organization.id,
        input.contactId,
        input.message,
      );
      await invalidateOrgCaches(ctx.cache, ctx.organization.id, [ctx.user.id]);
      return delivery;
    }),
});
