/** Bump when legal text materially changes — invalidates access cookie + re-attest. */
export const LEGAL_VERSION = "2026-08-02e";

export const ADULT_COOKIE = "vesperer_adult";

/** Set alongside the access cookie when the adult (After Dark) gate was completed. */
export const ADULT_CONSENT_COOKIE = "vesperer_adult_ok";

/** Cookie value = legal version accepted */
export const ADULT_COOKIE_MAX_AGE_SEC = 60 * 60 * 24 * 365; // 1 year

/**
 * Legal operator = Deevly Labs LTD (company). Vesperer is a product, not the company.
 * Companies House: 16506991.
 * @see https://find-and-update.company-information.service.gov.uk/company/16506991
 * @see https://deevlylabs.com
 */
export const LEGAL_OPERATOR = {
  /** Product brand / consumer-facing name */
  brand: "Vesperer",
  /** Product marketing host (not the company site) */
  productHost: "vesperer.com",
  productName: "Vesperer",
  /** Legal entity that operates the product */
  companyName: "Deevly Labs LTD",
  companyWebsite:
    process.env.LEGAL_COMPANY_WEBSITE?.trim() || "https://deevlylabs.com",
  companyNumber: "16506991",
  registeredAddress:
    process.env.LEGAL_REGISTERED_ADDRESS?.trim() ||
    "128 City Road, London, United Kingdom, EC1V 2NX",
  jurisdiction:
    process.env.LEGAL_JURISDICTION?.trim() ||
    "England and Wales, United Kingdom",
  governingLaw:
    process.env.LEGAL_GOVERNING_LAW?.trim() || "England and Wales",
  incorporatedOn: "10 June 2025",
  companiesHouseUrl:
    "https://find-and-update.company-information.service.gov.uk/company/16506991",
  /** Product legal inbox — Resend receiving on mail.vesperer.com */
  contactEmail:
    process.env.LEGAL_CONTACT_EMAIL?.trim() || "legal@mail.vesperer.com",
  /** After Dark / B2B partner applications */
  partnersEmail:
    process.env.PARTNERS_EMAIL?.trim() || "partners@vesperer.com",
  /** Abuse / safety reports for the Vesperer product */
  abuseEmail:
    process.env.ABUSE_EMAIL?.trim() ||
    process.env.LEGAL_CONTACT_EMAIL?.trim() ||
    "abuse@mail.vesperer.com",
};

export type LegalSlug =
  | "terms"
  | "privacy"
  | "acceptable-use"
  | "adult-content"
  | "billing"
  | "refunds";

export const LEGAL_PAGES: {
  slug: LegalSlug;
  title: string;
  description: string;
}[] = [
  {
    slug: "terms",
    title: "Terms of Service",
    description:
      "Terms of Service for Vesperer — AI character platform eligibility, acceptable use, AI transparency, operator responsibilities, and creator ownership.",
  },
  {
    slug: "privacy",
    title: "Privacy Policy",
    description:
      "Vesperer Privacy Policy — how we process account data, chat memory, age attestation, cookies, and EU AI Act automated-interaction disclosures.",
  },
  {
    slug: "acceptable-use",
    title: "Acceptable Use Policy",
    description:
      "Vesperer Acceptable Use Policy — prohibited content, minor safety, exploitation, abuse reporting, and platform enforcement rules.",
  },
  {
    slug: "adult-content",
    title: "Adult Content Notice",
    description:
      "Vesperer After Dark Adult Content Notice — 18+ access rules, creator responsibilities, and zero tolerance for content involving minors.",
  },
  {
    slug: "billing",
    title: "Billing Terms",
    description:
      "Vesperer Billing Terms — SFW subscription plans billed via Stripe on vesperer.com; After Dark uses a separate adult payment rail.",
  },
  {
    slug: "refunds",
    title: "Refunds & Cancellation",
    description:
      "Vesperer refund and cancellation policy for paid apex subscriptions, cooling-off where applicable, and how to manage billing.",
  },
];