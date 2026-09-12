import { Navigate, createBrowserRouter } from "react-router";
import { RedirectIfAuthenticated } from "@/components/auth/redirect-if-authenticated";
import { RequireOrganization } from "@/components/auth/require-organization";
import { AccountShell } from "@/components/layout/account-shell";
import { AppShell } from "@/components/layout/app-shell";
import { LegacyAppRedirect } from "@/components/organization/legacy-redirect";
import { RequireOrgSlug } from "@/components/organization/require-org-slug";
import { AuthCallbackPage } from "@/routes/auth-callback-page";
import { BillingPage } from "@/routes/billing-page";
import { DashboardPage } from "@/routes/dashboard-page";
import { ErrorPage } from "@/routes/error-page";
import { AboutPage } from "@/routes/about-page";
import { AdminPage } from "@/routes/admin-page";
import { ForbiddenPage } from "@/routes/forbidden-page";
import { ChangelogPage } from "@/routes/changelog-page";
import { ForgotPasswordPage } from "@/routes/forgot-password-page";
import { IncidentDetailPage } from "@/routes/incident-detail-page";
import { IncidentsPage } from "@/routes/incidents-page";
import { MaintenancePage } from "@/routes/maintenance-page";
import { LandingPage } from "@/routes/landing-page";
import { LoginPage } from "@/routes/login-page";
import { MonitorCreatePage } from "@/routes/monitor-create-page";
import { MonitorDetailPage } from "@/routes/monitor-detail-page";
import { MonitorEditPage } from "@/routes/monitor-edit-page";
import { MonitorsPage } from "@/routes/monitors-page";
import { NotFoundPage } from "@/routes/not-found-page";
import { OnboardingCheckoutPage } from "@/routes/onboarding-checkout-page";
import { OnboardingPage } from "@/routes/onboarding-page";
import { OrganizationsPage } from "@/routes/organizations-page";
import { PricingPage } from "@/routes/pricing-page";
import { PrivacyPage } from "@/routes/privacy-page";
import { RegisterPage } from "@/routes/register-page";
import { ResetPasswordPage } from "@/routes/reset-password-page";
import { InvitePage } from "@/routes/invite-page";
import { InvoicesPage } from "@/routes/invoices-page";
import { OrganizationSettingsPage } from "@/routes/organization-settings-page";
import { SettingsPage } from "@/routes/settings-page";
import { StatusPageDetailPage } from "@/routes/status-page-detail-page";
import { StatusPagesPage } from "@/routes/status-pages-page";
import { TeamMembersPage } from "@/routes/team-members-page";
import { TermsPage } from "@/routes/terms-page";
import { TwoFactorPage } from "@/routes/two-factor-page";
import { DocsPage } from "@/routes/docs-page";
import { AuditLogPage } from "@/routes/audit-log-page";
import { OrdersPage } from "@/routes/orders-page";
import { ReferralsPage } from "@/routes/referrals-page";
import { SupportPage } from "@/routes/support-page";
import {
  ContactListsPage,
  WhiteLabelPage,
} from "@/routes/workspace-pages";
import { Providers } from "./providers";

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
      { path: "/settings/billing", element: <LegacyAppRedirect /> },
      { path: "*", element: <NotFoundPage /> },
    ],
  },
]);
