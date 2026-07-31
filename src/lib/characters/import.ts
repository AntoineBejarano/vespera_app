import { z } from "zod";

export const importSourceSchema = z.enum([
  "character_card",
  "json",
  "prompt",
  "conversations",
  "description",
  "sillytavern",
  "manual",
]);

export type ImportSource = z.infer<typeof importSourceSchema>;

export type ImportedCharacterDraft = {
  name: string;
  tagline: string;
  openingLine: string;
  categories: string[];
  personality: string;
  relationshipType: string;
  style: string;
  boundaries: string;
  scenario: string;
  soulMd: string;
  styleMd: string;
  rulesMd: string;
  contextMd: string;
  intensity: number;
  source: ImportSource;
  warnings: string[];
};

const tavernDataSchema = z
  .object({
    name: z.string().optional(),
    description: z.string().optional(),
    personality: z.string().optional(),
    scenario: z.string().optional(),
    first_mes: z.string().optional(),
    mes_example: z.string().optional(),
    creator_notes: z.string().optional(),
    system_prompt: z.string().optional(),
    post_history_instructions: z.string().optional(),
    tags: z.array(z.string()).optional(),
    character_book: z.unknown().optional(),
  })
  .passthrough();

const characterCardSchema = z
  .object({
    spec: z.string().optional(),
    spec_version: z.string().optional(),
    data: tavernDataSchema.optional(),
    name: z.string().optional(),
    description: z.string().optional(),
    personality: z.string().optional(),
    scenario: z.string().optional(),
    first_mes: z.string().optional(),
    mes_example: z.string().optional(),
  })
  .passthrough();

function clip(text: string, max: number) {
  const t = text.replace(/\s+/g, " ").trim();
  return t.length > max ? `${t.slice(0, max - 1)}…` : t;
}

function buildLayers(input: {
  name: string;
  description: string;
  personality: string;
  scenario: string;
  examples: string;
  system: string;
  post: string;
  notes: string;
}): Pick<
  ImportedCharacterDraft,
  "soulMd" | "styleMd" | "rulesMd" | "contextMd"
> {
  const { name, description, personality, scenario, examples, system, post, notes } =
    input;

  return {
    soulMd: `# Soul — ${name}\n\n${description || personality || `${name} is an imported character awaiting refinement.`}\n\n## Personality\n${personality || "To be shaped in conversation."}`,
    styleMd: `# Style — ${name}\n\n${examples || system || "Speak in a consistent voice matching the character description. Prefer natural chat cadence."}`,
    rulesMd: `# Rules — ${name}\n\n${post || notes || "Stay in character. Respect user boundaries."}\n\n- Only adults (18+).\n- No sexual content involving minors.\n- Do not claim to be a real living person without clear fiction framing.`,
    contextMd: `# Context — ${name}\n\n${scenario || notes || "Imported character context."}`,
  };
}

function fromTavernLike(
  data: z.infer<typeof tavernDataSchema>,
  source: ImportSource,
  warnings: string[],
): ImportedCharacterDraft {
  const name = (data.name || "Imported Character").trim().slice(0, 80);
  const description = data.description?.trim() || "";
  const personality = data.personality?.trim() || description;
  const scenario = data.scenario?.trim() || "";
  const layers = buildLayers({
    name,
    description,
    personality,
    scenario,
    examples: data.mes_example?.trim() || "",
    system: data.system_prompt?.trim() || "",
    post: data.post_history_instructions?.trim() || "",
    notes: data.creator_notes?.trim() || "",
  });

  if (!description && !personality) {
    warnings.push("Little personality text found — refine after import.");
  }

  return {
    name,
    tagline: clip(personality || description || `An imported character named ${name}.`, 140),
    openingLine: (data.first_mes || `Hi — I'm ${name}.`).trim().slice(0, 500),
    categories: (data.tags || []).slice(0, 8),
    personality: personality || description || name,
    relationshipType: "companion",
    style: clip(personality || "natural conversational voice", 280),
    boundaries: data.post_history_instructions?.trim() || "Adults 18+ only.",
    scenario,
    ...layers,
    intensity: 3,
    source,
    warnings,
  };
}

