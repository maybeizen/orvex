export function AuthFieldError({
  id,
  message,
}: {
  id?: string;
  message: string | null;
}) {
  return (
    <p
      id={id}
      role={message === null ? undefined : "alert"}
      className="min-h-5 text-xs leading-5 text-destructive"
    >
      {message ?? "\u00a0"}
    </p>
  );
}
