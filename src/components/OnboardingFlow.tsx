"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ONBOARDING_STEPS } from "@/lib/identity/schema";

type Answers = {
  name: string;
  personality: string;
  relationshipType: string;
  attractions: string;
  irritations: string;
  boundaries: string;
  style: string;
  intensity: number;
};

const empty: Answers = {
  name: "",
  personality: "",
  relationshipType: "",
  attractions: "",
  irritations: "",
  boundaries: "",
  style: "",
  intensity: 3,
};

export function OnboardingFlow() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Answers>(empty);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const current = ONBOARDING_STEPS[step];
  const progress = useMemo(
    () => Math.round(((step + 1) / ONBOARDING_STEPS.length) * 100),
    [step],
  );

  async function finish(finalAnswers: Answers) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/characters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(finalAnswers),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Error");
      router.push(`/personas/${data.character.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create persona");
      setLoading(false);
    }
  }

  function next() {
    if (!draft.trim() && current.id !== "boundaries") return;

    const nextAnswers = { ...answers };

    switch (current.id) {
      case "name":
        nextAnswers.name = draft.trim();
        break;
      case "personality":
        nextAnswers.personality = draft.trim();
        break;
      case "relationshipType":
        nextAnswers.relationshipType = draft.trim();
        break;
      case "attractionsIrritated": {
        const [attr, irr] = draft.split(/\n+|\/+|—+/).map((s) => s.trim());
        nextAnswers.attractions = attr || draft.trim();
        nextAnswers.irritations =
          irr || "Being generic or too people-pleasing";
        break;
      }
      case "boundaries":
        nextAnswers.boundaries =
          draft.trim() || "No special limits (except 18+)";
        break;
      case "style":
        nextAnswers.style = draft.trim();
        break;
      case "intensity": {
        const n = Number(draft.trim());
        nextAnswers.intensity = Number.isFinite(n)
          ? Math.min(5, Math.max(1, Math.round(n)))
          : 3;
        break;
      }
    }

    setAnswers(nextAnswers);
    setDraft("");

    if (step >= ONBOARDING_STEPS.length - 1) {
      void finish(nextAnswers);
      return;
    }
    setStep((s) => s + 1);
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-12">
      <div className="mb-8 h-1 w-full bg-[var(--line)]">
        <div
          className="h-1 bg-[var(--accent)] transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>
      <p className="text-sm uppercase tracking-[0.2em] text-[var(--muted)]">
        New persona
      </p>
      <h1 className="mt-3 font-[family-name:var(--font-display)] text-3xl text-[var(--ink)]">
        {current.prompt}
      </h1>
      <textarea
        className="mt-8 min-h-32 w-full border border-[var(--line)] bg-[var(--bg-elevated)] px-4 py-3 text-[var(--ink)] outline-none focus:border-[var(--accent)]"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        placeholder={
          current.id === "intensity"
            ? "3"
            : current.id === "attractionsIrritated"
              ? "I like… / I hate…"
              : "Answer naturally…"
        }
        disabled={loading}
      />
      {error ? <p className="mt-3 text-sm text-red-400">{error}</p> : null}
      <div className="mt-6 flex gap-3">
        {step > 0 ? (
          <button
            type="button"
            className="border border-[var(--line)] px-4 py-3 text-[var(--muted)]"
            onClick={() => setStep((s) => s - 1)}
            disabled={loading}
          >
            Back
          </button>
        ) : null}
        <button
          type="button"
          className="bg-[var(--accent)] px-6 py-3 text-[var(--bg)] disabled:opacity-50"
          onClick={next}
          disabled={loading}
        >
          {loading
            ? "Building mind…"
            : step >= ONBOARDING_STEPS.length - 1
              ? "Generate persona"
              : "Continue"}
        </button>
      </div>
    </div>
  );
}
