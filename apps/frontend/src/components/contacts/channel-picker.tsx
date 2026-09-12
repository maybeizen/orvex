import type { NotificationChannel, OrganizationPlanId } from "@orvex/types";
import { SelectMenu } from "@/components/ui/select-menu";
import { channelOptions } from "./channels";

export function ChannelPicker({
  id,
  planId,
  value,
  onValueChange,
  disabled = false,
}: {
  id?: string;
  planId: OrganizationPlanId;
  value: NotificationChannel;
  onValueChange: (channel: NotificationChannel) => void;
  disabled?: boolean;
}) {
  return (
    <SelectMenu
      {...(id === undefined ? {} : { id })}
      aria-label="Channel"
      value={value}
      disabled={disabled}
      searchable
      options={channelOptions(planId)}
      onValueChange={onValueChange}
    />
  );
}
