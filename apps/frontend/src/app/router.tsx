import { Navigate, createBrowserRouter } from "react-router";
import { RequireOrgSlug } from "@/components/auth/require-org-slug";
import { RequireOrganization } from "@/components/auth/require-organization";
import { AppShell } from "@/components/layout/app-shell";
import { AccountShell, OrgHomeShell } from "@/components/layout/header-shell";
import { ORGANIZATIONS_HOME } from "@/lib/org-paths";
import { AuthCallbackPage } from "@/routes/auth-callback-page";
import { DashboardPage } from "@/routes/dashboard-page";
import { ForgotPasswordPage } from "@/routes/forgot-password-page";
import { LandingPage } from "@/routes/landing-page";
import { LoginPage } from "@/routes/login-page";
import { OnboardingCheckoutPage } from "@/routes/onboarding-checkout-page";
import { OnboardingPage } from "@/routes/onboarding-page";
import { OrganizationsPage } from "@/routes/organizations-page";
import { ProfilePage } from "@/routes/profile-page";
import { RegisterPage } from "@/routes/register-page";
import { ResetPasswordPage } from "@/routes/reset-password-page";
import { SettingsPage } from "@/routes/settings-page";
import { TermsPage } from "@/routes/terms-page";
import { TwoFactorPage } from "@/routes/two-factor-page";
import {
  ChangelogPage,
  ContactsPage,
  DocsPage,
  MonitorsPage,
  SupportEmailPage,
  WhiteLabelPage,
} from "@/routes/workspace-pages";
import { Providers } from "./providers";

export const router = createBrowserRouter([
  {
    element: <Providers />,
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
      {
        path: "/dashboard",
        element: <Navigate to={ORGANIZATIONS_HOME} replace />,
      },
      {
        element: (
          <RequireOrganization>
            <OrgHomeShell />
          </RequireOrganization>
        ),
        children: [{ path: "/organizations", element: <OrganizationsPage /> }],
      },
      {
        element: (
          <RequireOrganization>
            <RequireOrgSlug>
              <AppShell />
            </RequireOrgSlug>
          </RequireOrganization>
        ),
        children: [
          {
            path: "/organizations/:slug/dashboard",
            element: <DashboardPage />,
          },
          {
            path: "/organizations/:slug/monitors",
            element: <MonitorsPage />,
          },
          {
            path: "/organizations/:slug/white-label",
            element: <WhiteLabelPage />,
          },
          {
            path: "/organizations/:slug/contacts",
            element: <ContactsPage />,
          },
          {
            path: "/organizations/:slug/support/changelog",
            element: <ChangelogPage />,
          },
          {
            path: "/organizations/:slug/support/docs",
            element: <DocsPage />,
          },
          {
            path: "/organizations/:slug/support/email",
            element: <SupportEmailPage />,
          },
        ],
      },
      {
        element: <AccountShell />,
        children: [
          { path: "/profile", element: <ProfilePage /> },
          { path: "/settings", element: <SettingsPage /> },
        ],
      },
    ],
  },
]);
