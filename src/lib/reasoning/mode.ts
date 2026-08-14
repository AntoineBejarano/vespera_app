import { isAdultPersonaBlockedFromExternal } from "@/lib/core/isolation";
import type { ReasoningMode } from "@/lib/core/types";

export function resolveReasoningMode(character: {
  isAdult?: boolean | null;
  reasoningMode?: string | null;
}): ReasoningMode {
  if (isAdultPersonaBlockedFromExternal(character)) return "native";
  return character.reasoningMode === "external" ? "external" : "native";
}
