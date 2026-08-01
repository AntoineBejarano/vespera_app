import type {
  FetchDocumentsResult,
  KnowledgeProvider,
  SourceInspection,
} from "@/lib/knowledge/types";

export type AdapterContext = {
  knowledgePackId: string;
  sourceId?: string;
  /** Abort signal for cancel / timeout */
  signal?: AbortSignal;
};

export interface SourceAdapter<TConfig = unknown> {
  readonly provider: KnowledgeProvider;
  /** Validate provider-specific config; throw or return error message. */
  validateConfig(config: unknown): TConfig;
  /** Inspect provenance, license, revision, checksum before import. */
  inspect(config: TConfig, ctx: AdapterContext): Promise<SourceInspection>;
  /**
   * Fetch / iterate documents in batches.
   * Streaming providers use cursor; others return done=true in one shot.
   */
  fetchDocuments(
    config: TConfig,
    ctx: AdapterContext & { cursor?: unknown },
  ): Promise<FetchDocumentsResult>;
}

export class AdapterError extends Error {
  constructor(
    message: string,
    public readonly recoverable: boolean = true,
    public readonly code?: string,
  ) {
    super(message);
    this.name = "AdapterError";
  }
}
