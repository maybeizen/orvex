import { createBrowserRouter } from "react-router";
import { RequireOrganization } from "@/components/auth/require-organization";
import { AppShell } from "@/components/layout/app-shell";
import { AuthCallbackPage } from "@/routes/auth-callback-page";
import { DashboardPage } from "@/routes/dashboard-page";
import { ForgotPasswordPage } from "@/routes/forgot-password-page";
import { LandingPage } from "@/routes/landing-page";
import { LoginPage } from "@/routes/login-page";
import { OnboardingCheckoutPage } from "@/routes/onboarding-checkout-page";
import { OnboardingPage } from "@/routes/onboarding-page";
import { RegisterPage } from "@/routes/register-page";
import { ResetPasswordPage } from "@/routes/reset-password-page";
import { SettingsPage } from "@/routes/settings-page";
import { TermsPage } from "@/routes/terms-page";
import { TwoFactorPage } from "@/routes/two-factor-page";
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
        element: (
          <RequireOrganization>
            <AppShell />
          </RequireOrganization>
        ),
        children: [
          { path: "/dashboard", element: <DashboardPage /> },
          { path: "/settings", element: <SettingsPage /> },
        ],
      },
    ],
  },
]);
