/**
 * Vesperer email module (Resend).
 *
 * Setup:
 * - RESEND_API_KEY in env (Railway / .env)
 * - EMAIL_FROM once vesperer.com is verified in Resend
 * - Flip EMAIL_CATALOG[*].enabled when funnel steps go live
 *
 * Usage (server-only):
 *   import { sendTemplateEmail, sendEmail } from "@/lib/email";
 *   await sendTemplateEmail({ templateId: "welcome", to, props: { name }, force: true });
 */

export { getResendClient, isEmailConfigured } from "@/lib/email/client";
export {
  EMAIL_CATALOG,
  getEmailConfig,
  isTemplateEnabled,
} from "@/lib/email/config";
export { sendEmail, sendTemplateEmail } from "@/lib/email/send";
export { renderTemplate } from "@/lib/email/templates";
export type {
  EmailAddress,
  EmailSendResult,
  EmailTemplateId,
  SendEmailInput,
} from "@/lib/email/types";
export type { TemplatePropsMap } from "@/lib/email/templates";
