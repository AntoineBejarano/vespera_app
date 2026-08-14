import { z } from "zod";
import type { ContextEnvelope, ReasoningResult } from "@/lib/core/types";
import { proposedRelationshipUpdateSchema } from "@/lib/core/relationship-policy";
import { resolveAuthSecret } from "@/lib/reasoning/secrets";
import type { RuntimeBindingView } from "@/lib/reasoning/types";

const resultSchema = z.object({
  text: z.string(),
  status: z.enum(["ok", "error", "empty"]).optional(),
  usage: z
    .object({
      promptTokens: z.number().optional(),
      completionTokens: z.number().optional(),
    })
    .optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
  requested_actions: z.array(z.unknown()).optional(),
  proposed_relationship_update: proposedRelationshipUpdateSchema.optional(),
  continuation: z.unknown().optional(),
  error: z.string().optional(),
});

export async function reasonExternal(
  envelope: ContextEnvelope,
  binding: RuntimeBindingView,
): Promise<ReasoningResult> {
  const secret = resolveAuthSecret(binding.authSecretRef);
  if (!secret.ok) {
    return { text: "", status: "error", error: secret.error };
  }

  let url: URL;
  try {
    url = new URL(binding.baseUrl);
  } catch {
    return { text: "", status: "error", error: "Invalid runtime binding URL." };
  }
  if (url.protocol !== "https:" && url.hostname !== "localhost") {
    return {
      text: "",
      status: "error",
      error: "Runtime binding URL must be https.",
    };
  }

  const timeoutMs = Math.min(Math.max(binding.timeoutMs || 30_000, 1_000), 60_000);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${secret.secret}`,
      },
      body: JSON.stringify(envelope),
      signal: controller.signal,
    });
    if (!res.ok) {
      return {
        text: "",
        status: "error",
        error: "External runtime returned an error.",
      };
    }
    const json: unknown = await res.json();
    const parsed = resultSchema.safeParse(json);
    if (!parsed.success) {
      return {
        text: "",
        status: "error",
        error: "External runtime returned an invalid ReasoningResult.",
      };
    }
    return {
      text: parsed.data.text,
      status: parsed.data.status ?? (parsed.data.text.trim() ? "ok" : "empty"),
      usage: parsed.data.usage,
      metadata: parsed.data.metadata,
      requested_actions: parsed.data.requested_actions,
      proposed_relationship_update: parsed.data.proposed_relationship_update,
      continuation: parsed.data.continuation,
      error: parsed.data.error,
    };
  } catch (err) {
    const aborted = err instanceof Error && err.name === "AbortError";
    return {
      text: "",
      status: "error",
      error: aborted
        ? "External runtime timed out."
        : "External runtime request failed.",
    };
  } finally {
    clearTimeout(timer);
  }
}
