/**
 * SECURITY: Magic-byte (file signature) validation.
 *
 * Why this matters:
 *   A user could rename a .exe as .pdf and attempt to trick
 *   the application into processing it. Relying solely on the
 *   file extension or browser-reported MIME type is insufficient
 *   because both are trivially spoofable.
 *
 *   This function reads the first 5 bytes of the file and checks
 *   for the PDF magic bytes: %PDF- (0x25 0x50 0x44 0x46 0x2D).
 *   Only files that pass this check are forwarded to pdf-lib.
 */

/** PDF magic bytes: %PDF- */
const PDF_MAGIC = [0x25, 0x50, 0x44, 0x46, 0x2d] as const;

/**
 * Reads the first 5 bytes of a File and verifies the PDF magic signature.
 * @param file - The File object to validate.
 * @returns Promise<boolean> — true only if the file starts with %PDF-
 */
export async function isPdf(file: File): Promise<boolean> {
  // Guard: files smaller than 5 bytes cannot be valid PDFs
  if (file.size < 5) return false;

  try {
    // Only read the first 5 bytes — minimal memory footprint
    const slice = file.slice(0, 5);
    const buffer = await slice.arrayBuffer();
    const bytes = new Uint8Array(buffer);

    return PDF_MAGIC.every((byte, i) => bytes[i] === byte);
  } catch {
    // If we cannot read the file, fail securely
    return false;
  }
}

/**
 * Returns a human-readable file size string.
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}
