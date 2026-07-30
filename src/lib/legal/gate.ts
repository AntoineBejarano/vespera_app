import { LEGAL_VERSION } from "./constants";

export function needsAccountAgeGate(user: {
  ageVerifiedAt: Date | null;
  legalVersionAccepted?: string | null;
}) {
  if (!user.ageVerifiedAt) return true;
  if (user.legalVersionAccepted !== LEGAL_VERSION) return true;
  return false;
}
