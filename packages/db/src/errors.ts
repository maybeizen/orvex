export class DbConfigError extends Error {
  override readonly name = "DbConfigError";

  constructor(message: string) {
    super(message);
    this.name = "DbConfigError";
  }
}
