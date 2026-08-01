import { getResendClient } from "@/lib/email/client";
import {
  getEmailConfig,
  isTemplateEnabled,
} from "@/lib/email/config";
import {
  renderTemplate,
  type TemplatePropsMap,
} from "@/lib/email/templates";
import type {
  EmailSendResult,
  EmailTemplateId,
  SendEmailInput,
} from "@/lib/email/types";

function normalizeTo(to: SendEmailInput["to"]): string[] {
  const list = Array.isArray(to) ? to : [to];
  return list.map((e) => e.trim().toLowerCase()).filter(Boolean);
}

/**
 * Low-level send. Safe no-op when RESEND_API_KEY is missing (ok:false, skipped).
 * Server-only — never import from client components.
 */
export async function sendEmail(
  input: SendEmailInput,
): Promise<EmailSendResult> {
  const config = getEmailConfig();
  const to = normalizeTo(input.to);

  if (to.length === 0) {
    return { ok: false, error: "No recipients", templateId: input.templateId };
  }

  if (!config.configured) {
    console.warn("[email] RESEND_API_KEY unset — skip send", {
      to,
      subject: input.subject,
      templateId: input.templateId,
    });
    return {
      ok: false,
      error: "Email not configured (RESEND_API_KEY)",
      skipped: true,
      templateId: input.templateId,
    };
  }

  const resend = getResendClient();
  if (!resend) {
    return {
      ok: false,
      error: "Email client unavailable",
      skipped: true,
      templateId: input.templateId,
    };
  }

  const { data, error } = await resend.emails.send(
    {
      from: config.from,
      to,
      subject: input.subject,
      html: input.html,
      text: input.text,
      replyTo: input.replyTo ?? config.replyTo,
      tags: input.tags,
    },
    input.idempotencyKey
      ? { idempotencyKey: input.idempotencyKey.slice(0, 256) }
      : undefined,
  );

  if (error) {
    console.error("[email] send failed", error);
    return {
      ok: false,
      error: error.message || "Resend error",
      templateId: input.templateId,
    };
  }

  return {
    ok: true,
    id: data?.id ?? "unknown",
    templateId: input.templateId,
  };
}

/**
 * Send a catalog template. Respects EMAIL_CATALOG.enabled unless force=true.
 * Use force only for manual tests / ops.
 */
export async function sendTemplateEmail<T extends EmailTemplateId>(params: {
  templateId: T;
  to: SendEmailInput["to"];
  props: TemplatePropsMap[T];
  /** Bypass catalog enabled flag (dev / ops only). */
  force?: boolean;
  idempotencyKey?: string;
}): Promise<EmailSendResult> {
  const { templateId, to, props, force, idempotencyKey } = params;

  if (!force && !isTemplateEnabled(templateId)) {
    return {
      ok: false,
      error: `Template "${templateId}" is disabled in EMAIL_CATALOG (funnel not live yet)`,
      skipped: true,
      templateId,
    };
  }

  const rendered = renderTemplate(templateId, props);
  return sendEmail({
    to,
    subject: rendered.subject,
    html: rendered.html,
    text: rendered.text,
    templateId,
    idempotencyKey,
    tags: [
      { name: "template", value: templateId },
      { name: "product", value: "vesperer" },
    ],
  });
}
