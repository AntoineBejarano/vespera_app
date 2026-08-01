import { Resend } from "resend";
import { getEmailConfig } from "@/lib/email/config";

let cached: Resend | null = null;

/** Lazy Resend client. Returns null when RESEND_API_KEY is unset. */
export function getResendClient(): Resend | null {
  const { apiKey, configured } = getEmailConfig();
  if (!configured) return null;
  if (!cached) {
    cached = new Resend(apiKey);
  }
  return cached;
}

export function isEmailConfigured() {
  return getEmailConfig().configured;
}
