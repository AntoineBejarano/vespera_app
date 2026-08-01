import type { SourceAdapter } from "@/lib/knowledge/adapters/types";
import { AdapterError } from "@/lib/knowledge/adapters/types";
import { reproducibleChecksum, sha256Hex } from "@/lib/knowledge/checksum";
import { normalizeDocumentText } from "@/lib/knowledge/normalize";
import {
  userOwnedConfigSchema,
  type NormalizedDocument,
  type UserOwnedConfig,
} from "@/lib/knowledge/types";

/**
 * Generic importer for content the user already owns.
 * Supports Character Card / prompt / JSON / exported conversation / manual description.
 * Does NOT integrate with Chai AI or any third-party character marketplace.
 */

function extractFromCharacterCard(raw: string): NormalizedDocument {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return {
      externalId: "character_card",
      title: "Character card",
      text: normalizeDocumentText(raw),
      sourceType: "character_card",
    };
  }
  const root = parsed as Record<string, unknown>;
  const data =
    (root.data as Record<string, unknown> | undefined) ??
    (root.character as Record<string, unknown> | undefined) ??
    root;
  const name =
    (typeof data.name === "string" && data.name) ||
    (typeof root.name === "string" && root.name) ||
    "Character card";
  const parts = [
    typeof data.description === "string" ? data.description : "",
    typeof data.personality === "string" ? data.personality : "",
    typeof data.scenario === "string" ? data.scenario : "",
    typeof data.first_mes === "string" ? data.first_mes : "",
    typeof data.mes_example === "string" ? data.mes_example : "",
    typeof data.system_prompt === "string" ? data.system_prompt : "",
    typeof data.creator_notes === "string" ? data.creator_notes : "",
  ].filter(Boolean);
  return {
    externalId: `character_card:${name}`,
    title: name,
    text: normalizeDocumentText(parts.join("\n\n") || JSON.stringify(data, null, 2)),
    author: typeof data.creator === "string" ? data.creator : undefined,
    sourceType: "character_card",
  };
}

function extractConversation(raw: string): NormalizedDocument[] {
  try {
    const parsed = JSON.parse(raw) as unknown;
    const messages = Array.isArray(parsed)
      ? parsed
      : Array.isArray((parsed as { messages?: unknown }).messages)
        ? ((parsed as { messages: unknown[] }).messages)
        : null;
    if (!messages) {
      return [
        {
          externalId: "conversation",
          title: "Exported conversation",
          text: normalizeDocumentText(raw),
          sourceType: "conversation",
        },
      ];
    }
    const lines = messages.map((m, i) => {
      const row = m as Record<string, unknown>;
      const role = String(row.role ?? row.from ?? row.sender ?? "unknown");
      const content = String(row.content ?? row.message ?? row.text ?? "");
      return `[${role}] ${content}`.trim();
    });
    return [
      {
        externalId: "conversation:export",
        title: "Exported conversation",
        text: normalizeDocumentText(lines.join("\n")),
        sourceType: "conversation",
      },
    ];
  } catch {
    return [
      {
        externalId: "conversation",
        title: "Exported conversation",
        text: normalizeDocumentText(raw),
        sourceType: "conversation",
      },
    ];
  }
}

function toDocuments(config: UserOwnedConfig): NormalizedDocument[] {
  switch (config.kind) {
    case "character_card":
      return [extractFromCharacterCard(config.content)];
    case "conversation":
      return extractConversation(config.content);
    case "json": {
      try {
        const parsed = JSON.parse(config.content);
        const text = normalizeDocumentText(JSON.stringify(parsed, null, 2));
        return [
          {
            externalId: "user_json",
            title: config.title || "JSON import",
            text,
            author: config.author,
            language: config.language,
            sourceType: "file",
          },
        ];
      } catch {
        throw new AdapterError("Invalid JSON content", false, "invalid_json");
      }
    }
    case "prompt":
      return [
        {
          externalId: "user_prompt",
          title: config.title || "Prompt",
          text: normalizeDocumentText(config.content),
          author: config.author,
          language: config.language,
          sourceType: "prompt",
        },
      ];
    case "manual":
    default:
      return [
        {
          externalId: "manual",
          title: config.title || "Manual description",
          text: normalizeDocumentText(config.content),
          author: config.author,
          language: config.language,
          sourceType: "manual",
        },
      ];
  }
}

export const userOwnedAdapter: SourceAdapter<UserOwnedConfig> = {
  provider: "user_owned",

  validateConfig(config) {
    const parsed = userOwnedConfigSchema.safeParse(config);
    if (!parsed.success) {
      throw new AdapterError(parsed.error.message, false, "invalid_config");
    }
    return parsed.data;
  },

  async inspect(config) {
    const docs = toDocuments(config);
    const checksum = reproducibleChecksum([
      config.kind,
      sha256Hex(config.content),
      docs.length,
    ]);
    return {
      externalId: `${config.kind}:${checksum.slice(0, 12)}`,
      canonicalUrl: undefined,
      datasetRevision: checksum.slice(0, 16),
      checksum,
      license: "user-owned content",
      language: config.language,
      documentCount: docs.length,
      sampleTitles: docs.map((d) => d.title),
      provenance: {
        license: "user-owned",
        attribution: config.author || "uploader",
        notes:
          "Generic user-owned importer (character card / prompt / JSON / conversation / manual). No third-party marketplace integration.",
      },
    };
  },

  async fetchDocuments(config) {
    const documents = toDocuments(config);
    const checksum = reproducibleChecksum([
      config.kind,
      sha256Hex(config.content),
      documents.length,
    ]);
    return {
      documents,
      done: true,
      datasetRevision: checksum.slice(0, 16),
      checksum,
    };
  },
};
