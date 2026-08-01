import type { PersonaLicense } from "@/lib/personas/license";

export type PersonaExportSource = {
  name: string;
  tagline: string | null;
  openingLine: string | null;
  categories: string[];
  soulMd: string | null;
  styleMd: string | null;
  rulesMd: string | null;
  contextMd: string | null;
  license: string;
  versionMajor: number;
  versionMinor: number;
  slug: string | null;
};

function stripMdHeading(md: string | null | undefined) {
  return (md || "")
    .replace(/^#+\s.*$/gm, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function clip(text: string, max: number) {
  const t = text.replace(/\s+/g, " ").trim();
  return t.length > max ? `${t.slice(0, max - 1)}…` : t;
}

/** Fields a creator can paste into Chai (manual publish — no official API). */
export function exportChaiReady(source: PersonaExportSource) {
  const soul = stripMdHeading(source.soulMd);
  const style = stripMdHeading(source.styleMd);
  const rules = stripMdHeading(source.rulesMd);
  const context = stripMdHeading(source.contextMd);

  return {
    format: "chai_ready" as const,
    disclaimer:
      "Vesperer is not affiliated with or endorsed by Chai AI. Copy these fields manually into Chai.",
    fields: {
      characterName: source.name,
      description: clip(soul || source.tagline || source.name, 1200),
      openingMessage:
        source.openingLine || `Hi — I'm ${source.name}. Shall we begin?`,
      personalityPrompt: clip(
        [soul, style].filter(Boolean).join("\n\n"),
        4000,
      ),
      exampleDialogue: clip(style, 2000),
      behavioralRules: clip(rules, 2000),
      suggestedTags: source.categories.slice(0, 8),
      scenario: clip(context, 1500),
    },
    registry: {
      version: `${source.versionMajor}.${source.versionMinor}`,
      license: source.license as PersonaLicense,
      slug: source.slug,
      canonicalHint: source.slug
        ? `https://vesperer.com/p/${source.slug}`
        : null,
    },
  };
}

/** Character Card v2 / SillyTavern-compatible JSON. */
export function exportCharacterCard(source: PersonaExportSource) {
  const soul = stripMdHeading(source.soulMd);
  const style = stripMdHeading(source.styleMd);
  const rules = stripMdHeading(source.rulesMd);
  const context = stripMdHeading(source.contextMd);

  return {
    format: "character_card_v2" as const,
    spec: "chara_card_v2",
    spec_version: "2.0",
    data: {
      name: source.name,
      description: soul || source.tagline || source.name,
      personality: soul || source.tagline || "",
      scenario: context,
      first_mes:
        source.openingLine || `Hi — I'm ${source.name}. Shall we begin?`,
      mes_example: style,
      creator_notes: [
        `Exported from Vesperer Persona Registry v${source.versionMajor}.${source.versionMinor}.`,
        `License: ${source.license}.`,
        source.slug ? `Canonical: https://vesperer.com/p/${source.slug}` : null,
        "Vesperer is not affiliated with SillyTavern or Chai AI.",
      ]
        .filter(Boolean)
        .join(" "),
      system_prompt: [soul, style].filter(Boolean).join("\n\n"),
      post_history_instructions: rules,
      tags: source.categories,
    },
  };
}

export type PersonaExportFormat = "chai" | "character_card" | "all";

export function exportPersona(
  source: PersonaExportSource,
  format: PersonaExportFormat = "all",
) {
  if (format === "chai") return exportChaiReady(source);
  if (format === "character_card") return exportCharacterCard(source);
  return {
    chai: exportChaiReady(source),
    characterCard: exportCharacterCard(source),
  };
}
