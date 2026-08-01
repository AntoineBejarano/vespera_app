"use client";

import Link from "next/link";
import { PlatformOperatorAck } from "@/components/PlatformOperatorAck";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  PERSONA_LICENSES,
  PERSONA_LICENSE_LABELS,
  type PersonaLicense,
} from "@/lib/personas/license";

export function PersonaPublishTab({
  slug,
  tagline,
  openingLine,
  categories,
  allowFork,
  isAdult,
  isPublic,
  license,
  changelog,
  version,
  savingPublic,
  showOperatorAck,
  operatorAck,
  onSlugChange,
  onTaglineChange,
  onOpeningLineChange,
  onCategoriesChange,
  onAllowForkChange,
  onIsAdultChange,
  onLicenseChange,
  onChangelogChange,
  onOperatorAckChange,
  onSave,
  onExportChai,
}: {
  slug: string;
  tagline: string;
  openingLine: string;
  categories: string;
  allowFork: boolean;
  isAdult: boolean;
  isPublic: boolean;
  license: string;
  changelog: string;
  version: string;
  savingPublic: boolean;
  showOperatorAck: boolean;
  operatorAck: boolean;
  onSlugChange: (v: string) => void;
  onTaglineChange: (v: string) => void;
  onOpeningLineChange: (v: string) => void;
  onCategoriesChange: (v: string) => void;
  onAllowForkChange: (v: boolean) => void;
  onIsAdultChange: (v: boolean) => void;
  onLicenseChange: (v: PersonaLicense) => void;
  onChangelogChange: (v: string) => void;
  onOperatorAckChange: (v: boolean) => void;
  onSave: (nextPublic?: boolean) => void;
  onExportChai: () => void;
}) {
  return (
    <Card className="mx-auto max-w-2xl shadow-none">
      <CardHeader>
        <CardTitle>Persona Registry</CardTitle>
        <CardDescription>
          Publish a canonical identity page at{" "}
          <span className="text-foreground">/p/{slug || "slug"}</span>. Visitors
          can talk, fork, or export — keep the master here.
        </CardDescription>
        <p className="text-xs text-muted-foreground">
          Current version {version}
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <label className="block space-y-1.5 text-sm">
          <span className="text-muted-foreground">Slug</span>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">/p/</span>
            <Input
              value={slug}
              onChange={(e) => onSlugChange(e.target.value.toLowerCase())}
              placeholder="luna"
            />
          </div>
        </label>
        <label className="block space-y-1.5 text-sm">
          <span className="text-muted-foreground">Tagline</span>
          <Input
            value={tagline}
            onChange={(e) => onTaglineChange(e.target.value)}
          />
        </label>
        <label className="block space-y-1.5 text-sm">
          <span className="text-muted-foreground">Opening line</span>
          <textarea
            value={openingLine}
            onChange={(e) => onOpeningLineChange(e.target.value)}
            rows={2}
            className="w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          />
        </label>
        <label className="block space-y-1.5 text-sm">
          <span className="text-muted-foreground">
            Categories (comma-separated)
          </span>
          <Input
            value={categories}
            onChange={(e) => onCategoriesChange(e.target.value)}
            placeholder="Companions, Mentors"
          />
        </label>
        <label className="block space-y-1.5 text-sm">
          <span className="text-muted-foreground">License</span>
          <select
            value={license}
            onChange={(e) =>
              onLicenseChange(e.target.value as PersonaLicense)
            }
            className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm"
          >
            {PERSONA_LICENSES.filter((l) => l !== "private").map((l) => (
              <option key={l} value={l}>
                {PERSONA_LICENSE_LABELS[l]}
              </option>
            ))}
          </select>
        </label>
        <label className="block space-y-1.5 text-sm">
          <span className="text-muted-foreground">
            Changelog (optional — saved on next version bump)
          </span>
          <Input
            value={changelog}
            onChange={(e) => onChangelogChange(e.target.value)}
            placeholder="+ Warmer conversational style"
          />
        </label>
        <div className="flex flex-col gap-2 text-sm">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={allowFork}
              onChange={(e) => onAllowForkChange(e.target.checked)}
            />
            Allow forks
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={isAdult}
              onChange={(e) => onIsAdultChange(e.target.checked)}
            />
            Mark as 18+ listing
          </label>
        </div>
        {showOperatorAck && !isPublic ? (
          <PlatformOperatorAck
            checked={operatorAck}
            onChange={onOperatorAckChange}
            compact
          />
        ) : null}
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            disabled={savingPublic}
            onClick={() => onSave(true)}
          >
            {savingPublic
              ? "Saving…"
              : isPublic
                ? "Update registry page"
                : "Publish to registry"}
          </Button>
          {isPublic ? (
            <>
              <Button asChild variant="outline">
                <Link href={`/p/${slug}`}>View /p/{slug}</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href={`/c/${slug}`}>Talk /c/{slug}</Link>
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={savingPublic}
                onClick={() => onSave(false)}
              >
                Unpublish
              </Button>
            </>
          ) : null}
          <Button type="button" variant="outline" onClick={onExportChai}>
            Export for Chai
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
