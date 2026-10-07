import { Navigate, createBrowserRouter } from "react-router";
import { RedirectIfAuthenticated } from "@/components/auth/redirect-if-authenticated";
import { RequireOrganization } from "@/components/auth/require-organization";
import { AccountShell } from "@/components/layout/account-shell";
import { AppShell } from "@/components/layout/app-shell";
import { LegacyAppRedirect } from "@/components/organization/legacy-redirect";
import { RequireOrgSlug } from "@/components/organization/require-org-slug";
import { lazyRoute } from "@/lib/lazy-route";
import { ErrorPage } from "@/routes/error-page";
import { NotFoundPage } from "@/routes/not-found-page";
import { Providers } from "./providers";

const AboutPage = lazyRoute(() => import("@/routes/about-page"), "AboutPage");
const AdminPage = lazyRoute(() => import("@/routes/admin-page"), "AdminPage");
const AuditLogPage = lazyRoute(
  () => import("@/routes/audit-log-page"),
  "AuditLogPage",
);
const AuthCallbackPage = lazyRoute(
  () => import("@/routes/auth-callback-page"),
  "AuthCallbackPage",
);
const BillingPage = lazyRoute(
  () => import("@/routes/billing-page"),
  "BillingPage",
);
const ChangelogPage = lazyRoute(
  () => import("@/routes/changelog-page"),
  "ChangelogPage",
);
const ContactListsPage = lazyRoute(
  () => import("@/routes/contact-lists-page"),
  "ContactListsPage",
);
const DashboardPage = lazyRoute(
  () => import("@/routes/dashboard-page"),
  "DashboardPage",
);
const DocsPage = lazyRoute(() => import("@/routes/docs-page"), "DocsPage");
const ForbiddenPage = lazyRoute(
  () => import("@/routes/forbidden-page"),
  "ForbiddenPage",
);
const ForgotPasswordPage = lazyRoute(
  () => import("@/routes/forgot-password-page"),
  "ForgotPasswordPage",
);
const IncidentDetailPage = lazyRoute(
  () => import("@/routes/incident-detail-page"),
  "IncidentDetailPage",
);
const IncidentsPage = lazyRoute(
  () => import("@/routes/incidents-page"),
  "IncidentsPage",
);
const InvitePage = lazyRoute(
  () => import("@/routes/invite-page"),
  "InvitePage",
);
const InvoicesPage = lazyRoute(
  () => import("@/routes/invoices-page"),
  "InvoicesPage",
);
const LandingPage = lazyRoute(
  () => import("@/routes/landing-page"),
  "LandingPage",
);
const LoginPage = lazyRoute(() => import("@/routes/login-page"), "LoginPage");
const MaintenancePage = lazyRoute(
  () => import("@/routes/maintenance-page"),
  "MaintenancePage",
);
const MonitorCreatePage = lazyRoute(
  () => import("@/routes/monitor-create-page"),
  "MonitorCreatePage",
);
const MonitorDetailPage = lazyRoute(
  () => import("@/routes/monitor-detail-page"),
  "MonitorDetailPage",
);
const MonitorEditPage = lazyRoute(
  () => import("@/routes/monitor-edit-page"),
  "MonitorEditPage",
);
const MonitorsPage = lazyRoute(
  () => import("@/routes/monitors-page"),
  "MonitorsPage",
);
const OnboardingCheckoutPage = lazyRoute(
  () => import("@/routes/onboarding-checkout-page"),
  "OnboardingCheckoutPage",
);
const OnboardingPage = lazyRoute(
  () => import("@/routes/onboarding-page"),
  "OnboardingPage",
);
const OrganizationSettingsPage = lazyRoute(
  () => import("@/routes/organization-settings-page"),
  "OrganizationSettingsPage",
);
const OrganizationsPage = lazyRoute(
  () => import("@/routes/organizations-page"),
  "OrganizationsPage",
);
const OrdersPage = lazyRoute(
  () => import("@/routes/orders-page"),
  "OrdersPage",
);
const PricingPage = lazyRoute(
  () => import("@/routes/pricing-page"),
  "PricingPage",
);
const PrivacyPage = lazyRoute(
  () => import("@/routes/privacy-page"),
  "PrivacyPage",
);
const PublicStatusPage = lazyRoute(
  () => import("@/routes/public-status-page"),
  "PublicStatusPage",
);
const ReferralsPage = lazyRoute(
  () => import("@/routes/referrals-page"),
  "ReferralsPage",
);
const RegisterPage = lazyRoute(
  () => import("@/routes/register-page"),
  "RegisterPage",
);
const ResetPasswordPage = lazyRoute(
  () => import("@/routes/reset-password-page"),
  "ResetPasswordPage",
);
const SettingsPage = lazyRoute(
  () => import("@/routes/settings-page"),
  "SettingsPage",
);
const StatusConfirmRedirect = lazyRoute(
  () => import("@/routes/public-status-page"),
  "StatusConfirmRedirect",
);
const StatusPageDetailPage = lazyRoute(
  () => import("@/routes/status-page-detail-page"),
  "StatusPageDetailPage",
);
const StatusPagesPage = lazyRoute(
  () => import("@/routes/status-pages-page"),
  "StatusPagesPage",
);
const SupportPage = lazyRoute(
  () => import("@/routes/support-page"),
  "SupportPage",
);
const TeamMembersPage = lazyRoute(
  () => import("@/routes/team-members-page"),
  "TeamMembersPage",
);
const TermsPage = lazyRoute(() => import("@/routes/terms-page"), "TermsPage");
const TwoFactorPage = lazyRoute(
  () => import("@/routes/two-factor-page"),
  "TwoFactorPage",
);
const WhiteLabelPage = lazyRoute(
  () => import("@/routes/white-label-page"),
  "WhiteLabelPage",
);

