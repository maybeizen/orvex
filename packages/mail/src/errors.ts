export class MailError extends Error {
  override readonly name = "MailError";

  constructor(message: string, options?: { cause: Error }) {
    super(message, options);
    this.name = "MailError";
  }
}

export function toError(error: unknown): Error {
  return error instanceof Error ? error : new Error(String(error));
}

export function isEnoent(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "ENOENT"
  );
}
