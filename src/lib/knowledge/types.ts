import { z } from "zod";

/** Provider ids — extend via adapters/registry, not hardcoding ingest logic. */
export const KNOWLEDGE_PROVIDERS = [
  "generic_url",
  "huggingface",
  "gutenberg",
  "mediawiki",
  "object_storage",
  "user_owned",
] as const;

export type KnowledgeProvider = (typeof KNOWLEDGE_PROVIDERS)[number];

export const SOURCE_STATUSES = [
  "pending",
  "inspecting",
  "ready",
  "ingesting",
  "indexed",
  "failed",
  "cancelled",
  "disabled",
] as const;

export type SourceStatus = (typeof SOURCE_STATUSES)[number];

export const JOB_STATUSES = [
  "queued",
  "running",
  "succeeded",
  "failed",
  "cancelled",
] as const;

export type JobStatus = (typeof JOB_STATUSES)[number];

export const JOB_KINDS = [
  "ingest",
  "reindex",
  "delete_source_vectors",
] as const;

export type JobKind = (typeof JOB_KINDS)[number];

export const SOURCE_TYPES = [
  "book",
  "dialogue",
  "article",
  "dataset_row",
  "webpage",
  "file",
  "character_card",
  "prompt",
  "conversation",
  "manual",
  "other",
] as const;

export type SourceType = (typeof SOURCE_TYPES)[number];

/** Metadata stored on every Upstash Vector chunk (filterable). */
export type KnowledgeChunkMetadata = {
  knowledgePackId: string;
  sourceId: string;
  provider: KnowledgeProvider | string;
  canonicalUrl: string;
  author: string;
  work: string;
  section: string;
  speaker: string;
  language: string;
  sourceType: SourceType | string;
  license: string;
  contentHash: string;
  /** Discriminator vs persona memories in the shared index */
  kind: "knowledge";
};

export type NormalizedDocument = {
  externalId: string;
  title: string;
  text: string;
  canonicalUrl?: string;
  author?: string;
  work?: string;
  section?: string;
  speaker?: string;
  language?: string;
  sourceType?: SourceType | string;
  license?: string;
  metadata?: Record<string, unknown>;
};

export type SourceProvenance = {
  license?: string;
  attribution?: string;
  publisher?: string;
  notes?: string;
  homepage?: string;
  termsUrl?: string;
};

export type SourceInspection = {
  externalId: string;
  canonicalUrl?: string;
  datasetRevision?: string;
  checksum: string;
  license?: string;
  language?: string;
  documentCount?: number;
  sampleTitles?: string[];
  provenance: SourceProvenance;
  /** True when checksum matches a previously indexed revision */
  unchanged?: boolean;
};

export type FetchDocumentsResult = {
  documents: NormalizedDocument[];
  /** Opaque cursor for streaming / pagination */
  nextCursor?: unknown;
  done: boolean;
  datasetRevision?: string;
  checksum?: string;
};

export type KnowledgeChunk = {
  id: string;
  text: string;
  metadata: KnowledgeChunkMetadata;
};

export const ingestLimits = {
  maxDocumentBytes: 8 * 1024 * 1024,
  maxDocumentsPerSource: 5_000,
  maxChunksPerSource: 50_000,
  chunkSizeChars: 1_200,
  chunkOverlapChars: 150,
  upsertBatchSize: 32,
  fetchBatchSize: 50,
  maxJobAttempts: 3,
} as const;

export const genericUrlConfigSchema = z.object({
  url: z.string().url().optional(),
  /** Relative or absolute path when content is already uploaded */
  objectKey: z.string().optional(),
  format: z
    .enum(["auto", "html", "pdf", "txt", "markdown", "json", "jsonl", "csv", "epub"])
    .default("auto"),
  textColumn: z.string().optional(),
  titleColumn: z.string().optional(),
});

export const huggingfaceConfigSchema = z.object({
  datasetId: z.string().min(1),
  config: z.string().optional(),
  split: z.string().default("train"),
  revision: z.string().optional(),
  streaming: z.boolean().default(true),
  textColumn: z.string().min(1),
  titleColumn: z.string().optional(),
  metadataColumns: z.array(z.string()).default([]),
  /** Simple equality filters: { column: value } */
  filters: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])).optional(),
  limit: z.number().int().positive().max(ingestLimits.maxDocumentsPerSource).optional(),
});

export const gutenbergConfigSchema = z.object({
  ebookId: z.union([z.string(), z.number()]).transform(String),
  format: z.enum(["txt", "html"]).default("txt"),
  language: z.string().default("en"),
});

export const mediawikiConfigSchema = z.object({
  host: z.string().min(1),
  pageTitle: z.string().min(1),
  language: z.string().optional(),
  includeSubpages: z.boolean().default(false),
});

export const objectStorageConfigSchema = z.object({
  objectKey: z.string().min(1),
  contentType: z.string().optional(),
  originalFilename: z.string().optional(),
  format: z
    .enum(["auto", "html", "pdf", "txt", "markdown", "json", "jsonl", "csv", "epub"])
    .default("auto"),
});

export const userOwnedConfigSchema = z.object({
  kind: z.enum([
    "character_card",
    "prompt",
    "json",
    "conversation",
    "manual",
  ]),
  /** Inline user-owned content (never fetched remotely at chat time) */
  content: z.string().min(1),
  title: z.string().optional(),
  author: z.string().optional(),
  language: z.string().default("en"),
});

export type GenericUrlConfig = z.infer<typeof genericUrlConfigSchema>;
export type HuggingFaceConfig = z.infer<typeof huggingfaceConfigSchema>;
export type GutenbergConfig = z.infer<typeof gutenbergConfigSchema>;
export type MediawikiConfig = z.infer<typeof mediawikiConfigSchema>;
export type ObjectStorageConfig = z.infer<typeof objectStorageConfigSchema>;
export type UserOwnedConfig = z.infer<typeof userOwnedConfigSchema>;
