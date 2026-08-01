import { NextResponse } from "next/server";
import { getAppUser } from "@/lib/session";
import { needsAccountAgeGate } from "@/lib/legal/gate";
import { accessCookieOptions } from "@/lib/legal/access-cookie";
import { LEGAL_VERSION } from "@/lib/legal/constants";

/**
 * For authenticated users who already attested on the account:
 * re-issue the browser access cookie without showing the age-gate form.
 */
export async function POST() {
  const user = await getAppUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  if (needsAccountAgeGate(user)) {
    return NextResponse.json(
      { error: "Account attestation required", needsGate: true },
      { status: 409 },
    );
  }

  const res = NextResponse.json({
    ok: true,
    legalVersion: LEGAL_VERSION,
    restored: true,
  });
  res.cookies.set(accessCookieOptions());
  return res;
}
