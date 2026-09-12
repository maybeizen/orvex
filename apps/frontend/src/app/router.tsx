import { createBrowserRouter } from "react-router";
import { RequireOrganization } from "@/components/auth/require-organization";
import { AppShell } from "@/components/layout/app-shell";
import { AuthCallbackPage } from "@/routes/auth-callback-page";
import { BillingPage } from "@/routes/billing-page";
import { DashboardPage } from "@/routes/dashboard-page";
import { ErrorPage } from "@/routes/error-page";
import { ForbiddenPage } from "@/routes/forbidden-page";
import { AboutPage } from "@/routes/about-page";
import { ChangelogPage } from "@/routes/changelog-page";
import { ForgotPasswordPage } from "@/routes/forgot-password-page";
import { IncidentDetailPage } from "@/routes/incident-detail-page";
import { IncidentsPage } from "@/routes/incidents-page";
import { LandingPage } from "@/routes/landing-page";
import { LoginPage } from "@/routes/login-page";
import { MonitorCreatePage } from "@/routes/monitor-create-page";
import { MonitorDetailPage } from "@/routes/monitor-detail-page";
import { MonitorEditPage } from "@/routes/monitor-edit-page";
import { MonitorsPage } from "@/routes/monitors-page";
import { NotFoundPage } from "@/routes/not-found-page";
import { OnboardingCheckoutPage } from "@/routes/onboarding-checkout-page";
import { OnboardingPage } from "@/routes/onboarding-page";
import { PricingPage } from "@/routes/pricing-page";
import { PrivacyPage } from "@/routes/privacy-page";
import { ProfilePage } from "@/routes/profile-page";
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
import {
  AuditLogPage,
  ContactListsPage,
  OrdersPage,
  ReferralsPage,
  SupportPage,
  WhiteLabelPage,
} from "@/routes/workspace-pages";
import { Providers } from "./providers";

export const router = createBrowserRouter([
  {
    element: <Providers />,
    errorElement: <ErrorPage />,
    children: [
      { path: "/", element: <LandingPage /> },
      { path: "/login", element: <LoginPage /> },
      { path: "/login/2fa", element: <TwoFactorPage /> },
      { path: "/register", element: <RegisterPage /> },
      { path: "/forgot-password", element: <ForgotPasswordPage /> },
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
        element: (
          <RequireOrganization>
            <AppShell />
          </RequireOrganization>
        ),
        children: [
          { path: "/dashboard", element: <DashboardPage /> },
          { path: "/monitors", element: <MonitorsPage /> },
          { path: "/monitors/new", element: <MonitorCreatePage /> },
          { path: "/monitors/:monitorId", element: <MonitorDetailPage /> },
          { path: "/monitors/:monitorId/edit", element: <MonitorEditPage /> },
          { path: "/incidents", element: <IncidentsPage /> },
          { path: "/incidents/:incidentId", element: <IncidentDetailPage /> },
          { path: "/status-pages", element: <StatusPagesPage /> },
          { path: "/status-pages/:pageId", element: <StatusPageDetailPage /> },
          { path: "/contact-lists", element: <ContactListsPage /> },
          { path: "/white-label", element: <WhiteLabelPage /> },
          { path: "/team", element: <TeamMembersPage /> },
          { path: "/audit-log", element: <AuditLogPage /> },
          { path: "/orders", element: <OrdersPage /> },
          { path: "/invoices", element: <InvoicesPage /> },
          { path: "/referrals", element: <ReferralsPage /> },
          { path: "/support", element: <SupportPage /> },
          { path: "/docs", element: <DocsPage /> },
          { path: "/profile", element: <ProfilePage /> },
          { path: "/settings", element: <SettingsPage /> },
          {
            path: "/settings/organization",
            element: <OrganizationSettingsPage />,
          },
          { path: "/settings/billing", element: <BillingPage /> },
        ],
      },
      { path: "*", element: <NotFoundPage /> },
    ],
  },
]);
