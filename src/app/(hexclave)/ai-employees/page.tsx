import type { Metadata } from "next";
import { SeoHubPage, type SeoHubLink } from "@/components/seo/SeoHubPage";
import { listByVerb, seoPath } from "@/lib/seo/catalog";
import { breadcrumbJsonLd } from "@/lib/seo/breadcrumbs";
import { SITE_NAME, SITE_URL } from "@/lib/site";

const title = `AI Employees with Customer Memory | ${SITE_NAME}`;
const description =
  "AI employees for reception, sales, customer support, booking, concierge and business workflows that remember returning customers.";
const path = "/ai-employees";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: `${SITE_URL}${path}` },
  openGraph: { title, description, url: `${SITE_URL}${path}`, type: "website" },
};

const links: SeoHubLink[] = [
  {
    href: "/hire/ai-receptionist",
    label: "AI receptionist",
    description: "Front-desk continuity for returning customers.",
  },
  {
    href: "/hire/ai-customer-support",
    label: "AI customer support",
    description: "Support that remembers prior issues and preferences.",
  },
  {
    href: "/business",
    label: "Business platform",
    description: "Operate persistent AI identities at company scale.",
  },
];

export default function AiEmployeesHubPage() {
  const pages = listByVerb("hire");
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        name: title,
        description,
        url: `${SITE_URL}${path}`,
      },
      {
        "@type": "ItemList",
        itemListElement: pages.map((page, index) => ({
          "@type": "ListItem",
          position: index + 1,
          url: `${SITE_URL}${seoPath(page.verb, page.slug)}`,
          name: page.name,
        })),
      },
      breadcrumbJsonLd([
        { name: "Home", path: "/" },
        { name: "AI employees", path },
      ]),
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <SeoHubPage
        eyebrow="AI employees"
        title="AI employees that remember returning customers"
        description={description}
        intro="The hire cluster targets business outcomes, not generic character creation. Each page keeps its commercial intent while this hub explains the shared memory and persistent-identity architecture."
        links={links}
        pages={pages}
        footerLinks={[
          { href: "/business", label: "Business", description: "" },
          { href: "/business/agencies", label: "For agencies", description: "" },
          { href: "/explore?filter=hire", label: "All hire paths", description: "" },
        ]}
      />
    </>
  );
}
