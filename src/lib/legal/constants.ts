/** Bump when legal text materially changes — invalidates adult cookie + re-attest. */
export const LEGAL_VERSION = "2026-07-30";

export const ADULT_COOKIE = "vesperer_adult";

/** Cookie value = legal version accepted */
export const ADULT_COOKIE_MAX_AGE_SEC = 60 * 60 * 24 * 365; // 1 year

export const LEGAL_OPERATOR = {
  brand: "vesperer.com",
  productName: "vesperer",
  contactEmail: "legal@vesperer.com",
  /** Replace with counsel-approved entity details before relying on these texts in court. */
  companyPlaceholder: "[LEGAL_COMPANY_NAME]",
  jurisdictionPlaceholder: "[LEGAL_JURISDICTION]",
  addressPlaceholder: "[REGISTERED_ADDRESS]",
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
