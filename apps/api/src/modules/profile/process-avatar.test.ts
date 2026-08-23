import { expect, test } from "vitest";
import sharp from "sharp";
import { InvalidAvatarError, processAvatar } from "./process-avatar.js";

const gif = Buffer.from(
  "GIF89a\u0001\u0000\u0001\u0000\u0000\u0000\u0000",
  "latin1",
);
const svg = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"></svg>');
const pdf = Buffer.from("%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF");

async function tinyJpeg(): Promise<Buffer> {
  return sharp({
    create: {
      width: 16,
      height: 16,
      channels: 3,
      background: { r: 220, g: 40, b: 40 },
    },
  })
    .jpeg()
    .toBuffer();
}

function jpegWithGps(base: Buffer): Buffer {
  const payload = Buffer.concat([
    Buffer.from("Exif\0\0GPSLatitude\0", "latin1"),
    Buffer.from("37.7749N\0GPSLongitude\0", "latin1"),
    Buffer.from("122.4194W", "latin1"),
  ]);
  const app1 = Buffer.alloc(4 + payload.length);
  app1[0] = 0xff;
  app1[1] = 0xe1;
  app1.writeUInt16BE(payload.length + 2, 2);
  payload.copy(app1, 4);
  return Buffer.concat([base.subarray(0, 2), app1, base.subarray(2)]);
}

test("processAvatar rejects gif magic bytes", async () => {
  await expect(processAvatar(gif)).rejects.toBeInstanceOf(InvalidAvatarError);
});

test("processAvatar rejects svg", async () => {
  await expect(processAvatar(svg)).rejects.toBeInstanceOf(InvalidAvatarError);
});

test("processAvatar rejects pdf magic bytes", async () => {
  await expect(processAvatar(pdf)).rejects.toBeInstanceOf(InvalidAvatarError);
});

test("processAvatar strips EXIF GPS from jpeg output", async () => {
  const input = jpegWithGps(await tinyJpeg());
  expect(input.includes(Buffer.from("GPSLatitude", "ascii"))).toBe(true);
  expect(input.includes(Buffer.from("37.7749", "ascii"))).toBe(true);

  const output = await processAvatar(input);
  const metadata = await sharp(output).metadata();

  expect(metadata.format).toBe("webp");
  expect(metadata.width).toBe(512);
  expect(metadata.height).toBe(512);
  expect(metadata.exif).toBeUndefined();
  expect(output.includes(Buffer.from("Exif", "ascii"))).toBe(false);
  expect(output.includes(Buffer.from("GPSLatitude", "ascii"))).toBe(false);
  expect(output.includes(Buffer.from("37.7749", "ascii"))).toBe(false);
  expect(output.includes(Buffer.from("122.4194", "ascii"))).toBe(false);
});
