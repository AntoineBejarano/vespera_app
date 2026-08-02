import { getResendClient } from "@/lib/email/client";
import { getEmailConfig } from "@/lib/email/config";
import { getSuperadminEmails } from "@/lib/platform/superadmin";

export const runtime = "nodejs";

type ResendReceivedEvent = {
  type?: string;
  data?: {
    email_id?: string;
    from?: string;
    to?: string[] | string;
    subject?: string;
  };
};

/**
 * Resend inbound webhook (`email.received`).
 * Forwards received mail to SUPERADMIN_EMAILS via Resend receiving.forward.
 */
export async function POST(req: Request) {
  const secret = process.env.RESEND_WEBHOOK_SECRET?.trim();
  const resend = getResendClient();
  if (!resend || !secret) {
    console.error("[resend_webhook] missing RESEND_API_KEY or RESEND_WEBHOOK_SECRET");
    return Response.json({ error: "Webhook not configured" }, { status: 503 });
  }

  const rawBody = await req.text();
  try {
    // Resend uses Svix headers (svix-id / timestamp / signature).
    resend.webhooks.verify({
      payload: rawBody,
      headers: {
        id: req.headers.get("svix-id") ?? "",
        timestamp: req.headers.get("svix-timestamp") ?? "",
        signature: req.headers.get("svix-signature") ?? "",
      },
      webhookSecret: secret,
    });
  } catch (err) {
    console.error("[resend_webhook] signature verify failed", err);
    return Response.json({ error: "Invalid signature" }, { status: 401 });
  }

  let event: ResendReceivedEvent;
  try {
    event = JSON.parse(rawBody) as ResendReceivedEvent;
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (event.type !== "email.received") {
    return Response.json({ ok: true, ignored: event.type ?? "unknown" });
  }

  const emailId = event.data?.email_id;
  if (!emailId) {
    return Response.json({ error: "Missing email_id" }, { status: 400 });
  }

  const forwardTo = getSuperadminEmails();
  if (forwardTo.length === 0) {
    console.error("[resend_webhook] no SUPERADMIN_EMAILS to forward to");
    return Response.json({ error: "No forward targets" }, { status: 500 });
  }

  const config = getEmailConfig();
  const { error } = await resend.emails.receiving.forward({
    emailId,
    to: forwardTo,
    from: config.from,
  });

  if (error) {
    console.error("[resend_webhook] forward failed", emailId, error);
    return Response.json({ error: error.message || "Forward failed" }, { status: 502 });
  }

  console.info("[resend_webhook] forwarded", {
    emailId,
    to: forwardTo,
    subject: event.data?.subject,
    from: event.data?.from,
  });

  return Response.json({ ok: true, forwardedTo: forwardTo });
}
