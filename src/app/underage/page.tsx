import Link from "next/link";
import { BrandLogo } from "@/components/BrandLogo";

export const metadata = {
  title: "Access denied — vesperer.com",
  robots: { index: false, follow: false },
};

export default function UnderagePage() {
  return (
    <main className="safe-pad mx-auto flex min-h-dvh max-w-lg flex-col justify-center px-4 py-10 sm:px-6">
      <BrandLogo href="/underage" size="sm" className="mb-8 pointer-events-none" />
      <h1 className="font-[family-name:var(--font-display)] text-3xl font-semibold text-[var(--ink)]">
        Access denied
      </h1>
      <p className="mt-4 leading-relaxed text-[var(--muted)]">
        vesperer.com is restricted to adults 18 years or older. We cannot grant
        access if you are under 18.
      </p>
      <p className="mt-4 leading-relaxed text-[var(--muted)]">
        Please leave this site. If you reached this page by mistake, return only
        when you meet the age requirement.
      </p>
      <Link
        href="https://www.google.com"
        className="mt-8 inline-flex w-fit rounded-xl border border-[var(--line)] px-5 py-3 text-sm text-[var(--ink)] hover:border-[var(--accent)]"
      >
        Leave site
      </Link>
    </main>
  );
}
