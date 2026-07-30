"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useHexclaveApp, useUser } from "@hexclave/next";

export default function AgeGatePage() {
  const router = useRouter();
  const app = useHexclaveApp();
  const user = useUser();
  const [checked, setChecked] = useState(false);
  const [consent, setConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function continueFlow() {
    if (!checked || !consent) return;
    setLoading(true);
    setError(null);

    if (!user) {
      sessionStorage.setItem("vespera_age_ok", "1");
      app.redirectToSignUp();
      return;
    }

    try {
      const res = await fetch("/api/user/age-verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ageConfirmed: true, adultConsent: true }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      router.replace("/personas");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col justify-center px-6">
      <h1 className="font-[family-name:var(--font-display)] text-4xl text-[var(--ink)]">
        Adults only
      </h1>
      <p className="mt-4 leading-relaxed text-[var(--muted)]">
        Vespera is built for uncensored adult companion products (18+). Content
        may be romantic and erotic between consenting adults. Sexual content
        involving minors is strictly forbidden.
      </p>
      <label className="mt-8 flex items-start gap-3 text-[var(--ink)]">
        <input
          type="checkbox"
          className="mt-1"
          checked={checked}
          onChange={(e) => setChecked(e.target.checked)}
        />
        <span>I confirm I am 18 or older.</span>
      </label>
      <label className="mt-4 flex items-start gap-3 text-[var(--ink)]">
        <input
          type="checkbox"
          className="mt-1"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
        />
        <span>I accept consensual adult content and the ban on minors.</span>
      </label>
      {error ? <p className="mt-4 text-sm text-red-400">{error}</p> : null}
      <button
        type="button"
        disabled={!checked || !consent || loading}
        className="mt-8 bg-[var(--accent)] px-6 py-3 text-[var(--bg)] disabled:opacity-40"
        onClick={() => void continueFlow()}
      >
        {loading ? "Saving…" : user ? "Enter admin" : "Continue to sign up"}
      </button>
    </main>
  );
}