/** Parse Character Card / SillyTavern / generic JSON / freeform prompt. */
export function parseCharacterImport(
  raw: string,
  sourceHint?: ImportSource,
): ImportedCharacterDraft {
  const warnings: string[] = [];
  const trimmed = raw.trim();
  if (!trimmed) {
    throw new Error("Paste a character card, JSON, prompt, or description.");
  }

  // JSON path
  if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
    let json: unknown;
    try {
      json = JSON.parse(trimmed);
    } catch {
      throw new Error("JSON looks invalid. Check the paste and try again.");
    }

    if (Array.isArray(json)) {
      warnings.push("Array import detected — using the first object.");
      json = json[0];
    }

    const card = characterCardSchema.safeParse(json);
    if (card.success) {
      const data = card.data.data ?? card.data;
      const source: ImportSource =
        sourceHint === "sillytavern" ||
        card.data.spec?.toLowerCase().includes("chara")
          ? sourceHint === "sillytavern"
            ? "sillytavern"
            : "character_card"
          : sourceHint === "json"
            ? "json"
            : "character_card";
      return fromTavernLike(tavernDataSchema.parse(data), source, warnings);
    }

    const obj = json as Record<string, unknown>;
    const name = String(obj.name ?? obj.character_name ?? "Imported Character");
    const personality = String(
      obj.personality ?? obj.description ?? obj.prompt ?? "",
    );
    return fromTavernLike(
      {
        name,
        description: String(obj.description ?? ""),
        personality,
        scenario: String(obj.scenario ?? obj.background ?? ""),
        first_mes: String(obj.first_mes ?? obj.greeting ?? obj.openingLine ?? ""),
        mes_example: String(obj.mes_example ?? obj.example_dialogue ?? ""),
        system_prompt: String(obj.system_prompt ?? obj.system ?? ""),
        post_history_instructions: String(
          obj.post_history_instructions ?? obj.rules ?? "",
        ),
        creator_notes: String(obj.creator_notes ?? obj.notes ?? ""),
        tags: Array.isArray(obj.tags)
          ? obj.tags.map(String)
          : Array.isArray(obj.categories)
            ? obj.categories.map(String)
            : [],
      },
      sourceHint ?? "json",
      warnings,
    );
  }

  // Conversation export heuristic
  if (
    sourceHint === "conversations" ||
    /^(user|assistant|human|ai|you|char)\s*:/im.test(trimmed)
  ) {
    warnings.push(
      "Conversation import reconstructs personality from dialogue — review carefully.",
    );
    const nameMatch = trimmed.match(/(?:char|character|name)\s*[:=]\s*(.+)/i);
    const name = (nameMatch?.[1] || "Imported Character").trim().slice(0, 80);
    const layers = buildLayers({
      name,
      description: `Reconstructed from conversation export.\n\n${clip(trimmed, 2500)}`,
      personality: clip(trimmed, 1200),
      scenario: "Continue from imported conversation history.",
      examples: clip(trimmed, 2000),
      system: "",
      post: "Stay consistent with the imported dialogue voice.",
      notes: "",
    });
    return {
      name,
      tagline: "Reconstructed from conversation history.",
      openingLine: `Hey — picking up where we left off.`,
      categories: [],
      personality: clip(trimmed, 800),
      relationshipType: "companion",
      style: "Match the voice from the imported conversations.",
      boundaries: "Adults 18+ only. Only import content you have rights to use.",
      scenario: "",
      ...layers,
      intensity: 3,
      source: "conversations",
      warnings,
    };
  }

  // Freeform prompt / description / manual
  const lines = trimmed.split(/\n+/);
  const maybeName = lines[0]?.replace(/^#+\s*/, "").trim() || "Imported Character";
  const name =
    maybeName.length <= 48 && !maybeName.includes(".")
      ? maybeName
      : "Imported Character";
  const body = name === "Imported Character" ? trimmed : lines.slice(1).join("\n").trim() || trimmed;

  const layers = buildLayers({
    name,
    description: body,
    personality: clip(body, 1200),
    scenario: "",
    examples: "",
    system: body,
    post: "",
    notes: "",
  });

  return {
    name,
    tagline: clip(body, 140),
    openingLine: `Hi — I'm ${name}.`,
    categories: [],
    personality: clip(body, 800),
    relationshipType: "companion",
    style: "Natural, consistent with the provided description.",
    boundaries: "Adults 18+ only. Only import content you created or may use.",
    scenario: "",
    ...layers,
    intensity: 3,
    source: sourceHint ?? "prompt",
    warnings,
  };
}

export const importRequestSchema = z.object({
  raw: z.string().min(1).max(200_000),
  source: importSourceSchema.optional(),
  permissionConfirmed: z.literal(true),
  nameOverride: z.string().min(1).max(80).optional(),
  intensity: z.number().int().min(1).max(5).optional(),
});
