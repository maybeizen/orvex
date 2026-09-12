export const NOTIFICATION_CHANNELS = [
  "email",
  "sms",
  "voice",
  "slack",
  "discord",
  "webhook",
  "telegram",
  "msteams",
  "pushover",
  "pagerduty",
  "opsgenie",
  "googlechat",
  "mattermost",
] as const;

export type NotificationChannel = (typeof NOTIFICATION_CHANNELS)[number];

export function isNotificationChannel(
  value: string,
): value is NotificationChannel {
  return (NOTIFICATION_CHANNELS as readonly string[]).includes(value);
}
