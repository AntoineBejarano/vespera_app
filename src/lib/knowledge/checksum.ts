import { createHash } from "node:crypto";

export function sha256Hex(input: string | Buffer | Uint8Array): string {
  return createHash("sha256").update(input).digest("hex");
}

/** Stable checksum from ordered parts (revision + normalized sample + config). */
export function reproducibleChecksum(parts: Array<string | number | null | undefined>) {
  const payload = parts
    .map((p) => (p == null ? "" : String(p)))
    .join("\n---\n");
  return sha256Hex(payload);
}

export function shortHash(hex: string, len = 12) {
  return hex.slice(0, len);
}
