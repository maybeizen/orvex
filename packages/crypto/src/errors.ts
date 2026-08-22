export class CryptoError extends Error {
  override readonly name = "CryptoError";

  constructor(message: string, options?: { cause: Error }) {
    super(message, options);
    this.name = "CryptoError";
  }
}

export function toError(error: unknown): Error {
  return error instanceof Error ? error : new Error(String(error));
}
