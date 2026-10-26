// Sniff the real format from magic bytes instead of trusting a client-supplied type.
export function sniffImage(buf) {
  if (buf.length > 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'jpeg';
  if (buf.length > 8 && buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'png';
  if (buf.length > 12 && buf.subarray(0, 4).toString() === 'RIFF' && buf.subarray(8, 12).toString() === 'WEBP') return 'webp';
  return null;
}

export class BadImage extends Error {}

export const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

/** Accepts raw base64 or a data: URL. Returns {base64, bytes, type} or throws Error with a user-safe message. */
export function decodeImage(input) {
  if (typeof input !== 'string' || !input) throw new BadImage('No image supplied.');
  const base64 = input.replace(/^data:[^;]+;base64,/, '');
  if (!/^[A-Za-z0-9+/=\s]+$/.test(base64)) throw new BadImage('Image is not valid base64.');
  const bytes = Buffer.from(base64, 'base64');
  if (bytes.length > MAX_IMAGE_BYTES) throw new BadImage('Image is larger than 8 MB.');
  const type = sniffImage(bytes);
  if (!type) throw new BadImage('Only JPEG, PNG or WebP images are supported.');
  return { base64: bytes.toString('base64'), bytes, type };
}
