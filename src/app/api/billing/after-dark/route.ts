/**
 * Explicit non-Stripe endpoint: adult billing must never call Stripe APIs.
 * Replace with an adult-friendly PSP / Stars integration when ready.
 */
export async function POST() {
  return Response.json(
    {
      error:
        "After Dark billing is not available through Stripe. Use an adult-compatible processor or Telegram Stars when enabled.",
      code: "ADULT_RAIL_REQUIRED",
      docs: ["/legal/billing", "/legal/adult-content"],
    },
    { status: 501 },
  );
}
