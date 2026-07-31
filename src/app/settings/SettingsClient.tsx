"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useHexclaveApp } from "@hexclave/next";
import { ALLOWED_MODELS, MODEL_LABELS } from "@/lib/ai/models";

type ApiKeyRow = {
  id: string;
  name: string;
  keyPrefix: string;
  lastUsedAt: string | null;
  createdAt: string;
};

export default function SettingsClient() {
  const app = useHexclaveApp();
  const [model, setModel] = useState("");
  const [usage, setUsage] = useState<{
    used: number;
    remaining: number;
    limit: number;
  } | null>(null);
  const [plan, setPlan] = useState("free");
  const [message, setMessage] = useState<string | null>(null);
  const [keys, setKeys] = useState<ApiKeyRow[]>([]);
  const [newSecret, setNewSecret] = useState<string | null>(null);
  const [keyName, setKeyName] = useState("cli");

  async function refreshKeys() {
    const res = await fetch("/api/user/api-keys");
    const data = await res.json();
    if (res.ok) setKeys(data.keys ?? []);
  }

  useEffect(() => {
    void (async () => {
      const res = await fetch("/api/user/settings");
      const data = await res.json();
      if (res.ok) {
        setModel(data.preferredModel);
        setUsage(data.usage);
        setPlan(data.plan);
      }
      await refreshKeys();
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

  async function createKey() {
    setNewSecret(null);
    const res = await fetch("/api/user/api-keys", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: keyName }),
    });
    const data = await res.json();
    if (!res.ok) {
      setMessage(data.error ?? "Could not create key");
      return;
    }
    setNewSecret(data.key.secret);
    setMessage("API key created — copy it now. It won’t be shown again.");
    await refreshKeys();
  }

  async function revokeKey(id: string) {
    if (!confirm("Revoke this API key? CLIs using it will stop working.")) return;
    const res = await fetch(`/api/user/api-keys/${id}`, { method: "DELETE" });
    if (res.ok) {
      setMessage("Key revoked");
      await refreshKeys();
    }
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
      app.redirectToSignOut();
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
          Personas, bots, photos and chat keys live under{" "}
          <Link href="/personas" className="text-[var(--accent)]">
            Personas
          </Link>
          . Need a hand?{" "}
          <Link href="/help" className="text-[var(--accent)]">
            Help
          </Link>{" "}
          ·{" "}
          <Link href="/docs" className="text-[var(--accent)]">
            API docs
          </Link>
          . Plan: {plan}.{" "}
          {usage
            ? `Today: ${usage.used}/${usage.limit} (${usage.remaining} left).`
            : null}
        </p>
      </div>

      <section className="space-y-3 border border-[var(--line)] bg-[var(--bg-elevated)] p-4">
        <h2 className="text-sm uppercase tracking-wider text-[var(--muted)]">
          Account API keys (CLI / AI agents)
        </h2>
        <p className="text-sm text-[var(--muted)]">
          Keys starting with <code className="text-[var(--ink)]">vsk_</code> let
          agents create personas via the CLI or{" "}
          <code className="text-[var(--ink)]">POST /api/v1/personas</code>. Chat
          keys (<code className="text-[var(--ink)]">vesp_</code>) stay on each
          persona.
        </p>
        <div className="flex flex-wrap gap-2">
          <input
            className="min-w-[8rem] flex-1 border border-[var(--line)] bg-[var(--bg)] px-3 py-2 text-sm"
            value={keyName}
            onChange={(e) => setKeyName(e.target.value)}
            placeholder="Label (e.g. cursor)"
          />
          <button
            type="button"
            onClick={createKey}
            className="bg-[var(--accent)] px-4 py-2 text-sm text-[var(--accent-ink)]"
          >
            Create key
          </button>
        </div>
        {newSecret ? (
          <div className="rounded-xl border border-[var(--accent)]/40 bg-[var(--accent-soft)] p-3 text-sm">
            <p className="text-xs uppercase tracking-wider text-[var(--muted)]">
              Copy now
            </p>
            <code className="mt-2 block break-all text-[var(--ink)]">
              {newSecret}
            </code>
            <pre className="mt-3 overflow-x-auto text-xs text-[var(--muted)]">
{`npm run vesperer -- login --key ${newSecret}`}
            </pre>
          </div>
        ) : null}
        <ul className="space-y-2 text-sm">
          {keys.map((k) => (
            <li
              key={k.id}
              className="flex items-center justify-between gap-3 border border-[var(--line)] px-3 py-2"
            >
              <div>
                <p className="text-[var(--ink)]">
                  {k.name} · <code>{k.keyPrefix}…</code>
                </p>
                <p className="text-xs text-[var(--muted)]">
                  Created {new Date(k.createdAt).toLocaleDateString()}
                  {k.lastUsedAt
                    ? ` · last used ${new Date(k.lastUsedAt).toLocaleDateString()}`
                    : ""}
                </p>
              </div>
              <button
                type="button"
                onClick={() => revokeKey(k.id)}
                className="text-xs text-red-400"
              >
                Revoke
              </button>
            </li>
          ))}
          {keys.length === 0 ? (
            <li className="text-sm text-[var(--muted)]">No active keys yet.</li>
          ) : null}
        </ul>
        <Link href="/docs#cli" className="text-sm text-[var(--accent)]">
          CLI docs →
        </Link>
      </section>

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
        onClick={() => app.redirectToSignOut()}
      >
        Sign out
      </button>
    </div>
  );
}
