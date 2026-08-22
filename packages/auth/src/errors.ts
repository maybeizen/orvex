export class AuthError extends Error {
  override readonly name = "AuthError";
  readonly code: "UNAUTHORIZED";

  constructor(message: string, code: "UNAUTHORIZED" = "UNAUTHORIZED") {
    super(message);
    this.name = "AuthError";
    this.code = code;
  }
}
