import { createBrowserRouter } from "react-router";
import { AppShell } from "@/components/layout/app-shell";
import { DashboardPage } from "@/routes/dashboard-page";
import { LandingPage } from "@/routes/landing-page";
import { LoginPage } from "@/routes/login-page";
import { SettingsPage } from "@/routes/settings-page";
import { Providers } from "./providers";

export const router = createBrowserRouter([
  {
    element: <Providers />,
    children: [
      { path: "/", element: <LandingPage /> },
      { path: "/login", element: <LoginPage /> },
      {
        element: <AppShell />,
        children: [
          { path: "/dashboard", element: <DashboardPage /> },
          { path: "/settings", element: <SettingsPage /> },
        ],
      },
    ],
  },
]);
