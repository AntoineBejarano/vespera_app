"use client";

import { MagicCard } from "@/components/magicui/magic-card";
import { DOC_FIELDS, type DocKey } from "./types";

export function PersonaOverviewTab({
  intensity,
  onIntensityChange,
  name,
  onNameChange,
  docs,
  onDocChange,
  editingDocs,
  onEditingDocsChange,
  savingDocs,
  openDoc,
  onOpenDocChange,
  onSave,
  onCancel,
  onDelete,
}: {
  intensity: number;
  onIntensityChange: (value: number) => void;
  name: string;
  onNameChange: (value: string) => void;
  docs: Record<DocKey, string>;
  onDocChange: (key: DocKey, value: string) => void;
  editingDocs: boolean;
  onEditingDocsChange: (v: boolean) => void;
  savingDocs: boolean;
  openDoc: DocKey | null;
  onOpenDocChange: (key: DocKey | null) => void;
  onSave: () => void;
  onCancel: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_1.4fr]">
      <MagicCard className="h-fit">
        <section className="space-y-4 p-5">
          <div>
            <h2 className="text-xs uppercase tracking-[0.22em] text-[var(--muted)]">
              Presence
            </h2>
            <p className="mt-1 text-sm text-[var(--muted)]">
              How intense she feels in every channel.
            </p>
          </div>
          <label className="flex items-center gap-3 text-sm text-[var(--muted)]">
            Intensity
            <input
              type="range"
              min={1}
              max={5}
              value={intensity}
              onChange={(e) => onIntensityChange(Number(e.target.value))}
              className="flex-1 accent-[var(--accent)]"
            />
            <span className="w-4 text-[var(--ink)]">{intensity}</span>
          </label>
          {editingDocs ? (
            <label className="block space-y-1 text-sm">
              <span className="text-[var(--muted)]">Display name</span>
              <input
                className="w-full rounded-xl border border-[var(--line)] bg-[var(--bg)] px-3 py-2 text-[var(--ink)]"
                value={name}
                onChange={(e) => onNameChange(e.target.value)}
              />
            </label>
          ) : null}
          <div className="flex flex-wrap gap-2 pt-2">
            {editingDocs ? (
              <>
                <button
                  type="button"
                  onClick={onCancel}
                  disabled={savingDocs}
                  className="rounded-xl border border-[var(--line)] px-3 py-1.5 text-sm"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={onSave}
                  disabled={savingDocs}
                  className="rounded-xl bg-[var(--accent)] px-3 py-1.5 text-sm font-medium text-[var(--accent-ink)] disabled:opacity-50"
                >
                  {savingDocs ? "Saving…" : "Save definition"}
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => onEditingDocsChange(true)}
                className="rounded-xl border border-[var(--line)] px-3 py-1.5 text-sm hover:border-[var(--accent)]"
              >
                Edit manually
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={onDelete}
            className="pt-4 text-sm text-[var(--danger)] underline"
          >
            Delete persona
          </button>
        </section>
      </MagicCard>

      <MagicCard>
        <section className="space-y-3 p-5">
          <div>
            <h2 className="text-xs uppercase tracking-[0.22em] text-[var(--muted)]">
              Definition
            </h2>
            <p className="mt-1 text-sm text-[var(--muted)]">
              Soul, style, rules, and lore — the layers the engine reads.
            </p>
          </div>
          <div className="space-y-2">
            {DOC_FIELDS.map((field) => {
              const open = openDoc === field.key;
              const value = docs[field.key];
              return (
                <div
                  key={field.key}
                  className="rounded-xl border border-[var(--line)] bg-[var(--bg)]/50"
                >
                  <button
                    type="button"
                    className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
                    onClick={() => onOpenDocChange(open ? null : field.key)}
                  >
                    <span>
                      <span className="font-medium text-[var(--ink)]">
                        {field.label}
                      </span>
                      <span className="mt-0.5 block text-xs text-[var(--muted)]">
                        {field.hint}
                      </span>
                    </span>
                    <span className="shrink-0 text-xs text-[var(--muted)]">
                      {open ? "Hide" : "Show"} · {value.length}
                    </span>
                  </button>
                  {open ? (
                    <div className="border-t border-[var(--line)] px-4 py-3">
                      {editingDocs ? (
                        <textarea
                          className="min-h-48 w-full resize-y rounded-lg border border-[var(--line)] bg-[var(--bg)] px-3 py-2 font-mono text-sm leading-relaxed text-[var(--ink)] outline-none focus:border-[var(--accent)]"
                          value={value}
                          onChange={(e) =>
                            onDocChange(field.key, e.target.value)
                          }
                        />
                      ) : (
                        <pre className="max-h-[28rem] overflow-auto whitespace-pre-wrap font-sans text-sm leading-relaxed text-[var(--ink)]">
                          {value.trim() || (
                            <span className="text-[var(--muted)]">Empty</span>
                          )}
                        </pre>
                      )}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </section>
      </MagicCard>
    </div>
  );
}
