import { useEffect, useState, type SyntheticEvent } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { applyProfileToSession } from "@/lib/session-profile";
import { createVanillaTrpcClient } from "@/lib/trpc";
import {
  USERNAME_PATTERN,
  normalizeUsername,
  usernameHint,
} from "@/lib/username";
import { useSessionStore } from "@/stores/session-store";

export function IdentityForm() {
  const user = useSessionStore((state) => state.user);
  const [firstName, setFirstName] = useState(user?.firstName ?? "");
  const [lastName, setLastName] = useState(user?.lastName ?? "");
  const [username, setUsername] = useState(user?.username ?? "");
  const [available, setAvailable] = useState<boolean | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    setFirstName(user?.firstName ?? "");
    setLastName(user?.lastName ?? "");
    setUsername(user?.username ?? "");
  }, [user?.firstName, user?.lastName, user?.username]);

  useEffect(() => {
    const next = normalizeUsername(username);
    if (
      next.length === 0 ||
      !USERNAME_PATTERN.test(next) ||
      next === user?.username
    ) {
      setAvailable(null);
      return;
    }

    const handle = window.setTimeout(() => {
      void createVanillaTrpcClient()
        .profile.usernameAvailable.query({ username: next })
        .then((ok) => {
          setAvailable(ok);
        })
        .catch(() => {
          setAvailable(null);
        });
    }, 280);

    return () => {
      window.clearTimeout(handle);
    };
  }, [username, user?.username]);

  if (user === null) {
    return null;
  }

  const hint = usernameHint(normalizeUsername(username), user.username);
  const taken = available === false;

  async function submit() {
    const nextUsername = normalizeUsername(username);
    const nextFirst = firstName.trim();
    const nextLast = lastName.trim();
    if (nextFirst.length === 0) {
      toast.error("First name is required");
      return;
    }
    if (!USERNAME_PATTERN.test(nextUsername)) {
      toast.error("Choose a valid username");
      return;
    }
    if (taken) {
      toast.error("That username is already taken");
      return;
    }

    setPending(true);
    try {
      const profile = await createVanillaTrpcClient().profile.updateIdentity.mutate(
        {
          username: nextUsername,
          firstName: nextFirst,
          lastName: nextLast,
        },
      );
      applyProfileToSession(profile);
      toast.success("Profile saved");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to save profile";
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
    <form className="flex flex-col gap-5 px-6 py-6" onSubmit={onSubmit}>
      <div className="flex flex-col gap-1">
        <h2 className="font-heading text-base">About you</h2>
        <p className="text-sm text-muted-foreground">
          This is how teammates see you on the desk.
        </p>
      </div>
      <FieldGroup>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="profile-first-name">First name</FieldLabel>
            <Input
              id="profile-first-name"
              autoComplete="given-name"
              required
              value={firstName}
              onChange={(event) => {
                setFirstName(event.target.value);
              }}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="profile-last-name">Last name</FieldLabel>
            <Input
              id="profile-last-name"
              autoComplete="family-name"
              value={lastName}
              onChange={(event) => {
                setLastName(event.target.value);
              }}
            />
          </Field>
        </div>
        <Field data-invalid={taken || (hint !== null && username.length > 0 && !USERNAME_PATTERN.test(normalizeUsername(username)))}>
          <FieldLabel htmlFor="profile-username">Username</FieldLabel>
          <div className="flex">
            <span className="inline-flex items-center rounded-l-lg border border-r-0 border-input bg-muted/50 px-3 text-sm text-muted-foreground">
              @
            </span>
            <Input
              id="profile-username"
              autoComplete="username"
              required
              aria-invalid={taken}
              className="rounded-l-none"
              value={username}
              onChange={(event) => {
                setUsername(normalizeUsername(event.target.value));
              }}
            />
          </div>
          <FieldDescription>
            {taken
              ? "That username is taken."
              : available === true
                ? "Available."
                : (hint ?? "3–24 characters. Letters, numbers, and underscores.")}
          </FieldDescription>
        </Field>
      </FieldGroup>
      <div>
        <Button type="submit" disabled={pending}>
          {pending ? <Spinner data-icon="inline-start" /> : null}
          {pending ? "Saving" : "Save profile"}
        </Button>
      </div>
    </form>
  );
}
