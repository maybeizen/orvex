export type LocalStorageConfig = {
  driver: "local";
  dir: string;
};

export type S3StorageConfig = {
  driver: "s3";
  region: string;
  bucket: string;
  accessKeyId?: string;
  secretAccessKey?: string;
  endpoint?: string;
};

export type StorageConfig = LocalStorageConfig | S3StorageConfig;

export type Storage = {
  put(key: string, body: Uint8Array): Promise<void>;
  get(key: string): Promise<Uint8Array>;
  delete(key: string): Promise<void>;
};
