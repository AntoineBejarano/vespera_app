import "server-only";

type Mem0Message = {
  role: "user" | "assistant" | "system";
  content: string;
};

type Mem0AddResponse = {
  event_id?: string;
  status?: "PENDING" | "SUCCEEDED" | "FAILED";
};

type Mem0SearchResult = {
  id: string;
  memory: string;
  score?: number;
  metadata?: Record<string, unknown>;
  categories?: string[];
  created_at?: string;
  updated_at?: string | null;
};

type Mem0SearchResponse = {
  results?: Mem0SearchResult[];
};

const DEFAULT_BASE_URL = "https://api.mem0.ai";
const DEFAULT_TIMEOUT_MS = 5000;

function getMem0Config() {
  const apiKey = process.env.MEM0_API_KEY?.trim();
  if (!apiKey) return null;

  return {
    apiKey,
    baseUrl:
      process.env.MEM0_BASE_URL?.replace(/\/+$/, "") || DEFAULT_BASE_URL,
    timeoutMs: Number(process.env.MEM0_TIMEOUT_MS || DEFAULT_TIMEOUT_MS),
  };
}

async function mem0Request<T>(path: string, body: Record<string, unknown>) {
  const config = getMem0Config();
  if (!config) return null;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), config.timeoutMs);

  try {
    const response = await fetch(`${config.baseUrl}${path}`, {
      method: "POST",
      headers: {
        Authorization: `Token ${config.apiKey}`,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    if (!response.ok) {
      const message = await response.text().catch(() => "");
      throw new Error(
        `Mem0 ${response.status}: ${message.slice(0, 240) || response.statusText}`,
      );
    }

    return (await response.json()) as T;
  } finally {
    clearTimeout(timeout);
  }
}

function mem0UserId(subjectId: string) {
  return `vesperer_subject_${subjectId}`;
}

function mem0AgentId(characterId: string) {
  return `vesperer_character_${characterId}`;
}

export async function addTurnToMem0(params: {
  subjectId: string;
  characterId: string;
  conversationId: string;
  userMessage: string;
  assistantMessage: string;
}) {
  if (!getMem0Config()) return null;

  try {
    const messages: Mem0Message[] = [
      { role: "user", content: params.userMessage },
      { role: "assistant", content: params.assistantMessage },
    ];

    return await mem0Request<Mem0AddResponse>("/v3/memories/add/", {
      user_id: mem0UserId(params.subjectId),
      agent_id: mem0AgentId(params.characterId),
      run_id: params.conversationId,
      messages,
      enable_graph: process.env.MEM0_ENABLE_GRAPH !== "false",
      custom_instructions:
        "Extract durable preferences, facts, relationship context, promises, names, limits, and emotional continuity. Do not store trivial filler or detailed explicit sexual content.",
      metadata: {
        source: "vesperer_post_turn",
        subjectId: params.subjectId,
        characterId: params.characterId,
        conversationId: params.conversationId,
      },
    });
  } catch (error) {
    console.error("[mem0/add]", error);
    return null;
  }
}

export async function searchMem0Memories(params: {
  subjectId: string;
  characterId: string;
  query: string;
  topK?: number;
}) {
  if (!getMem0Config()) return [];

  try {
    const response = await mem0Request<Mem0SearchResponse>(
      "/v3/memories/search/",
      {
        query: params.query,
        filters: {
          AND: [
            { user_id: mem0UserId(params.subjectId) },
            { agent_id: mem0AgentId(params.characterId) },
          ],
        },
        top_k: params.topK ?? 6,
        rerank: process.env.MEM0_RERANK === "true",
      },
    );

    return (response?.results ?? [])
      .filter((result) => result.memory?.trim())
      .map((result) => ({
        id: result.id,
        content: result.memory.trim(),
        score: result.score,
        categories: result.categories ?? [],
      }));
  } catch (error) {
    console.error("[mem0/search]", error);
    return [];
  }
}
