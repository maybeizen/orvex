import type { ChannelAdapterMap } from "../types.js";
import { discordAdapter } from "./discord.js";
import { emailAdapter } from "./email.js";
import { googlechatAdapter } from "./googlechat.js";
import { mattermostAdapter } from "./mattermost.js";
import { msteamsAdapter } from "./msteams.js";
import { opsgenieAdapter } from "./opsgenie.js";
import { pagerdutyAdapter } from "./pagerduty.js";
import { pushoverAdapter } from "./pushover.js";
import { slackAdapter } from "./slack.js";
import { smsAdapter } from "./sms.js";
import { telegramAdapter } from "./telegram.js";
import { voiceAdapter } from "./voice.js";
import { webhookAdapter } from "./webhook.js";

export const channelAdapters: ChannelAdapterMap = {
  email: emailAdapter,
  sms: smsAdapter,
  voice: voiceAdapter,
  slack: slackAdapter,
  discord: discordAdapter,
  webhook: webhookAdapter,
  telegram: telegramAdapter,
  msteams: msteamsAdapter,
  pushover: pushoverAdapter,
  pagerduty: pagerdutyAdapter,
  opsgenie: opsgenieAdapter,
  googlechat: googlechatAdapter,
  mattermost: mattermostAdapter,
};
