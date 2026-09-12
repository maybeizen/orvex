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
import { LandingPage } from "@/routes/landing-page";
import { LoginPage } from "@/routes/login-page";
import { NotFoundPage } from "@/routes/not-found-page";
import { OnboardingCheckoutPage } from "@/routes/onboarding-checkout-page";
import { OnboardingPage } from "@/routes/onboarding-page";
import { PricingPage } from "@/routes/pricing-page";
import { PrivacyPage } from "@/routes/privacy-page";
import { ProfilePage } from "@/routes/profile-page";
import { RegisterPage } from "@/routes/register-page";
import { ResetPasswordPage } from "@/routes/reset-password-page";
import { SettingsPage } from "@/routes/settings-page";
import { TermsPage } from "@/routes/terms-page";
import { TwoFactorPage } from "@/routes/two-factor-page";
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
      {
        element: (
          <RequireOrganization>
            <AppShell />
          </RequireOrganization>
        ),
        children: [
          { path: "/dashboard", element: <DashboardPage /> },
          { path: "/profile", element: <ProfilePage /> },
          { path: "/settings", element: <SettingsPage /> },
          { path: "/settings/billing", element: <BillingPage /> },
        ],
      },
      { path: "*", element: <NotFoundPage /> },
    ],
  },
]);
