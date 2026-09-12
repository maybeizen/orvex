export function AuthFieldError({ message }: { message: string | null }) {
  return (
    <p
      role={message === null ? undefined : "alert"}
      className="min-h-5 text-xs leading-5 text-destructive"
    >
      {message ?? "\u00a0"}
    </p>
  );
}
