import { streamText } from "ai";
import { getOpenRouter } from "@/lib/ai/openrouter";
import type { ReasoningResult } from "@/lib/core/types";
import type { NativeReasonInput } from "@/lib/reasoning/types";

/** Vesperer Native: AI SDK + OpenRouter. This is the default product experience. */
export function streamNative(input: NativeReasonInput) {
  const openrouter = getOpenRouter();
  return streamText({
    model: openrouter(input.modelId),
    system: input.system,
    messages: input.messages,
    onFinish: input.onFinish
      ? async ({ text }) => {
          await input.onFinish?.(text);
        }
      : undefined,
  });
}

export async function reasonNative(
  input: NativeReasonInput,
): Promise<ReasoningResult> {
  const result = streamNative(input);
  const text = await result.text;
  return {
    text,
    status: text.trim() ? "ok" : "empty",
  };
}
