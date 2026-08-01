"use client";

import { useState } from "react";

export function RoiHint({
  label,
  missedLeadsPerWeek,
  valuePerLead,
  hoursSavedPerWeek,
  hourlyCost,
}: {
  label: string;
  missedLeadsPerWeek: number;
  valuePerLead: number;
  hoursSavedPerWeek: number;
  hourlyCost: number;
}) {
  const [leads, setLeads] = useState(missedLeadsPerWeek);
  const [value, setValue] = useState(valuePerLead);
  const [hours, setHours] = useState(hoursSavedPerWeek);
  const [rate, setRate] = useState(hourlyCost);

  const weekly = leads * value + hours * rate;
  const yearly = weekly * 52;

  return (
    <div className="rounded-2xl border border-[var(--line)] bg-[var(--bg-elevated)]/50 p-5 sm:p-6">
      <p className="text-[10px] uppercase tracking-[0.22em] text-[var(--muted)]">
        Rough ROI — {label}
      </p>
      <p className="mt-2 text-sm text-[var(--muted)]">
        Adjust the numbers for your context. Illustrative only — not a quote.
      </p>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <label className="text-xs text-[var(--muted)]">
          Missed opportunities / week
          <input
            type="number"
            min={0}
            value={leads}
            onChange={(e) => setLeads(Number(e.target.value) || 0)}
            className="mt-1 w-full rounded-lg border border-[var(--line)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--ink)]"
          />
        </label>
        <label className="text-xs text-[var(--muted)]">
          Value per opportunity (€)
          <input
            type="number"
            min={0}
            value={value}
            onChange={(e) => setValue(Number(e.target.value) || 0)}
            className="mt-1 w-full rounded-lg border border-[var(--line)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--ink)]"
          />
        </label>
        <label className="text-xs text-[var(--muted)]">
          Hours saved / week
          <input
            type="number"
            min={0}
            value={hours}
            onChange={(e) => setHours(Number(e.target.value) || 0)}
            className="mt-1 w-full rounded-lg border border-[var(--line)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--ink)]"
          />
        </label>
        <label className="text-xs text-[var(--muted)]">
          Cost per hour (€)
          <input
            type="number"
            min={0}
            value={rate}
            onChange={(e) => setRate(Number(e.target.value) || 0)}
            className="mt-1 w-full rounded-lg border border-[var(--line)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--ink)]"
          />
        </label>
      </div>
      <p className="mt-5 font-[family-name:var(--font-display)] text-2xl text-[var(--accent-2)]">
        ~€{Math.round(weekly).toLocaleString("en-GB")}/week
        <span className="mt-1 block text-sm font-normal text-[var(--muted)]">
          ≈ €{Math.round(yearly).toLocaleString("en-GB")}/year recovered
        </span>
      </p>
    </div>
  );
}
