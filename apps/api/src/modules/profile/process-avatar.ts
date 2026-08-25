import { fileTypeFromBuffer } from "file-type";
import sharp from "sharp";

const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp"]);

export class InvalidAvatarError extends Error {
  constructor(message = "Image must be a JPEG, PNG, or WebP") {
    super(message);
    this.name = "InvalidAvatarError";
  }
}

export async function processAvatar(input: Uint8Array): Promise<Buffer> {
  const detected = await fileTypeFromBuffer(input);
  if (detected === undefined || !ALLOWED_MIME.has(detected.mime)) {
    throw new InvalidAvatarError();
  }

  try {
    return await sharp(input)
      .rotate()
      .resize(512, 512, { fit: "cover" })
      .webp({ quality: 82, effort: 4 })
      .toBuffer();
  } catch {
    throw new InvalidAvatarError("Unable to process image");
  }
}
