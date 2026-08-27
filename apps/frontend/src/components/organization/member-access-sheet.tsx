import { permissionMaskHas } from "@orvex/access";
import { Copy, Check } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Spinner } from "@/components/ui/spinner";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  canGrantPreset,
  encodeDraftAccess,
  permissionsFromDraft,
  selectPreset,
  toggleDraftPermission,
  type DraftAccess,
  type DraftPresetRole,
} from "@/lib/member-access";
import { PERMISSION_GROUPS, PERMISSION_LABELS } from "@/lib/permission-groups";
import type { OrganizationPermission } from "@orvex/types/permissions";

export function MemberAccessSheet({
  open,
  onOpenChange,
  title,
  description,
  email,
  onEmailChange,
  draft,
  onDraftChange,
  callerMask,
  pending,
  submitLabel,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  email?: string | undefined;
  onEmailChange?: ((email: string) => void) | undefined;
  draft: DraftAccess;
  onDraftChange: (draft: DraftAccess) => void;
  callerMask: string;
  pending: boolean;
  submitLabel: string;
  onSubmit: () => void;
}) {
  const accessCode = encodeDraftAccess(draft);
  const granted = new Set(permissionsFromDraft(draft));
  const presetValue =
    draft.accessMode === "preset" ? draft.presetRole : "custom";
  const canSubmit = granted.size > 0 && !pending;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="data-[side=right]:sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
          <SheetDescription>{description}</SheetDescription>
        </SheetHeader>
        <form
          className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-4"
          onSubmit={(event) => {
            event.preventDefault();
            if (canSubmit) {
              onSubmit();
            }
          }}
        >
          {onEmailChange === undefined ? null : (
            <Field>
              <FieldLabel htmlFor="invite-email">Email</FieldLabel>
              <Input
                id="invite-email"
                type="email"
                autoComplete="email"
                required
                value={email ?? ""}
                onChange={(event) => {
                  onEmailChange(event.target.value);
                }}
              />
            </Field>
          )}
          <Field>
            <FieldLabel>Access preset</FieldLabel>
            <ToggleGroup
              type="single"
              variant="outline"
              spacing={0}
              value={presetValue}
              onValueChange={(value) => {
                if (value === "member" || value === "admin") {
                  onDraftChange(selectPreset(value));
                }
              }}
            >
              <PresetChip
                role="member"
                callerMask={callerMask}
                label="Member"
              />
              <PresetChip role="admin" callerMask={callerMask} label="Admin" />
              <ToggleGroupItem value="custom" disabled>
                Custom
              </ToggleGroupItem>
            </ToggleGroup>
          </Field>
          <FieldGroup className="gap-6">
            {PERMISSION_GROUPS.map((group) => (
              <fieldset key={group.id} className="flex flex-col gap-2">
                <legend className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                  {group.label}
                </legend>
                <div className="flex flex-col gap-1.5">
                  {group.permissions.map((permission) => (
                    <PermissionRow
                      key={permission}
                      permission={permission}
                      checked={granted.has(permission)}
                      disabled={
                        !permissionMaskHas(callerMask, permission) || pending
                      }
                      onCheckedChange={(next) => {
                        onDraftChange(
                          toggleDraftPermission(draft, permission, next),
                        );
                      }}
                    />
                  ))}
                </div>
              </fieldset>
            ))}
          </FieldGroup>
          <AccessCode value={accessCode} />
          <SheetFooter className="px-0">
            <Button type="submit" disabled={!canSubmit}>
              {pending ? <Spinner data-icon="inline-start" /> : null}
              {pending ? "Saving" : submitLabel}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}

function PresetChip({
  role,
  callerMask,
  label,
}: {
  role: DraftPresetRole;
  callerMask: string;
  label: string;
}) {
  return (
    <ToggleGroupItem value={role} disabled={!canGrantPreset(role, callerMask)}>
      {label}
    </ToggleGroupItem>
  );
}

function PermissionRow({
  permission,
  checked,
  disabled,
  onCheckedChange,
}: {
  permission: OrganizationPermission;
  checked: boolean;
  disabled: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  const id = `permission-${permission.replaceAll(".", "-")}`;
  return (
    <label
      htmlFor={id}
      className="flex cursor-pointer items-center gap-2 rounded-md px-1 py-1 text-sm has-disabled:cursor-not-allowed has-disabled:opacity-50"
    >
      <Checkbox
        id={id}
        checked={checked}
        disabled={disabled}
        onCheckedChange={(value) => {
          onCheckedChange(value === true);
        }}
      />
      <span>{PERMISSION_LABELS[permission]}</span>
    </label>
  );
}

function AccessCode({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      toast.success("Access code copied");
      window.setTimeout(() => {
        setCopied(false);
      }, 1500);
    } catch {
      toast.error("Unable to copy access code");
    }
  }

  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
        Access code
      </p>
      <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2">
        <code className="min-w-0 flex-1 truncate font-mono text-sm tabular-nums">
          {value}
        </code>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label="Copy access code"
          onClick={() => {
            void copy();
          }}
        >
          {copied ? <Check /> : <Copy />}
        </Button>
      </div>
    </div>
  );
}
