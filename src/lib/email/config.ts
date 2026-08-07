import { SITE_NAME, SITE_URL } from "@/lib/site";
import { LEGAL_OPERATOR } from "@/lib/legal/constants";
import type { EmailTemplateId } from "@/lib/email/types";

/**
 * Product email configuration.
 * Until vesperer.com is verified in Resend, default From uses Resend's sandbox.
 * Set EMAIL_FROM once the domain is verified (e.g. "Vesperer <noreply@vesperer.com>").
 */
export function getEmailConfig() {
  const apiKey = process.env.RESEND_API_KEY?.trim() ?? "";
  const from =
    process.env.EMAIL_FROM?.trim() ||
    `${SITE_NAME} <onboarding@resend.dev>`;
  const replyTo =
    process.env.EMAIL_REPLY_TO?.trim() || LEGAL_OPERATOR.contactEmail;

  return {
    apiKey,
    configured: Boolean(apiKey),
    from,
    replyTo,
    siteName: SITE_NAME,
    siteUrl: SITE_URL,
    legalEmail: LEGAL_OPERATOR.contactEmail,
  };
}

/**
 * Catalog of automated emails for the future user funnel.
 * Flip `enabled` when each step of the funnel goes live.
 * Nothing here sends by itself — callers must invoke sendTemplateEmail.
 */
export const EMAIL_CATALOG: Record<
  EmailTemplateId,
  {
    id: EmailTemplateId;
    /** Human label for ops / future admin UI */
    label: string;
    /** When this should fire (documentation for the funnel) */
    trigger: string;
    enabled: boolean;
  }
> = {
  welcome: {
    id: "welcome",
    label: "Welcome",
    trigger: "After signup + age gate complete",
    enabled: false,
  },
  onboarding_day_1: {
    id: "onboarding_day_1",
    label: "Onboarding day 1",
    trigger: "24h after signup if no persona created",
    enabled: false,
  },
  onboarding_day_3: {
    id: "onboarding_day_3",
    label: "Onboarding day 3",
    trigger: "72h after signup if still inactive",
    enabled: false,
  },
  persona_created: {
    id: "persona_created",
    label: "Persona created",
    trigger: "First persona provisioned (UI or CLI)",
    enabled: false,
  },
  api_key_created: {
    id: "api_key_created",
    label: "API key created",
    trigger: "User creates a vsk_ account key",
    enabled: false,
  },
  weekly_digest: {
    id: "weekly_digest",
    label: "Weekly digest",
    trigger: "Weekly cron for active creators",
    enabled: false,
  },
  reengagement: {
    id: "reengagement",
    label: "Re-engagement",
    trigger: "N days without login / chat",
    enabled: false,
  },
};

export function isTemplateEnabled(id: EmailTemplateId) {
  const globalEnabled = process.env.EMAIL_FUNNEL_ENABLED === "true";
  const envKey = `EMAIL_TEMPLATE_${id.toUpperCase()}_ENABLED`;
  const templateEnabled = process.env[envKey] === "true";
  return EMAIL_CATALOG[id]?.enabled === true || globalEnabled || templateEnabled;
}
