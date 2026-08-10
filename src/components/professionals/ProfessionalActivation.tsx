"use client";

import Image from "next/image";
import Link from "next/link";
import { AlertCircle, LoaderCircle, Trash2, X } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { UpgradePrompt } from "@/components/billing/UpgradePrompt";
import type { PaywallPayload } from "@/lib/billing/paywall";
import { STUDIO_TRIAL_DAYS } from "@/lib/billing/trial";

type WorkspacePersona = {
  id: string;
  name: string;
  active: boolean;
};

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
  const searchParams = useSearchParams();
  const billingResult = searchParams.get("billing");
  const started = useRef(false);
  const billingSynced = useRef(false);
  const [error, setError] = useState<string | null>(null);
  const [paywall, setPaywall] = useState<PaywallPayload | null>(null);
  const [personas, setPersonas] = useState<WorkspacePersona[]>([]);
  const [loadingPersonas, setLoadingPersonas] = useState(false);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const activate = useCallback(async () => {
    try {
      setError(null);
      if (billingResult === "success" && !billingSynced.current) {
        billingSynced.current = true;
        const sync = await fetch("/api/billing/sync", { method: "POST" });
        if (!sync.ok) {
          throw new Error(
            "Your checkout completed, but the account is still syncing. Reload this page in a moment.",
          );
        }
      }
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
        if (data?.reason === "persona_limit") setLoadingPersonas(true);
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
  }, [billingResult, name, slug]);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    void activate();
  }, [activate]);

  useEffect(() => {
    if (paywall?.reason !== "persona_limit") return;
    let cancelled = false;
    fetch("/api/characters")
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error ?? "Could not load personas");
        if (!cancelled) setPersonas(data.characters ?? []);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Could not load personas",
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingPersonas(false);
      });
    return () => {
      cancelled = true;
    };
  }, [paywall?.reason]);

  async function removePersona(persona: WorkspacePersona) {
    setDeletingId(persona.id);
    setError(null);
    try {
      const res = await fetch(`/api/characters/${persona.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error ?? `Could not remove ${persona.name}`);
      }
      setPersonas((current) => current.filter((item) => item.id !== persona.id));
      setConfirmingId(null);
      setPaywall(null);
      await activate();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not remove persona");
    } finally {
      setDeletingId(null);
    }
  }

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
              trialDays={STUDIO_TRIAL_DAYS}
              returnTo={`/professionals/activate/${slug}`}
            />

            <div className="mt-5 border-y border-[var(--line)] py-5">
              <h2 className="text-sm font-semibold text-[var(--ink)]">
                Free your Starter slot
              </h2>
              <p className="mt-1 text-xs leading-5 text-[var(--muted)]">
                Remove one existing persona and {name} will be added
                immediately. The removed persona is archived.
              </p>

              {loadingPersonas ? (
                <p className="mt-4 flex items-center gap-2 text-xs text-[var(--muted)]">
                  <LoaderCircle className="size-3.5 animate-spin" /> Loading
                  workspace…
                </p>
              ) : (
                <ul className="mt-4 space-y-2">
                  {personas.map((persona) => {
                    const confirming = confirmingId === persona.id;
                    return (
                      <li
                        key={persona.id}
                        className="border border-[var(--line)] bg-[var(--bg-elevated)] px-3 py-3"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-[var(--ink)]">
                              {persona.name}
                            </p>
                            <p className="mt-0.5 text-xs text-[var(--muted)]">
                              {persona.active
                                ? "Currently active"
                                : "In workspace"}
                            </p>
                          </div>
                          {!confirming ? (
                            <button
                              type="button"
                              onClick={() => setConfirmingId(persona.id)}
                              className="inline-flex shrink-0 items-center gap-1.5 text-xs font-medium text-[var(--danger)]"
                            >
                              <Trash2 className="size-3.5" /> Remove
                            </button>
                          ) : null}
                        </div>

                        {confirming ? (
                          <div className="mt-3 flex flex-wrap items-center justify-end gap-2 border-t border-[var(--line)] pt-3">
                            <button
                              type="button"
                              onClick={() => setConfirmingId(null)}
                              disabled={deletingId === persona.id}
                              className="inline-flex items-center gap-1.5 px-2 py-1 text-xs text-[var(--muted)]"
                            >
                              <X className="size-3.5" /> Cancel
                            </button>
                            <button
                              type="button"
                              onClick={() => void removePersona(persona)}
                              disabled={deletingId === persona.id}
                              className="inline-flex items-center gap-1.5 bg-[var(--danger)] px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50"
                            >
                              {deletingId === persona.id ? (
                                <LoaderCircle className="size-3.5 animate-spin" />
                              ) : (
                                <Trash2 className="size-3.5" />
                              )}
                              Remove and continue
                            </button>
                          </div>
                        ) : null}
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
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
