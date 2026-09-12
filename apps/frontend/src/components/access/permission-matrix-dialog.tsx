import {
  PERMISSION_BIT_KEYS,
  PERMISSION_PRESET_MASKS,
  hasPermission,
  type OrganizationRole,
  type PermissionBit,
} from "@orvex/types";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const PRESET_ROLES = ["owner", "admin", "member"] as const;

function roleLabel(role: OrganizationRole): string {
  if (role === "owner") {
    return "Owner";
  }
  if (role === "admin") {
    return "Admin";
  }
  return "Member";
}

export function PermissionMatrixDialog({
  open,
  role,
  displayName,
  onClose,
}: {
  open: boolean;
  role: OrganizationRole;
  displayName: string;
  onClose: () => void;
}) {
  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          onClose();
        }
      }}
    >
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Permissions</DialogTitle>
          <DialogDescription>
            Bits granted by the {roleLabel(role)} preset
            {displayName.length > 0 ? ` for ${displayName}` : ""}. Custom masks
            are not stored from this desk.
          </DialogDescription>
        </DialogHeader>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[28rem] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="px-2 py-2 font-mono text-[10px] font-medium tracking-[0.14em] text-muted-foreground uppercase">
                  Bit
                </th>
                {PRESET_ROLES.map((preset) => (
                  <th
                    key={preset}
                    className="px-2 py-2 text-center font-mono text-[10px] font-medium tracking-[0.14em] text-muted-foreground uppercase"
                  >
                    {roleLabel(preset)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {PERMISSION_BIT_KEYS.map((bit: PermissionBit) => (
                <tr
                  key={bit}
                  className="border-b border-border last:border-b-0"
                >
                  <td className="px-2 py-2 font-mono text-xs">{bit}</td>
                  {PRESET_ROLES.map((preset) => {
                    const granted = hasPermission(
                      PERMISSION_PRESET_MASKS[preset],
                      bit,
                    );
                    return (
                      <td key={preset} className="px-2 py-2 text-center">
                        <Checkbox
                          checked={granted}
                          disabled
                          aria-label={`${bit} ${preset}`}
                          data-active={preset === role || undefined}
                        />
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </DialogContent>
    </Dialog>
  );
}
