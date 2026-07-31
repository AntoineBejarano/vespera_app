import { prisma } from "@/lib/db";

/** Bump when operator-responsibility text materially changes. */
export const PLATFORM_OPERATOR_VERSION = "2026-08-01";

export type PlatformOperatorUser = {
  platformOperatorAcceptedAt: Date | null;
  platformOperatorVersion: string | null;
};

export function hasPlatformOperatorAttestation(
  user: PlatformOperatorUser,
): boolean {
  return (
    user.platformOperatorAcceptedAt != null &&
    user.platformOperatorVersion === PLATFORM_OPERATOR_VERSION
  );
}

export class PlatformOperatorRequiredError extends Error {
  readonly status = 403;
  readonly code = "PLATFORM_OPERATOR_ATTESTATION_REQUIRED";

  constructor() {
    super(
      "Accept Platform Operator Responsibilities before connecting channels or API access.",
    );
  }
}

/** Record attestation or throw if checkbox not sent (new channel/API actions only). */
export async function ensurePlatformOperatorAttestation(params: {
  userId: string;
  user: PlatformOperatorUser;
  platformOperatorAccepted?: boolean;
}) {
  if (hasPlatformOperatorAttestation(params.user)) return;

  if (!params.platformOperatorAccepted) {
    throw new PlatformOperatorRequiredError();
  }

  await prisma.user.update({
    where: { id: params.userId },
    data: {
      platformOperatorAcceptedAt: new Date(),
      platformOperatorVersion: PLATFORM_OPERATOR_VERSION,
    },
  });
}

export function isPlatformOperatorRequiredError(
  err: unknown,
): err is PlatformOperatorRequiredError {
  return err instanceof PlatformOperatorRequiredError;
}
