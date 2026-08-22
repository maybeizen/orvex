export type LogPrimitive = string | number | boolean | null;

export type LogValue =
  | LogPrimitive
  | readonly LogValue[]
  | { readonly [key: string]: LogValue };

export type LogMeta = { readonly [key: string]: LogValue };

export type LoggerOptions = {
  service: string;
};

export type OrvexLogger = {
  readonly service: string;
  info(message: string, meta?: LogMeta): void;
  warn(message: string, meta?: LogMeta): void;
  error(message: string, meta?: LogMeta): void;
  debug(message: string, meta?: LogMeta): void;
  child(bindings: LogMeta): OrvexLogger;
};
