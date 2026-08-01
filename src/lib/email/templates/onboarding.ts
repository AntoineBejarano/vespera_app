import { getEmailConfig } from "@/lib/email/config";
import { ctaButton, escapeHtml, renderEmailLayout } from "@/lib/email/templates/layout";

export function renderOnboardingDay1Email(props: { name?: string | null } = {}) {
  const { siteName, siteUrl } = getEmailConfig();
  const name = props.name?.trim() || "there";
  const subject = `Your first ${siteName} persona takes 2 minutes`;
  const text = `Hi ${name},\n\nStill exploring? Create a persona with soul, style, rules, and context — then chat with memory that sticks.\n\n${siteUrl}/personas/new\n`;
  const html = renderEmailLayout({
    title: "One persona. Real continuity.",
    preheader: "Create your first character today.",
    bodyHtml: `
      <p style="margin:0 0 14px;">Hi ${escapeHtml(name)} — a quick nudge. The magic of ${escapeHtml(siteName)} starts when a persona has identity layers and someone to remember.</p>
      ${ctaButton(`${siteUrl}/personas/new`, "Create a persona")}
    `,
  });
  return { subject, html, text };
}

export function renderOnboardingDay3Email(props: { name?: string | null } = {}) {
  const { siteName, siteUrl } = getEmailConfig();
  const name = props.name?.trim() || "there";
  const subject = `Bring a character, or build one`;
  const text = `Hi ${name},\n\nImport a Character Card or vibecode from Claude.\n\nBring: ${siteUrl}/bring\nClaude: ${siteUrl}/integrations/claude\n`;
  const html = renderEmailLayout({
    title: "Two ways to start",
    preheader: `Import a card or vibecode with Claude.`,
    bodyHtml: `
      <p style="margin:0 0 14px;">Hi ${escapeHtml(name)}. If a blank page feels heavy, import a card you already own — or let Claude write the layers for you.</p>
      ${ctaButton(`${siteUrl}/bring`, "Bring a character")}
      <p style="margin:16px 0 0;font-size:13px;">
        Or open
        <a href="${escapeHtml(`${siteUrl}/integrations/claude`)}" style="color:#5badee;">Claude · vibecode</a>
        · ${escapeHtml(siteName)}
      </p>
    `,
  });
  return { subject, html, text };
}
