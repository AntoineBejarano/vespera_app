import { genericUrlAdapter } from "@/lib/knowledge/adapters/generic-url";
import { gutenbergAdapter } from "@/lib/knowledge/adapters/gutenberg";
import { huggingfaceAdapter } from "@/lib/knowledge/adapters/huggingface";
import { mediawikiAdapter } from "@/lib/knowledge/adapters/mediawiki";
import { objectStorageAdapter } from "@/lib/knowledge/adapters/object-storage";
import type { SourceAdapter } from "@/lib/knowledge/adapters/types";
import { AdapterError } from "@/lib/knowledge/adapters/types";
import { userOwnedAdapter } from "@/lib/knowledge/adapters/user-owned";
import type { KnowledgeProvider } from "@/lib/knowledge/types";

const adapters: Record<KnowledgeProvider, SourceAdapter> = {
  generic_url: genericUrlAdapter,
  huggingface: huggingfaceAdapter,
  gutenberg: gutenbergAdapter,
  mediawiki: mediawikiAdapter,
  object_storage: objectStorageAdapter,
  user_owned: userOwnedAdapter,
};

export function getAdapter(provider: string): SourceAdapter {
  const adapter = adapters[provider as KnowledgeProvider];
  if (!adapter) {
    throw new AdapterError(`Unknown knowledge provider: ${provider}`, false, "unknown_provider");
  }
  return adapter;
}

export function listProviders(): KnowledgeProvider[] {
  return Object.keys(adapters) as KnowledgeProvider[];
}

export function providerMeta() {
  return [
    {
      id: "generic_url" as const,
      label: "URL / File",
      description: "HTML, PDF, TXT, Markdown, JSON/JSONL, CSV, EPUB, or uploaded file",
    },
    {
      id: "huggingface" as const,
      label: "Hugging Face Dataset",
      description: "datasetId, split, revision, streaming rows, configurable columns",
    },
    {
      id: "gutenberg" as const,
      label: "Project Gutenberg",
      description: "Ebook ID via official download URLs / RDF catalog",
    },
    {
      id: "mediawiki" as const,
      label: "MediaWiki / Wikisource",
      description: "Host + page title via Action API; optional subpages",
    },
    {
      id: "object_storage" as const,
      label: "Object storage snapshot",
      description: "R2/S3 object key — original file kept as snapshot",
    },
    {
      id: "user_owned" as const,
      label: "User-owned content",
      description: "Character card, prompt, JSON, conversation export, or manual text",
    },
  ];
}
