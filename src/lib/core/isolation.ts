import { isAfterDarkHost } from "@/lib/hosts";

export class RuntimeIsolationError extends Error {
  status = 403;
  code = "RUNTIME_ISOLATION";
  constructor(message = "After Dark personas cannot use the external runtime API.") {
    super(message);
    this.name = "RuntimeIsolationError";
  }
}

export function isAdultPersonaBlockedFromExternal(character: {
  isAdult?: boolean | null;
}): boolean {
  return Boolean(character.isAdult);
}

/** Hard-deny: adult personas and After Dark hosts never leave Native. */
export function assertExternalRuntimeAllowed(params: {
  character: { isAdult?: boolean | null };
  host?: string | null;
}): void {
  if (isAdultPersonaBlockedFromExternal(params.character)) {
    throw new RuntimeIsolationError();
  }
  if (params.host && isAfterDarkHost(params.host)) {
    throw new RuntimeIsolationError(
      "After Dark host cannot expose persona context to an external runtime.",
    );
  }
}

export function denyAdultEnvelope<T extends { isAdult?: boolean | null }>(
  character: T,
): { ok: false; status: 403; error: string } | null {
  if (isAdultPersonaBlockedFromExternal(character)) {
    return {
      ok: false,
      status: 403,
      error: "After Dark personas cannot use the external runtime API.",
    };
  }
  return null;
}
