import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { StorageError, toError } from "./errors.js";
import type { S3StorageConfig, Storage } from "./types.js";

function createS3Client(config: S3StorageConfig): S3Client {
  const credentials =
    config.accessKeyId !== undefined && config.secretAccessKey !== undefined
      ? {
          accessKeyId: config.accessKeyId,
          secretAccessKey: config.secretAccessKey,
        }
      : undefined;

  return new S3Client({
    region: config.region,
    ...(credentials === undefined ? {} : { credentials }),
    ...(config.endpoint === undefined
      ? {}
      : { endpoint: config.endpoint, forcePathStyle: true }),
  });
}

export function createS3Storage(config: S3StorageConfig): Storage {
  const client = createS3Client(config);

  return {
    async put(key, body) {
      try {
        await client.send(
          new PutObjectCommand({
            Bucket: config.bucket,
            Key: key,
            Body: body,
          }),
        );
      } catch (error) {
        throw new StorageError(`Failed to put object: ${key}`, {
          cause: toError(error),
        });
      }
    },
    async get(key) {
      try {
        const response = await client.send(
          new GetObjectCommand({
            Bucket: config.bucket,
            Key: key,
          }),
        );

        if (response.Body === undefined) {
          throw new StorageError(`Empty object body: ${key}`);
        }

        return await response.Body.transformToByteArray();
      } catch (error) {
        if (error instanceof StorageError) {
          throw error;
        }

        throw new StorageError(`Object not found: ${key}`, {
          cause: toError(error),
        });
      }
    },
    async delete(key) {
      try {
        await client.send(
          new DeleteObjectCommand({
            Bucket: config.bucket,
            Key: key,
          }),
        );
      } catch (error) {
        throw new StorageError(`Failed to delete object: ${key}`, {
          cause: toError(error),
        });
      }
    },
  };
}
