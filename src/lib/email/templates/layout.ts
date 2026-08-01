import { getEmailConfig } from "@/lib/email/config";

export function renderEmailLayout(params: {
  preheader?: string;
  title: string;
  bodyHtml: string;
}) {
  const { siteName, siteUrl, legalEmail } = getEmailConfig();
  const preheader = params.preheader
    ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0">${escapeHtml(params.preheader)}</div>`
    : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(params.title)}</title>
</head>
<body style="margin:0;padding:0;background:#0b1020;color:#e8eef8;font-family:Georgia,'Times New Roman',serif;">
  ${preheader}
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0b1020;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width:560px;background:#12182b;border:1px solid #24304a;border-radius:16px;overflow:hidden;">
          <tr>
            <td style="padding:28px 28px 8px;font-size:12px;letter-spacing:0.22em;text-transform:uppercase;color:#5badee;">
              ${escapeHtml(siteName)}
            </td>
          </tr>
          <tr>
            <td style="padding:8px 28px 0;font-size:28px;line-height:1.2;color:#f4f7fc;">
              ${escapeHtml(params.title)}
            </td>
          </tr>
          <tr>
            <td style="padding:20px 28px 28px;font-size:16px;line-height:1.6;color:#b7c3d9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
              ${params.bodyHtml}
            </td>
          </tr>
          <tr>
            <td style="padding:0 28px 28px;font-size:12px;line-height:1.5;color:#6b7a94;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
              <a href="${escapeHtml(siteUrl)}" style="color:#5badee;text-decoration:none;">${escapeHtml(siteUrl.replace(/^https?:\/\//, ""))}</a>
              · <a href="mailto:${escapeHtml(legalEmail)}" style="color:#6b7a94;text-decoration:none;">${escapeHtml(legalEmail)}</a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function ctaButton(href: string, label: string) {
  return `<p style="margin:28px 0 8px;">
  <a href="${escapeHtml(href)}" style="display:inline-block;background:#5badee;color:#071018;text-decoration:none;padding:12px 18px;border-radius:10px;font-weight:600;font-size:14px;">
    ${escapeHtml(label)}
  </a>
</p>`;
}
