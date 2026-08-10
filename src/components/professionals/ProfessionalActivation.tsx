"use client";

import Image from "next/image";
import Link from "next/link";
import { AlertCircle, LoaderCircle } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { UpgradePrompt } from "@/components/billing/UpgradePrompt";
import type { PaywallPayload } from "@/lib/billing/paywall";

export function ProfessionalActivation({
  slug,
  name,
  tagline,
  imageUrl,
}: {
  slug: string;
  name: string;
  tagline: string;
  imageUrl: string;
}) {
  const started = useRef(false);
  const [error, setError] = useState<string | null>(null);
  const [paywall, setPaywall] = useState<PaywallPayload | null>(null);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    async function activate() {
      try {
        const res = await fetch("/api/characters/fork", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ showcaseSlug: slug }),
        });
        const data = await res.json();

        if (
          res.status === 401 ||
          (res.status === 403 && data?.error?.includes("Age verification"))
        ) {
          const next = `/professionals/activate/${slug}`;
          window.location.replace(
            `/auth/continue?next=${encodeURIComponent(next)}`,
          );
          return;
        }
        if (data?.error === "PAYWALL_REQUIRED") {
          setPaywall(data as PaywallPayload);
          return;
        }
        if (!res.ok || !data?.character?.id) {
          throw new Error(data?.error ?? `Could not add ${name}`);
        }

        window.location.replace(
          `/professionals/session?characterId=${data.character.id}`,
        );
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
      }
    }

    void activate();
  }, [name, slug]);

  return (
    <main className="professionals-theme grid min-h-screen place-items-center bg-[var(--bg)] px-4 py-12 text-[var(--ink)]">
      <div className="w-full max-w-md text-center">
        <div className="relative mx-auto size-24 overflow-hidden rounded-lg border border-[var(--line)] bg-[var(--bg-elevated)]">
          <Image
            src={imageUrl}
            alt={name}
            fill
            priority
            sizes="96px"
            className="object-cover object-top"
          />
        </div>
        <p className="mt-6 text-[11px] font-medium uppercase text-[var(--accent)]">
          Vesperer Professionals
        </p>
        <h1 className="mt-2 font-[family-name:var(--font-display)] text-3xl font-semibold">
          Preparing {name}
        </h1>
        <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-[var(--muted)]">
          {tagline}
        </p>

        {!error && !paywall ? (
          <div className="mt-8 flex items-center justify-center gap-2 text-sm text-[var(--muted)]">
            <LoaderCircle className="size-4 animate-spin text-[var(--accent)]" />
            Adding to your workspace…
          </div>
        ) : null}

        {paywall ? (
          <div className="mt-8 text-left">
            <UpgradePrompt
              paywall={paywall}
              source="professional_activation"
            />
          </div>
        ) : null}

        {error ? (
          <div className="mt-8 border-y border-[var(--line)] py-5">
            <p className="flex items-center justify-center gap-2 text-sm text-[var(--danger)]">
              <AlertCircle className="size-4" /> {error}
            </p>
            <Link
              href={`/c/${slug}`}
              className="mt-4 inline-flex text-sm text-[var(--accent)] hover:underline"
            >
              Return to {name}
            </Link>
          </div>
        ) : null}
      </div>
    </main>
  );
}
