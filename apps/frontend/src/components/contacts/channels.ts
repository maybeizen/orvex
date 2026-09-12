import type { NotificationChannel, OrganizationPlanId } from "@orvex/types";
import { NOTIFICATION_CHANNELS } from "@orvex/types";
import { planAllowsChannel } from "@orvex/types/plans";
import type { SelectMenuOption } from "@/components/ui/select-menu";

export const CHANNEL_LABEL: Record<NotificationChannel, string> = {
  email: "Email",
  sms: "SMS",
  voice: "Voice",
  slack: "Slack",
  discord: "Discord",
  webhook: "Webhook",
  telegram: "Telegram",
  msteams: "Microsoft Teams",
  pushover: "Pushover",
  pagerduty: "PagerDuty",
  opsgenie: "Opsgenie",
  googlechat: "Google Chat",
  mattermost: "Mattermost",
};

export function channelLabel(channel: NotificationChannel): string {
  return CHANNEL_LABEL[channel];
}

export function destinationHint(channel: NotificationChannel): string {
  switch (channel) {
    case "email":
      return "Email address";
    case "sms":
    case "voice":
      return "Phone number";
    case "telegram":
      return "Chat id";
    case "pushover":
      return "User key";
    case "pagerduty":
      return "Routing key";
    case "opsgenie":
      return "Alert destination";
    default:
      return "HTTPS URL";
  }
}

export function channelUsesSecret(channel: NotificationChannel): boolean {
  return (
    channel === "telegram" ||
    channel === "msteams" ||
    channel === "pushover" ||
    channel === "pagerduty" ||
    channel === "opsgenie" ||
    channel === "googlechat" ||
    channel === "mattermost"
  );
}

export function channelOptions(
  planId: OrganizationPlanId,
): SelectMenuOption<NotificationChannel>[] {
  return NOTIFICATION_CHANNELS.map((channel) => {
    const allowed = planAllowsChannel(planId, channel);
    if (allowed) {
      return {
        value: channel,
        label: CHANNEL_LABEL[channel],
      };
    }
    return {
      value: channel,
      label: CHANNEL_LABEL[channel],
      disabled: true,
      hint: "Upgrade",
    };
  });
}

export function firstAllowedChannel(
  planId: OrganizationPlanId,
): NotificationChannel {
  return (
    NOTIFICATION_CHANNELS.find((channel) =>
      planAllowsChannel(planId, channel),
    ) ?? "email"
  );
}
