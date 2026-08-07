"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useHexclaveApp } from "@hexclave/next";
import { ALLOWED_MODELS, MODEL_LABELS } from "@/lib/ai/models";
import { PageHeader } from "@/components/app-shell/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

type ApiKeyRow = {
  id: string;
  name: string;
  keyPrefix: string;
  lastFour?: string;
  lastUsedAt: string | null;
  createdAt: string;
};

export default function SettingsClient() {
  const app = useHexclaveApp();
  const search = useSearchParams();
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

  async function refreshSettings() {
    const res = await fetch("/api/user/settings");
    const data = await res.json();
    if (res.ok) {
      setModel(data.preferredModel);
      setUsage(data.usage);
      setPlan(data.plan);
    }
  }

  useEffect(() => {
    void (async () => {
      await refreshSettings();
      await refreshKeys();
      if (search.get("billing") === "success") {
        const sync = await fetch("/api/billing/sync", { method: "POST" });
        const body = (await sync.json()) as { plan?: string; error?: string };
        if (sync.ok) {
          setPlan(body.plan ?? "free");
          setMessage(`Billing updated — plan: ${body.plan ?? "free"}`);
        } else {
          setMessage(
            body.error ??
              "Payment received; plan sync is catching up. Use Sync billing if needed.",
          );
        }
        await refreshSettings();
      }
    })();
  }, [search]);

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
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-6 sm:px-6 sm:py-8">
      <PageHeader
        title="Settings"
        description={
          <>
            Plan <Badge variant="secondary">{plan}</Badge>
            {usage
              ? ` · Today ${usage.used}/${usage.limit} (${usage.remaining} left)`
              : null}
            . Personas live under{" "}
            <Link href="/personas" className="text-[var(--accent)] hover:underline">
              Personas
            </Link>
            .
          </>
        }
      />

      <Card className="shadow-none">
        <CardHeader>
          <CardTitle>Billing</CardTitle>
          <CardDescription>
            Apex SFW plans (Creator / Studio) bill through Stripe. After Dark
            adult plans never use this checkout.{" "}
            <Link href="/legal/billing" className="underline underline-offset-2">
              Billing Terms
            </Link>
            {" · "}
            <Link href="/legal/refunds" className="underline underline-offset-2">
              Refunds
            </Link>
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              void (async () => {
                const res = await fetch("/api/billing/portal", {
                  method: "POST",
                });
                const data = (await res.json()) as {
                  url?: string;
                  error?: string;
                };
                if (res.ok && data.url) {
                  window.location.href = data.url;
                  return;
                }
                setMessage(data.error ?? "Billing portal unavailable");
              })();
            }}
          >
            Manage billing
          </Button>
          <Button
            type="button"
            onClick={() => {
              void (async () => {
                const res = await fetch("/api/billing/checkout", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    plan: plan === "studio" || plan === "premium" ? "studio" : "creator",
                    reason: "settings_upgrade",
                    source: "settings",
                  }),
                });
                const data = (await res.json()) as {
                  url?: string;
                  error?: string;
                };
                if (res.ok && data.url) {
                  window.location.href = data.url;
                  return;
                }
                setMessage(data.error ?? "Checkout unavailable");
              })();
            }}
          >
            Upgrade plan
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              void (async () => {
                const res = await fetch("/api/billing/sync", { method: "POST" });
                const data = (await res.json()) as {
                  plan?: string;
                  error?: string;
                  stripeStatus?: string;
                };
                if (res.ok) {
                  setPlan(data.plan ?? "free");
                  setMessage(
                    `Synced — plan ${data.plan ?? "free"}${
                      data.stripeStatus ? ` (${data.stripeStatus})` : ""
                    }`,
                  );
                  return;
                }
                setMessage(data.error ?? "Sync failed");
              })();
            }}
          >
            Sync billing
          </Button>
        </CardContent>
        {message ? (
          <p className="px-6 pb-4 text-sm text-[var(--muted)]">{message}</p>
        ) : null}
      </Card>

      <Card className="shadow-none">
        <CardHeader>
          <CardTitle>Team & workspaces</CardTitle>
          <CardDescription>
            Invite people, create workspaces, and manage the active studio under{" "}
            <Link href="/workspaces" className="underline underline-offset-2">
              Workspaces
            </Link>
            .
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild variant="outline">
            <Link href="/workspaces">Open workspaces</Link>
          </Button>
        </CardContent>
      </Card>

      <Card id="api-keys" className="scroll-mt-20 shadow-none">
        <CardHeader>
          <CardTitle>Account API keys</CardTitle>
          <CardDescription>
            Keys starting with <code className="text-foreground">vsk_</code> let
            agents create personas via CLI or{" "}
            <code className="text-foreground">POST /api/v1/personas</code>.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Input
              className="min-w-[8rem] flex-1"
              value={keyName}
              onChange={(e) => setKeyName(e.target.value)}
              placeholder="Label (e.g. cursor)"
            />
            <Button type="button" onClick={() => void createKey()}>
              Create key
            </Button>
          </div>
          {newSecret ? (
            <div className="rounded-lg border border-[var(--accent)]/40 bg-[var(--accent-soft)] p-3 text-sm">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">
                Copy now
              </p>
              <code className="mt-2 block break-all text-foreground">
                {newSecret}
              </code>
              <pre className="mt-3 overflow-x-auto text-xs text-muted-foreground">
                {`npm run vesperer -- login --key ${newSecret}`}
              </pre>
            </div>
          ) : null}
          <ul className="space-y-2">
            {keys.map((k) => (
              <li
                key={k.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2.5"
              >
                <div>
                  <p className="text-sm text-foreground">
                    {k.name} ·{" "}
                    <code>
                      {k.keyPrefix}…{k.lastFour ?? ""}
                    </code>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Created {new Date(k.createdAt).toLocaleDateString()}
                    {k.lastUsedAt
                      ? ` · last used ${new Date(k.lastUsedAt).toLocaleDateString()}`
                      : ""}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-destructive"
                  onClick={() => void revokeKey(k.id)}
                >
                  Revoke
                </Button>
              </li>
            ))}
            {keys.length === 0 ? (
              <li className="text-sm text-muted-foreground">
                No active keys yet.
              </li>
            ) : null}
          </ul>
          <Button asChild variant="link" className="h-auto px-0">
            <Link href="/docs#cli">CLI docs →</Link>
          </Button>
        </CardContent>
      </Card>

      <Card className="shadow-none">
        <CardHeader>
          <CardTitle>Default OpenRouter model</CardTitle>
          <CardDescription>
            Account fallback for persona generation and for personas that do not
            set their own model under Self. Chat uses each persona&apos;s model
            first.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <select
            className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm"
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
          <Button type="button" onClick={() => void saveModel()}>
            Save default
          </Button>
        </CardContent>
      </Card>

      <Card className="shadow-none">
        <CardHeader>
          <CardTitle>Privacy</CardTitle>
          <CardDescription>
            Export or permanently delete your account.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => void exportData()}
          >
            Export data
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={() => void deleteAccount()}
          >
            Delete account
          </Button>
        </CardContent>
      </Card>

      {message ? (
        <p className="text-sm text-[var(--accent)]">{message}</p>
      ) : null}

      <Separator />

      <Button
        type="button"
        variant="ghost"
        className="text-muted-foreground"
        onClick={() => app.redirectToSignOut()}
      >
        Sign out
      </Button>
    </div>
  );
}
