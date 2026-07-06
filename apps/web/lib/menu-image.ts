import {
  MENU_IMAGE_MAX_BYTES,
  MENU_IMAGE_MIME_TYPES,
  type ExtractMenuFromImageInput,
  type MenuImageMimeType,
} from '@repo/shared';

/**
 * Turn a user-picked menu photo into the payload the extraction endpoint
 * expects. Photos are downscaled to fit MAX_DIMENSION and re-encoded as JPEG
 * on a canvas — a phone photo shrinks from several MB to a few hundred KB,
 * which keeps uploads fast and the LLM's image tokens low. If the browser
 * can't decode the file (rare), the original bytes are sent as-is provided
 * they're an allowed type and under the server's size cap.
 */

const MAX_DIMENSION = 1600;
const JPEG_QUALITY = 0.85;

/** Thrown when the file can't be turned into an acceptable payload. */
export class MenuImageError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MenuImageError';
  }
}

export async function fileToMenuImagePayload(file: File): Promise<ExtractMenuFromImageInput> {
  try {
    return await reencodeAsJpeg(file);
  } catch {
    return fallbackToOriginalBytes(file);
  }
}

async function reencodeAsJpeg(file: File): Promise<ExtractMenuFromImageInput> {
  const bitmap = await createImageBitmap(file);
  try {
    const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('canvas 2d context unavailable');
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', JPEG_QUALITY);
    const prefix = 'data:image/jpeg;base64,';
    if (!dataUrl.startsWith(prefix)) throw new Error('jpeg encoding unsupported');
    return { image: dataUrl.slice(prefix.length), mimeType: 'image/jpeg' };
  } finally {
    bitmap.close();
  }
}

async function fallbackToOriginalBytes(file: File): Promise<ExtractMenuFromImageInput> {
  if (!(MENU_IMAGE_MIME_TYPES as readonly string[]).includes(file.type)) {
    throw new MenuImageError('Please choose a JPEG, PNG, or WebP image.');
  }
  if (file.size > MENU_IMAGE_MAX_BYTES) {
    throw new MenuImageError(
      `That image is too large — the maximum is ${Math.floor(MENU_IMAGE_MAX_BYTES / (1024 * 1024))}MB.`,
    );
  }
  const buffer = await file.arrayBuffer();
  return { image: arrayBufferToBase64(buffer), mimeType: file.type as MenuImageMimeType };
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  const CHUNK = 0x8000; // avoid call-stack limits on String.fromCharCode
  for (let i = 0; i < bytes.length; i += CHUNK) {
    binary += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
  }
  return btoa(binary);
}
