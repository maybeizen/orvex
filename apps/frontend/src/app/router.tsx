import { Navigate, createBrowserRouter } from "react-router";
import { RequireOrgSlug } from "@/components/auth/require-org-slug";
import { RequireOrganization } from "@/components/auth/require-organization";
import { AppShell } from "@/components/layout/app-shell";
import { AccountShell, OrgHomeShell } from "@/components/layout/header-shell";
import { ORG_NAV_LEGACY_SEGMENTS, orgNavSegments } from "@/lib/org-nav";
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
import { TeamMembersPage } from "@/routes/team-members-page";
import { TermsPage } from "@/routes/terms-page";
import { TwoFactorPage } from "@/routes/two-factor-page";
import {
  WorkspaceComingSoonPage,
  LegacyOrgSegmentRedirect,
} from "@/routes/workspace-pages";
import { Providers } from "./providers";

const comingSoonSegments = orgNavSegments().filter(
  (segment) => segment !== "team-members",
);

const orgWorkspaceRoutes = [
  {
    path: "/organizations/:slug/dashboard",
    element: <DashboardPage />,
  },
  {
    path: "/organizations/:slug/team-members",
    element: <TeamMembersPage />,
  },
  ...comingSoonSegments.map((segment) => ({
    path: `/organizations/:slug/${segment}`,
    element: <WorkspaceComingSoonPage segment={segment} />,
  })),
  ...Object.entries(ORG_NAV_LEGACY_SEGMENTS).map(([from, to]) => ({
    path: `/organizations/:slug/${from}`,
    element: <LegacyOrgSegmentRedirect to={to} />,
  })),
];

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
        children: orgWorkspaceRoutes,
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
