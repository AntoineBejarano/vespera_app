"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function AgeGatePage() {
  const router = useRouter();
  const [checked, setChecked] = useState(false);

  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col justify-center px-6">
      <h1 className="font-[family-name:var(--font-display)] text-4xl text-[var(--ink)]">
        Adults only
      </h1>
      <p className="mt-4 leading-relaxed text-[var(--muted)]">
        Vespera is a private platform for adult fictional relationships (18+).
        Content may be romantic and erotic between consenting adults. Sexual
        content involving minors is strictly forbidden.
      </p>
      <label className="mt-8 flex items-start gap-3 text-[var(--ink)]">
        <input
          type="checkbox"
          className="mt-1"
          checked={checked}
          onChange={(e) => setChecked(e.target.checked)}
        />
        <span>I confirm I am 18 or older and agree to continue.</span>
      </label>
      <button
        type="button"
        disabled={!checked}
        className="mt-8 bg-[var(--accent)] px-6 py-3 text-[var(--bg)] disabled:opacity-40"
        onClick={() => {
          sessionStorage.setItem("vespera_age_ok", "1");
          router.push("/register");
        }}
      >
        Continue
      </button>
    </main>
  );
}
