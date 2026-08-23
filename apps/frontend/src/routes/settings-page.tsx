import { RequireSession } from "@/components/auth/require-session";
import { Enter } from "@/components/motion/enter";
import { ThemeSwitcher } from "@/components/theme/theme-switcher";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function SettingsPage() {
  return (
    <RequireSession
      title="Settings"
      description="Sign in to change appearance."
    >
      <div className="mx-auto flex w-full max-w-xl flex-col gap-6">
        <Enter>
          <div>
            <h1 className="font-heading text-2xl tracking-tight">Settings</h1>
            <p className="text-sm text-muted-foreground">
              Appearance for this workspace.
            </p>
          </div>
        </Enter>
        <Enter delay={0.04}>
          <Card>
            <CardHeader>
              <CardTitle>Theme</CardTitle>
              <CardDescription>
                Dark, light, or follow the system setting.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ThemeSwitcher />
            </CardContent>
          </Card>
        </Enter>
      </div>
    </RequireSession>
  );
}
