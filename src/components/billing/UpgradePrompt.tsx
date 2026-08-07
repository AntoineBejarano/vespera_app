"use client";

import * as React from "react";
import type { PaywallPayload } from "@/lib/billing/paywall";
import { Button } from "@/components/ui/button";

export function UpgradePrompt({
  paywall,
  source,
  onDismiss,
}: {
  paywall: PaywallPayload;
  source: string;
  onDismiss?: () => void;
}) {
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function startCheckout() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan: paywall.plan,
          reason: paywall.reason,
          feature: paywall.feature,
          source,
        }),
      });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !data.url) {
        throw new Error(data.error ?? "Checkout unavailable");
      }
      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Checkout unavailable");
      setBusy(false);
    }
  }

  return (
    <div className="rounded-lg border border-primary/30 bg-primary/5 px-4 py-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground">{paywall.title}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {paywall.description}
          </p>
          {paywall.limit != null ? (
            <p className="mt-1 text-xs text-muted-foreground">
              Starter limit: {paywall.limit}
            </p>
          ) : null}
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          {onDismiss ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onDismiss}
              disabled={busy}
            >
              {paywall.secondaryCta}
            </Button>
          ) : null}
          <Button type="button" size="sm" onClick={startCheckout} disabled={busy}>
            {busy ? "Opening…" : paywall.cta}
          </Button>
        </div>
      </div>
      {error ? <p className="mt-2 text-sm text-destructive">{error}</p> : null}
    </div>
  );
}
