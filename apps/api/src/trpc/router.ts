import { auditRouter } from "../modules/audit/router.js";
import { authRouter } from "../modules/auth/router.js";
import { billingRouter } from "../modules/billing/router.js";
import { contactRouter } from "../modules/contact/router.js";
import { healthRouter } from "../modules/health/router.js";
import { incidentRouter } from "../modules/incident/router.js";
import { maintenanceRouter } from "../modules/maintenance/router.js";
import { monitorRouter } from "../modules/monitor/router.js";
import { organizationRouter } from "../modules/organization/router.js";
import { profileRouter } from "../modules/profile/router.js";
import { referralRouter } from "../modules/referral/router.js";
import { statusPageRouter } from "../modules/status-page/router.js";
import { supportRouter } from "../modules/support/router.js";
import { router } from "./trpc.js";

export const appRouter = router({
  health: healthRouter,
  auth: authRouter,
  profile: profileRouter,
  organization: organizationRouter,
  monitor: monitorRouter,
  incident: incidentRouter,
  maintenance: maintenanceRouter,
  statusPage: statusPageRouter,
  contact: contactRouter,
  audit: auditRouter,
  billing: billingRouter,
  referral: referralRouter,
  support: supportRouter,
});

export type AppRouter = typeof appRouter;
