import type { EmailTemplateId } from "@/lib/email/types";
import {
  renderOnboardingDay1Email,
  renderOnboardingDay3Email,
} from "@/lib/email/templates/onboarding";
import {
  renderApiKeyCreatedEmail,
  renderPersonaCreatedEmail,
  renderReengagementEmail,
  renderWeeklyDigestEmail,
} from "@/lib/email/templates/product";
import { renderWelcomeEmail } from "@/lib/email/templates/welcome";

export type TemplatePropsMap = {
  welcome: Parameters<typeof renderWelcomeEmail>[0];
  onboarding_day_1: Parameters<typeof renderOnboardingDay1Email>[0];
  onboarding_day_3: Parameters<typeof renderOnboardingDay3Email>[0];
  persona_created: Parameters<typeof renderPersonaCreatedEmail>[0];
  api_key_created: Parameters<typeof renderApiKeyCreatedEmail>[0];
  weekly_digest: Parameters<typeof renderWeeklyDigestEmail>[0];
  reengagement: Parameters<typeof renderReengagementEmail>[0];
};

export function renderTemplate<T extends EmailTemplateId>(
  id: T,
  props: TemplatePropsMap[T],
): { subject: string; html: string; text: string } {
  switch (id) {
    case "welcome":
      return renderWelcomeEmail(props as TemplatePropsMap["welcome"]);
    case "onboarding_day_1":
      return renderOnboardingDay1Email(
        props as TemplatePropsMap["onboarding_day_1"],
      );
    case "onboarding_day_3":
      return renderOnboardingDay3Email(
        props as TemplatePropsMap["onboarding_day_3"],
      );
    case "persona_created":
      return renderPersonaCreatedEmail(
        props as TemplatePropsMap["persona_created"],
      );
    case "api_key_created":
      return renderApiKeyCreatedEmail(
        props as TemplatePropsMap["api_key_created"],
      );
    case "weekly_digest":
      return renderWeeklyDigestEmail(
        props as TemplatePropsMap["weekly_digest"],
      );
    case "reengagement":
      return renderReengagementEmail(
        props as TemplatePropsMap["reengagement"],
      );
    default: {
      const _exhaustive: never = id;
      throw new Error(`Unknown email template: ${_exhaustive}`);
    }
  }
}

export {
  renderWelcomeEmail,
  renderOnboardingDay1Email,
  renderOnboardingDay3Email,
  renderPersonaCreatedEmail,
  renderApiKeyCreatedEmail,
  renderWeeklyDigestEmail,
  renderReengagementEmail,
};
