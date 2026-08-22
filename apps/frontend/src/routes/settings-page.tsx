import { ThemeToggle } from "@/components/theme/theme-toggle";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function SettingsPage() {
  return (
    <div className="flex max-w-xl flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Appearance for this workspace.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Theme</CardTitle>
          <CardDescription>
            Dark is the default. Light uses a darker blue accent.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-between">
          <span className="text-sm">Color mode</span>
          <ThemeToggle />
        </CardContent>
      </Card>
    </div>
  );
}
