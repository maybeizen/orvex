export class AccessError extends Error {
  override readonly name = "AccessError";

  constructor(message: string, options?: { cause: Error }) {
    super(message, options);
    this.name = "AccessError";
  }
}

export function toError(error: unknown): Error {
  return error instanceof Error ? error : new Error(String(error));
}
