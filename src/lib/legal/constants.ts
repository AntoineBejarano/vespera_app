/** Bump when legal text materially changes — invalidates adult cookie + re-attest. */
export const LEGAL_VERSION = "2026-08-01";

export const ADULT_COOKIE = "vesperer_adult";

/** Cookie value = legal version accepted */
export const ADULT_COOKIE_MAX_AGE_SEC = 60 * 60 * 24 * 365; // 1 year

/**
 * Operator details — sourced from UK Companies House (company 16506991).
 * @see https://find-and-update.company-information.service.gov.uk/company/16506991
 */
export const LEGAL_OPERATOR = {
  brand: "vesperer.com",
  productName: "vesperer",
  companyName: "Deevly Labs LTD",
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
  contactEmail:
    process.env.LEGAL_CONTACT_EMAIL?.trim() || "legal@vesperer.com",
  /** Abuse / safety reports */
  abuseEmail:
    process.env.ABUSE_EMAIL?.trim() ||
    process.env.LEGAL_CONTACT_EMAIL?.trim() ||
    "legal@vesperer.com",
};

export type LegalSlug =
  | "terms"
  | "privacy"
  | "acceptable-use"
  | "adult-content";

export const LEGAL_PAGES: {
  slug: LegalSlug;
  title: string;
  description: string;
}[] = [
  {
    slug: "terms",
    title: "Terms of Service",
    description: "Rules for using vesperer.com",
  },
  {
    slug: "privacy",
    title: "Privacy Policy",
    description: "How we handle personal data",
  },
  {
    slug: "acceptable-use",
    title: "Acceptable Use Policy",
    description: "Prohibited uses and content",
  },
  {
    slug: "adult-content",
    title: "Adult Content Notice",
    description: "18+ access and minor protection",
  },
];
