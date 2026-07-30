"use client";

import { signOut } from "next-auth/react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ALLOWED_MODELS, MODEL_LABELS } from "@/lib/ai/models";

export default function SettingsClient() {
  const [model, setModel] = useState("");
  const [usage, setUsage] = useState<{
    used: number;
    remaining: number;
    limit: number;
  } | null>(null);
  const [plan, setPlan] = useState("free");
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      const res = await fetch("/api/user/settings");
      const data = await res.json();
      if (res.ok) {
        setModel(data.preferredModel);
        setUsage(data.usage);
        setPlan(data.plan);
      }
    })();
  }, []);

  async function saveModel() {
    const res = await fetch("/api/user/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ preferredModel: model }),
    });
    const data = await res.json();
    setMessage(res.ok ? "Model saved" : data.error);
  }

  async function exportData() {
    const res = await fetch("/api/user/export");
    const data = await res.json();
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `vespera-export-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function deleteAccount() {
    if (!confirm("Permanently delete your account and all data?")) return;
    const res = await fetch("/api/user/delete", { method: "DELETE" });
    if (res.ok) {
      await signOut({ callbackUrl: "/" });
    }
  }

  return (
    <div className="mx-auto max-w-xl space-y-8 px-4 py-10">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-[var(--accent)]">
          Admin
        </p>
        <h1 className="mt-2 font-[family-name:var(--font-display)] text-3xl">
          Settings
        </h1>
        <p className="mt-2 text-[var(--muted)]">
          Personas, bots, photos and API keys live under{" "}
          <Link href="/personas" className="text-[var(--accent)]">
            Personas
          </Link>
          . Plan: {plan}.{" "}
          {usage
            ? `Today: ${usage.used}/${usage.limit} (${usage.remaining} left).`
            : null}
        </p>
      </div>

      <section className="space-y-3 border border-[var(--line)] bg-[var(--bg-elevated)] p-4">
        <h2 className="text-sm uppercase tracking-wider text-[var(--muted)]">
          OpenRouter model
        </h2>
        <select
          className="w-full border border-[var(--line)] bg-[var(--bg)] px-3 py-2"
          value={model}
          onChange={(e) => setModel(e.target.value)}
        >
          {(ALLOWED_MODELS.length
            ? ALLOWED_MODELS
            : Object.keys(MODEL_LABELS)
          ).map((id) => (
            <option key={id} value={id}>
              {MODEL_LABELS[id] ?? id}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={saveModel}
          className="bg-[var(--accent)] px-4 py-2 text-[var(--bg)]"
        >
          Save model
        </button>
      </section>

      <section className="space-y-3 border border-[var(--line)] bg-[var(--bg-elevated)] p-4">
        <h2 className="text-sm uppercase tracking-wider text-[var(--muted)]">
          Privacy
        </h2>
        <button
          type="button"
          onClick={exportData}
          className="mr-3 border border-[var(--line)] px-4 py-2"
        >
          Export data
        </button>
        <button
          type="button"
          onClick={deleteAccount}
          className="border border-red-500/40 px-4 py-2 text-red-400"
        >
          Delete account
        </button>
      </section>

      {message ? <p className="text-sm text-[var(--accent)]">{message}</p> : null}

      <button
        type="button"
        className="text-sm text-[var(--muted)] underline"
        onClick={() => signOut({ callbackUrl: "/" })}
      >
        Sign out
      </button>
    </div>
  );
}