const orgChildren = [
  { index: true, element: <DashboardPage /> },
  { path: "monitors", element: <MonitorsPage /> },
  { path: "monitors/new", element: <MonitorCreatePage /> },
  { path: "monitors/:monitorId", element: <MonitorDetailPage /> },
  { path: "monitors/:monitorId/edit", element: <MonitorEditPage /> },
  { path: "incidents", element: <IncidentsPage /> },
  { path: "incidents/:incidentId", element: <IncidentDetailPage /> },
  { path: "maintenance", element: <MaintenancePage /> },
  { path: "status-pages", element: <StatusPagesPage /> },
  { path: "status-pages/:pageId", element: <StatusPageDetailPage /> },
  { path: "contact-lists", element: <ContactListsPage /> },
  { path: "white-label", element: <WhiteLabelPage /> },
  { path: "team", element: <TeamMembersPage /> },
  { path: "audit-log", element: <AuditLogPage /> },
  { path: "orders", element: <OrdersPage /> },
  { path: "invoices", element: <InvoicesPage /> },
  { path: "billing", element: <BillingPage /> },
  { path: "referrals", element: <ReferralsPage /> },
  { path: "support", element: <SupportPage /> },
  { path: "docs", element: <DocsPage /> },
  { path: "settings", element: <OrganizationSettingsPage /> },
];

export const router = createBrowserRouter([
  {
    element: <Providers />,
    errorElement: <ErrorPage />,
    children: [
      { path: "/", element: <LandingPage /> },
      {
        path: "/login",
        element: (
          <RedirectIfAuthenticated>
            <LoginPage />
          </RedirectIfAuthenticated>
        ),
      },
      {
        path: "/login/2fa",
        element: (
          <RedirectIfAuthenticated>
            <TwoFactorPage />
          </RedirectIfAuthenticated>
        ),
      },
      {
        path: "/register",
        element: (
          <RedirectIfAuthenticated>
            <RegisterPage />
          </RedirectIfAuthenticated>
        ),
      },
      {
        path: "/forgot-password",
        element: (
          <RedirectIfAuthenticated>
            <ForgotPasswordPage />
          </RedirectIfAuthenticated>
        ),
      },
      { path: "/reset-password", element: <ResetPasswordPage /> },
      { path: "/auth/callback", element: <AuthCallbackPage /> },
      { path: "/onboarding", element: <OnboardingPage /> },
      { path: "/onboarding/checkout", element: <OnboardingCheckoutPage /> },
      { path: "/terms", element: <TermsPage /> },
      { path: "/privacy", element: <PrivacyPage /> },
      { path: "/about", element: <AboutPage /> },
      { path: "/changelog", element: <ChangelogPage /> },
      { path: "/pricing", element: <PricingPage /> },
      { path: "/forbidden", element: <ForbiddenPage /> },
      { path: "/invite/:token", element: <InvitePage /> },
      { path: "/s/:pageSlug", element: <PublicStatusPage /> },
      {
        path: "/status/:pageSlug/confirm",
        element: <StatusConfirmRedirect />,
      },
      {
        path: "/status/:orgSlug/:pageSlug/confirm",
        element: <StatusConfirmRedirect />,
      },
      {
        element: <AccountShell />,
        children: [
          { path: "/organizations", element: <OrganizationsPage /> },
          { path: "/settings", element: <SettingsPage /> },
          { path: "/profile", element: <Navigate to="/settings" replace /> },
          { path: "/admin", element: <AdminPage /> },
        ],
      },
      {
        element: (
          <RequireOrganization>
            <RequireOrgSlug>
              <AppShell />
            </RequireOrgSlug>
          </RequireOrganization>
        ),
        children: [{ path: "/organization/:slug", children: orgChildren }],
      },
      {
        element: <LegacyAppRedirect />,
        path: "/dashboard",
      },
      { path: "/monitors/*", element: <LegacyAppRedirect /> },
      { path: "/incidents/*", element: <LegacyAppRedirect /> },
      { path: "/maintenance/*", element: <LegacyAppRedirect /> },
      { path: "/status-pages/*", element: <LegacyAppRedirect /> },
      { path: "/contact-lists", element: <LegacyAppRedirect /> },
      { path: "/white-label", element: <LegacyAppRedirect /> },
      { path: "/team", element: <LegacyAppRedirect /> },
      { path: "/audit-log", element: <LegacyAppRedirect /> },
      { path: "/orders", element: <LegacyAppRedirect /> },
      { path: "/invoices", element: <LegacyAppRedirect /> },
      { path: "/referrals", element: <LegacyAppRedirect /> },
      { path: "/support", element: <LegacyAppRedirect /> },
      { path: "/docs", element: <LegacyAppRedirect /> },
      { path: "/settings/organization", element: <LegacyAppRedirect /> },
      { path: "/billing", element: <LegacyAppRedirect /> },
      { path: "/settings/billing", element: <LegacyAppRedirect /> },
      { path: "*", element: <NotFoundPage /> },
    ],
  },
]);
