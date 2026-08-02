"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ALLOWED_MODELS, MODEL_LABELS } from "@/lib/ai/models";
import { DOC_FIELDS, type DocKey } from "./types";

export function PersonaOverviewTab({
  intensity,
  onIntensityChange,
  preferredModel,
  onPreferredModelChange,
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
  preferredModel: string | null;
  onPreferredModelChange: (value: string | null) => void;
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
      <Card className="h-fit shadow-none">
        <CardHeader>
          <CardTitle>Presence</CardTitle>
          <CardDescription>
            Intensity and which OpenRouter model powers this persona only.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <label className="flex items-center gap-3 text-sm text-muted-foreground">
            Intensity
            <input
              type="range"
              min={1}
              max={5}
              value={intensity}
              onChange={(e) => onIntensityChange(Number(e.target.value))}
              className="flex-1 accent-[var(--accent)]"
            />
            <span className="w-4 text-foreground">{intensity}</span>
          </label>
          <label className="block space-y-1.5 text-sm">
            <span className="text-muted-foreground">Chat model</span>
            <select
              className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground"
              value={preferredModel ?? ""}
              onChange={(e) =>
                onPreferredModelChange(e.target.value ? e.target.value : null)
              }
            >
              <option value="">Account default (Settings)</option>
              {ALLOWED_MODELS.map((id) => (
                <option key={id} value={id}>
                  {MODEL_LABELS[id] ?? id}
                </option>
              ))}
            </select>
            <span className="block text-[11px] text-muted-foreground">
              Per persona — Tatiana can use Hermes while Pepe stays on a lighter
              model.
            </span>
          </label>
          {editingDocs ? (
            <label className="block space-y-1.5 text-sm">
              <span className="text-muted-foreground">Display name</span>
              <Input
                value={name}
                onChange={(e) => onNameChange(e.target.value)}
              />
            </label>
          ) : null}
          <div className="flex flex-wrap gap-2 pt-1">
            {editingDocs ? (
              <>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={onCancel}
                  disabled={savingDocs}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={onSave}
                  disabled={savingDocs}
                >
                  {savingDocs ? "Saving…" : "Save definition"}
                </Button>
              </>
            ) : (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onEditingDocsChange(true)}
              >
                Edit manually
              </Button>
            )}
          </div>
          <Button
            type="button"
            variant="link"
            className="h-auto px-0 text-destructive"
            onClick={onDelete}
          >
            Delete persona
          </Button>
        </CardContent>
      </Card>

      <Card className="shadow-none">
        <CardHeader>
          <CardTitle>Definition</CardTitle>
          <CardDescription>
            Soul, style, rules, and lore — the layers the engine reads.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {DOC_FIELDS.map((field) => {
            const open = openDoc === field.key;
            const value = docs[field.key];
            return (
              <div
                key={field.key}
                className="rounded-lg border border-border bg-background/50"
              >
                <button
                  type="button"
                  className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
                  onClick={() => onOpenDocChange(open ? null : field.key)}
                >
                  <span>
                    <span className="font-medium text-foreground">
                      {field.label}
                    </span>
                    <span className="mt-0.5 block text-xs text-muted-foreground">
                      {field.hint}
                    </span>
                  </span>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {open ? "Hide" : "Show"} · {value.length}
                  </span>
                </button>
                {open ? (
                  <div className="border-t border-border px-4 py-3">
                    {editingDocs ? (
                      <textarea
                        className="min-h-48 w-full resize-y rounded-lg border border-input bg-background px-3 py-2 font-mono text-sm leading-relaxed text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                        value={value}
                        onChange={(e) =>
                          onDocChange(field.key, e.target.value)
                        }
                      />
                    ) : (
                      <pre className="max-h-[28rem] overflow-auto whitespace-pre-wrap font-sans text-sm leading-relaxed text-foreground">
                        {value.trim() || (
                          <span className="text-muted-foreground">Empty</span>
                        )}
                      </pre>
                    )}
                  </div>
                ) : null}
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
