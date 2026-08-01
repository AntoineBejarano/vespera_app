import { getEmailConfig } from "@/lib/email/config";
import { ctaButton, escapeHtml, renderEmailLayout } from "@/lib/email/templates/layout";

export type WelcomeEmailProps = {
  name?: string | null;
};

export function renderWelcomeEmail(props: WelcomeEmailProps = {}) {
  const { siteName, siteUrl } = getEmailConfig();
  const name = props.name?.trim() || "there";

  const subject = `Welcome to ${siteName}`;
  const text = [
    `Hi ${name},`,
    "",
    `Welcome to ${siteName} — AI personas with memory that lasts.`,
    "",
    `Create your first persona: ${siteUrl}/personas/new`,
    `Or vibecode with Claude: ${siteUrl}/integrations/claude`,
    "",
    `— ${siteName}`,
  ].join("\n");

  const html = renderEmailLayout({
    title: `Welcome, ${name}`,
    preheader: `Your ${siteName} account is ready.`,
    bodyHtml: `
      <p style="margin:0 0 14px;">Thanks for joining. You can build personas with persistent identity, memory, and channels — web, Telegram, voice, and API.</p>
      <p style="margin:0 0 14px;">Start with a persona in the dashboard, or provision one from Claude / Cursor with an account API key.</p>
      ${ctaButton(`${siteUrl}/personas/new`, "Create your first persona")}
      <p style="margin:16px 0 0;font-size:13px;">
        Agent guide:
        <a href="${escapeHtml(`${siteUrl}/integrations/claude`)}" style="color:#5badee;">${escapeHtml(`${siteUrl.replace(/^https?:\/\//, "")}/integrations/claude`)}</a>
      </p>
    `,
  });

  return { subject, html, text };
}
