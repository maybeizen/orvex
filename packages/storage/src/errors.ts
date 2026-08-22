export class StorageError extends Error {
  override readonly name = "StorageError";

  constructor(message: string, options?: { cause: Error }) {
    super(message, options);
    this.name = "StorageError";
  }
}

export function toError(error: unknown): Error {
  return error instanceof Error ? error : new Error(String(error));
}
