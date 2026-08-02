import { headers } from "next/headers";
import { isAfterDarkHost } from "@/lib/hosts";

/**
 * Hard block: never run Stripe billing on the After Dark host.
 * Subdomain separation helps branding/SEO; this enforces the payment split.
 */
export async function assertStripeSurfaceAllowed(): Promise<
  { ok: true } | { ok: false; response: Response }
> {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  if (isAfterDarkHost(host)) {
    return {
      ok: false,
      response: Response.json(
        {
          error:
            "Stripe billing is not available on After Dark. Adult plans use a separate payment rail.",
          code: "STRIPE_SURFACE_FORBIDDEN",
        },
        { status: 403 },
      ),
    };
  }
  return { ok: true };
}
