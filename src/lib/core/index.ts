export { CONTEXT_ENVELOPE_VERSION } from "@/lib/core/types";
export type {
  ContextEnvelope,
  ReasoningChannel,
  ReasoningMode,
  ReasoningResult,
  ProposedRelationshipUpdate,
  RelationshipStage,
} from "@/lib/core/types";

export {
  assertExternalRuntimeAllowed,
  denyAdultEnvelope,
  isAdultPersonaBlockedFromExternal,
  RuntimeIsolationError,
} from "@/lib/core/isolation";

export { resolveIdentity, linkIdentities, resolveSubject } from "@/lib/core/identity";
export {
  getRelationship,
  applyProposedRelationshipUpdate,
  ensureRelationshipState,
} from "@/lib/core/relationship";
export { getPersonaContext } from "@/lib/core/persona";
export {
  ensureConversation,
  resumeConversation,
  getConversationContext,
} from "@/lib/core/conversation";
export { buildContextEnvelope, stripInternalFields } from "@/lib/core/continuity";
export { recordInteraction } from "@/lib/core/interaction";
export {
  isAllowedStageTransition,
  parseRelationshipStage,
  RELATIONSHIP_STAGES,
} from "@/lib/core/stages";
export { parseCapabilitiesJson } from "@/lib/core/capabilities";
export type { PersonaCapabilities } from "@/lib/core/capabilities";
