export function needsAccountAgeGate(_user: {
  ageVerifiedAt: Date | null;
  legalVersionAccepted?: string | null;
}) {
  // SFW self-service no longer requires age clickwrap before create.
  // Adult delivery uses HEAA fields (ageAssuredAt) via content-policy.
  return false;
}
