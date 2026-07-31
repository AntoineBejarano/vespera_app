"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { useHexclaveApp, useUser } from "@hexclave/next";
import { BrandMark } from "@/components/BrandLogo";
import { LEGAL_VERSION } from "@/lib/legal/constants";
import { PageSpinner } from "@/components/Spinner";

function AgeGateInner() {
  const router = useRouter();
  const search = useSearchParams();
  const app = useHexclaveApp();
  const user = useUser({ or: "return-null" });
  const [ageOk, setAgeOk] = useState(false);
  const [adultOk, setAdultOk] = useState(false);
  const [tosOk, setTosOk] = useState(false);
  const [privacyOk, setPrivacyOk] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const nextPath = safeNext(search.get("next"));
  const intent = search.get("intent"); // signup | signin | enter
  const ready = ageOk && adultOk && tosOk && privacyOk;

  async function continueFlow() {
    if (!ready) return;
    setLoading(true);
    setError(null);

    try {
      const attest = await fetch("/api/legal/adult-attest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ageConfirmed: true,
          adultConsent: true,
          tosAccepted: true,
          privacyAccepted: true,
          legalVersion: LEGAL_VERSION,
        }),
      });
      const attestData = await attest.json();
      if (!attest.ok) throw new Error(attestData.error ?? "Attestation failed");

      if (user) {
        const res = await fetch("/api/user/age-verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ageConfirmed: true,
            adultConsent: true,
            tosAccepted: true,
            privacyAccepted: true,
            legalVersion: LEGAL_VERSION,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Failed");
        router.replace(nextPath || "/personas");
        router.refresh();
        return;
      }

      if (intent === "signup") {
        void app.redirectToSignUp();
        return;
      }
      if (intent === "signin") {
        void app.redirectToSignIn();
        return;
      }

      router.replace(nextPath || "/");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
      setLoading(false);
    }
  }

  return (
    <main className="safe-pad mx-auto flex min-h-dvh max-w-lg flex-col justify-center px-4 py-10 sm:px-6">
      <div className="mb-8 flex items-center gap-3">
        <BrandMark size={40} priority />
        <div>
          <p className="font-[family-name:var(--font-display)] text-lg font-semibold">
            Vesper<span className="text-[var(--accent)]">er</span>
          </p>
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
            Adults only · 18+
          </p>
        </div>
      </div>

      <h1 className="font-[family-name:var(--font-display)] text-3xl font-semibold text-[var(--ink)] sm:text-4xl">
        Confirm you are an adult
      </h1>
      <p className="mt-4 leading-relaxed text-[var(--muted)]">
        This site contains adult sexual content and tools for adult creators.
        You must be 18 or older (or the age of majority where you live, if
        higher) to continue. Sexual content involving minors is strictly
        forbidden.
      </p>

      <div className="mt-8 space-y-4 text-[var(--ink)]">
        <label className="flex items-start gap-3">
          <input
            type="checkbox"
            className="mt-1 size-4 accent-[var(--accent)]"
            checked={ageOk}
            onChange={(e) => setAgeOk(e.target.checked)}
          />
          <span>I confirm that I am 18 years of age or older.</span>
        </label>
        <label className="flex items-start gap-3">
          <input
            type="checkbox"
            className="mt-1 size-4 accent-[var(--accent)]"
            checked={adultOk}
            onChange={(e) => setAdultOk(e.target.checked)}
          />
          <span>
            I consent to viewing and using consensual adult content and accept
            the ban on anything involving minors.
          </span>
        </label>
        <label className="flex items-start gap-3">
          <input
            type="checkbox"
            className="mt-1 size-4 accent-[var(--accent)]"
            checked={tosOk}
            onChange={(e) => setTosOk(e.target.checked)}
          />
          <span>
            I agree to the{" "}
            <Link
              href="/legal/terms"
              className="text-[var(--accent)] underline-offset-2 hover:underline"
              target="_blank"
            >
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link
              href="/legal/acceptable-use"
              className="text-[var(--accent)] underline-offset-2 hover:underline"
              target="_blank"
            >
              Acceptable Use Policy
            </Link>
            .
          </span>
        </label>
        <label className="flex items-start gap-3">
          <input
            type="checkbox"
            className="mt-1 size-4 accent-[var(--accent)]"
            checked={privacyOk}
            onChange={(e) => setPrivacyOk(e.target.checked)}
          />
          <span>
            I have read the{" "}
            <Link
              href="/legal/privacy"
              className="text-[var(--accent)] underline-offset-2 hover:underline"
              target="_blank"
            >
              Privacy Policy
            </Link>{" "}
            and the{" "}
            <Link
              href="/legal/adult-content"
              className="text-[var(--accent)] underline-offset-2 hover:underline"
              target="_blank"
            >
              Adult Content Notice
            </Link>
            .
          </span>
        </label>
      </div>

      {error ? <p className="mt-4 text-sm text-red-400">{error}</p> : null}

      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <button
          type="button"
          disabled={!ready || loading}
          className="w-full rounded-xl bg-[var(--accent)] px-6 py-3.5 font-medium text-white disabled:opacity-40 sm:w-auto"
          onClick={() => void continueFlow()}
        >
          {loading
            ? "Saving…"
            : user
              ? "Enter Vesperer"
              : intent === "signup"
                ? "Continue to sign up"
                : intent === "signin"
                  ? "Continue to sign in"
                  : "Enter site"}
        </button>
        <Link
          href="/underage"
          className="w-full rounded-xl border border-[var(--line)] px-6 py-3.5 text-center text-[var(--muted)] hover:text-[var(--ink)] sm:w-auto"
        >
          I am under 18 — exit
        </Link>
      </div>

      <p className="mt-6 text-xs leading-relaxed text-[var(--muted)]">
        Legal version {LEGAL_VERSION}. This gate is a self-attestation record
        stored as a necessary cookie
        {user ? " and on your account" : ""}. It is not government ID
        verification.
      </p>
    </main>
  );
}

function safeNext(raw: string | null) {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) return null;
  if (raw.startsWith("/age-gate") || raw.startsWith("/underage")) return null;
  return raw;
}

export default function AgeGatePage() {
  return (
    <Suspense fallback={<PageSpinner label="Loading" />}>
      <AgeGateInner />
    </Suspense>
  );
}
