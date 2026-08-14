import { NextResponse } from "next/server";
import { SITE_URL } from "@/lib/site";

export const dynamic = "force-static";

/** Alias of /skill — consolidate ranking signals on the canonical path. */
export async function GET() {
  return NextResponse.redirect(`${SITE_URL}/skill`, 308);
}
