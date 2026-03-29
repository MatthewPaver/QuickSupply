import { describe, it, expect } from "vitest";

// Test the magic byte validation logic directly
const FILE_SIGNATURES: Record<string, number[]> = {
  pdf: [0x25, 0x50, 0x44, 0x46],
  jpg: [0xFF, 0xD8, 0xFF],
  jpeg: [0xFF, 0xD8, 0xFF],
  png: [0x89, 0x50, 0x4E, 0x47],
};

function validateFileSignature(buffer: Buffer, ext: string): boolean {
  const sig = FILE_SIGNATURES[ext];
  if (!sig) return false;
  if (buffer.length < sig.length) return false;
  return sig.every((byte, i) => buffer[i] === byte);
}

describe("file signature validation", () => {
  it("validates a valid PDF signature", () => {
    const pdfBuffer = Buffer.from([0x25, 0x50, 0x44, 0x46, 0x2D, 0x31, 0x2E]);
    expect(validateFileSignature(pdfBuffer, "pdf")).toBe(true);
  });

  it("rejects a fake PDF (wrong magic bytes)", () => {
    const fakeBuffer = Buffer.from([0x00, 0x01, 0x02, 0x03]);
    expect(validateFileSignature(fakeBuffer, "pdf")).toBe(false);
  });

  it("validates a valid JPEG signature", () => {
    const jpegBuffer = Buffer.from([0xFF, 0xD8, 0xFF, 0xE0]);
    expect(validateFileSignature(jpegBuffer, "jpg")).toBe(true);
    expect(validateFileSignature(jpegBuffer, "jpeg")).toBe(true);
  });

  it("validates a valid PNG signature", () => {
    const pngBuffer = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A]);
    expect(validateFileSignature(pngBuffer, "png")).toBe(true);
  });

  it("rejects unknown extensions", () => {
    const buffer = Buffer.from([0x25, 0x50, 0x44, 0x46]);
    expect(validateFileSignature(buffer, "exe")).toBe(false);
    expect(validateFileSignature(buffer, "html")).toBe(false);
  });

  it("rejects buffers shorter than the signature", () => {
    const shortBuffer = Buffer.from([0x25, 0x50]);
    expect(validateFileSignature(shortBuffer, "pdf")).toBe(false);
  });

  it("rejects empty buffers", () => {
    const emptyBuffer = Buffer.alloc(0);
    expect(validateFileSignature(emptyBuffer, "pdf")).toBe(false);
  });
});
