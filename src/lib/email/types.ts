/** Stable IDs for product emails — wire these into the user funnel later. */
export type EmailTemplateId =
  | "welcome"
  | "onboarding_day_1"
  | "onboarding_day_3"
  | "persona_created"
  | "api_key_created"
  | "weekly_digest"
  | "reengagement";

export type EmailSendResult =
  | { ok: true; id: string; templateId?: EmailTemplateId }
  | { ok: false; error: string; skipped?: boolean; templateId?: EmailTemplateId };

export type EmailAddress = string | string[];

export type SendEmailInput = {
  to: EmailAddress;
  subject: string;
  html: string;
  text?: string;
  replyTo?: string | string[];
  /** Prevents duplicate sends for 24h when provided. */
  idempotencyKey?: string;
  /** Optional tags for Resend analytics / filtering. */
  tags?: Array<{ name: string; value: string }>;
  templateId?: EmailTemplateId;
};
