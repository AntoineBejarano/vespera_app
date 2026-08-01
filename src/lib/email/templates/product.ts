import { getEmailConfig } from "@/lib/email/config";
import { ctaButton, escapeHtml, renderEmailLayout } from "@/lib/email/templates/layout";

export function renderPersonaCreatedEmail(props: {
  name?: string | null;
  personaName: string;
  personaId: string;
}) {
  const { siteUrl } = getEmailConfig();
  const name = props.name?.trim() || "there";
  const subject = `${props.personaName} is ready`;
  const text = `Hi ${name},\n\n${props.personaName} is live. Open: ${siteUrl}/personas/${props.personaId}\n`;
  const html = renderEmailLayout({
    title: `${props.personaName} is ready`,
    preheader: "Your persona is provisioned.",
    bodyHtml: `
      <p style="margin:0 0 14px;">Hi ${escapeHtml(name)}. <strong style="color:#f4f7fc;">${escapeHtml(props.personaName)}</strong> has identity layers and a chat key. Connect Telegram, attach knowledge, or share the public link when you publish.</p>
      ${ctaButton(`${siteUrl}/personas/${props.personaId}`, "Open persona")}
    `,
  });
  return { subject, html, text };
}

export function renderApiKeyCreatedEmail(props: {
  name?: string | null;
  keyPrefix: string;
}) {
  const { siteUrl } = getEmailConfig();
  const name = props.name?.trim() || "there";
  const subject = "Your Vesperer API key was created";
  const text = `Hi ${name},\n\nA new account API key (${props.keyPrefix}…) was created. If this wasn't you, revoke it in Settings.\n${siteUrl}/settings\n`;
  const html = renderEmailLayout({
    title: "API key created",
    preheader: "A new vsk_ key was added to your account.",
    bodyHtml: `
      <p style="margin:0 0 14px;">Hi ${escapeHtml(name)}. We created an account key starting with <code style="color:#f4f7fc;">${escapeHtml(props.keyPrefix)}</code>. Use it from Claude, Cursor, or the CLI — never commit it to git.</p>
      ${ctaButton(`${siteUrl}/settings`, "Manage API keys")}
      <p style="margin:16px 0 0;font-size:13px;color:#6b7a94;">If this wasn't you, revoke the key immediately.</p>
    `,
  });
  return { subject, html, text };
}

export function renderWeeklyDigestEmail(props: {
  name?: string | null;
  personaCount: number;
  messageCount?: number;
}) {
  const { siteName, siteUrl } = getEmailConfig();
  const name = props.name?.trim() || "there";
  const subject = `Your week on ${siteName}`;
  const text = `Hi ${name},\n\nPersonas: ${props.personaCount}. Messages: ${props.messageCount ?? "—"}.\n${siteUrl}/personas\n`;
  const html = renderEmailLayout({
    title: "Your week",
    preheader: "A quick pulse on your personas.",
    bodyHtml: `
      <p style="margin:0 0 14px;">Hi ${escapeHtml(name)}. You have <strong style="color:#f4f7fc;">${props.personaCount}</strong> persona${props.personaCount === 1 ? "" : "s"}${props.messageCount != null ? ` and ~${props.messageCount} messages this week` : ""}.</p>
      ${ctaButton(`${siteUrl}/personas`, "Open studio")}
    `,
  });
  return { subject, html, text };
}

export function renderReengagementEmail(props: { name?: string | null } = {}) {
  const { siteName, siteUrl } = getEmailConfig();
  const name = props.name?.trim() || "there";
  const subject = `Your personas are still here`;
  const text = `Hi ${name},\n\nCome back to ${siteName} — memory and identity are waiting.\n${siteUrl}/personas\n`;
  const html = renderEmailLayout({
    title: "Still remembering you",
    preheader: "Pick up where you left off.",
    bodyHtml: `
      <p style="margin:0 0 14px;">Hi ${escapeHtml(name)}. Your characters didn't forget — continuity is the point. Jump back in when you're ready.</p>
      ${ctaButton(`${siteUrl}/personas`, `Return to ${siteName}`)}
    `,
  });
  return { subject, html, text };
}
