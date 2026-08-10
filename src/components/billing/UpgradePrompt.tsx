"use client";

import * as React from "react";
import type { PaywallPayload } from "@/lib/billing/paywall";
import { Button } from "@/components/ui/button";

export function UpgradePrompt({
  paywall,
  source,
  onDismiss,
  trialDays,
  returnTo,
}: {
  paywall: PaywallPayload;
  source: string;
  onDismiss?: () => void;
  trialDays?: number;
  returnTo?: string;
}) {
  const [busy, setBusy] = React.useState<"trial" | "upgrade" | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [trialUnavailable, setTrialUnavailable] = React.useState(false);
  const trialAvailable = Boolean(trialDays) && !trialUnavailable;

  async function startCheckout(startTrial: boolean) {
    setBusy(startTrial ? "trial" : "upgrade");
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
          returnTo,
          startTrial,
        }),
      });
      const data = (await res.json()) as {
        url?: string;
        error?: string;
        code?: string;
      };
      if (data.code === "TRIAL_NOT_ELIGIBLE") {
        setTrialUnavailable(true);
        setError(
          "The free trial has already been used. You can upgrade directly or free a slot.",
        );
        setBusy(null);
        return;
      }
      if (!res.ok || !data.url) {
        throw new Error(data.error ?? "Checkout unavailable");
      }
      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Checkout unavailable");
      setBusy(null);
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
          {trialAvailable && trialDays ? (
            <p className="mt-2 text-xs leading-5 text-muted-foreground">
              {trialDays} days free, then the recurring Studio price shown in
              Stripe Checkout. Card required. Cancel before the trial ends to
              avoid being charged.
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
              disabled={busy !== null}
            >
              {paywall.secondaryCta}
            </Button>
          ) : null}
          {trialAvailable && trialDays ? (
            <Button
              type="button"
              size="sm"
              onClick={() => void startCheckout(true)}
              disabled={busy !== null}
            >
              {busy === "trial"
                ? "Opening…"
                : `Start ${trialDays}-day free trial`}
            </Button>
          ) : null}
          <Button
            type="button"
            variant={trialAvailable ? "outline" : "default"}
            size="sm"
            onClick={() => void startCheckout(false)}
            disabled={busy !== null}
          >
            {busy === "upgrade" ? "Opening…" : paywall.cta}
          </Button>
        </div>
      </div>
      {error ? <p className="mt-2 text-sm text-destructive">{error}</p> : null}
    </div>
  );
}
