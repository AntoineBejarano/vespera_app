import type { KnowledgeProvider } from "@/lib/knowledge/types";

/**
 * Seed configuration only — interchangeable without touching the ingest engine.
 * Replace dataset IDs / ebook IDs / page titles here as catalogs evolve.
 */
export type KnowledgePackSeedSource = {
  provider: KnowledgeProvider;
  externalId: string;
  canonicalUrl?: string;
  language?: string;
  config: Record<string, unknown>;
};

export type KnowledgePackSeed = {
  key: string;
  slug: string;
  name: string;
  description: string;
  language: string;
  sources: KnowledgePackSeedSource[];
};

export const PLATO_ESSENTIALS_SEED: KnowledgePackSeed = {
  key: "plato-essentials",
  slug: "plato-essentials",
  name: "Plato Essentials",
  description:
    "Core Platonic dialogues and reference texts from Hugging Face, Project Gutenberg, and Wikisource. Datasets are configuration — swap freely without changing the ingest engine.",
  language: "en",
  sources: [
    {
      provider: "gutenberg",
      externalId: "1497",
      canonicalUrl: "https://www.gutenberg.org/ebooks/1497",
      language: "en",
      config: {
        ebookId: "1497",
        format: "txt",
        language: "en",
      },
    },
    {
      provider: "gutenberg",
      externalId: "1636",
      canonicalUrl: "https://www.gutenberg.org/ebooks/1636",
      language: "en",
      config: {
        ebookId: "1636",
        format: "txt",
        language: "en",
      },
    },
    {
      provider: "mediawiki",
      externalId: "en.wikisource.org:Apology_(Plato)",
      canonicalUrl: "https://en.wikisource.org/wiki/Apology_(Plato)",
      language: "en",
      config: {
        host: "en.wikisource.org",
        pageTitle: "Apology (Plato)",
        language: "en",
        includeSubpages: false,
      },
    },
    {
      // Replace datasetId / columns freely — seed config, not engine logic.
      provider: "huggingface",
      externalId: "pleias/Plato",
      canonicalUrl: "https://huggingface.co/datasets/pleias/Plato",
      language: "en",
      config: {
        datasetId: "pleias/Plato",
        split: "train",
        streaming: true,
        textColumn: "text",
        titleColumn: "title",
        metadataColumns: ["author", "work"],
        limit: 200,
      },
    },
  ],
};
