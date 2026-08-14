const ENV_NAME = /^[A-Z][A-Z0-9_]{2,127}$/;

export function isValidAuthSecretRef(ref: string | null | undefined): boolean {
  if (!ref) return false;
  return ENV_NAME.test(ref);
}

/**
 * Resolve a Railway/env secret by reference. Never log the value.
 */
export function resolveAuthSecret(
  authSecretRef: string | null | undefined,
): { ok: true; secret: string } | { ok: false; error: string } {
  if (!authSecretRef) {
    return { ok: false, error: "Runtime binding is missing authSecretRef." };
  }
  if (!isValidAuthSecretRef(authSecretRef)) {
    return { ok: false, error: "Invalid authSecretRef." };
  }
  const secret = process.env[authSecretRef];
  if (!secret) {
    return {
      ok: false,
      error: "Runtime auth secret is not configured.",
    };
  }
  return { ok: true, secret };
}
