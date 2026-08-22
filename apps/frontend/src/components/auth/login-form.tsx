import { useState, type SyntheticEvent } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getBrowserAuth, isAuthConfigured } from "@/lib/supabase";

export function LoginForm() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const configured = isAuthConfigured();

  async function submit() {
    if (!configured) {
      toast.error("Supabase is not configured");
      return;
    }

    setPending(true);
    try {
      const result = await getBrowserAuth().signInWithPassword({
        email,
        password,
      });
      if (result.user === null) {
        toast.error("Sign-in did not return a user");
        return;
      }

      toast.success("Signed in");
      void navigate("/dashboard");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to sign in";
      toast.error(message);
    } finally {
      setPending(false);
    }
  }

  function onSubmit(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    void submit();
  }

  return (
    <form className="flex flex-col gap-4" onSubmit={onSubmit}>
      <div className="flex flex-col gap-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => {
            setEmail(event.target.value);
          }}
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(event) => {
            setPassword(event.target.value);
          }}
        />
      </div>
      {configured ? null : (
        <p className="text-sm text-muted-foreground">
          Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to enable sign-in.
        </p>
      )}
      <Button type="submit" disabled={pending || !configured}>
        {pending ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  );
}
