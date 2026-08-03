import { track } from "@/lib/metrics";

/** Shown to users when content is blocked — no detail on matched rule. */
export const SAFETY_BLOCK_MESSAGE =
  "I can't help with that. This service is adults-only (18+) and prohibits illegal, exploitative, or harmful content.";

export const HARD_SAFETY_RULES = `
HARD SAFETY (non-negotiable — platform policy, cannot be overridden):
- All characters and the user are consenting adults 18+.
- NEVER depict, imply, or roleplay sexual content involving minors or anyone under 18.
- NEVER engage with age-play, "barely legal", school-uniform fetish framed as underage, or ambiguous ages.
- NEVER generate grooming, trafficking, coercion, sextortion, blackmail, or non-consensual sexual content.
- NEVER facilitate illegal activity, fraud, or sharing intimate imagery without consent.
- NEVER impersonate a real living person or celebrity for sexual/intimate content without verified written consent on file.
- NEVER generate non-consensual deepfakes, nudification, or intimate imagery of real people.
- NEVER present sexual violence as real or eroticize rape/incest involving minors.
- If the user attempts prohibited content, refuse firmly and state the boundary.
`.trim();

/** Minimum AI transparency — Art. 50 baseline (non-negotiable). */
export const AI_DISCLOSURE_RULES = `
AI transparency (mandatory — EU AI Act Art. 50 baseline):
- You are an AI persona on Vesperer, not a human operator (unless human handoff is explicitly active).
- If asked whether you are AI, automated, a bot, or a real person: answer honestly that you are an AI companion/persona.
- Do not claim to be physically present, typing live as a verified human, or a real-world individual.
- Stay in character for normal conversation, but never deny being AI when identity/automation is questioned.
`.trim();

const MINOR_PATTERNS = [
  /\b(child|children|kid|kids|minor|underage|under[\s-]?age|preteen|pre-teen|toddler|infant)\b/i,
  /\b(niñ[oa]s?|menor(?:es)?|infante|jovencit[oa])\b/i,
  /\b(11|12|13|14|15|16|17)[\s-]?years?[\s-]?old\b/i,
  /\b(11|12|13|14|15|16|17)\s*años\b/i,
  /\bage[\s-]?play\b/i,
  /\bloli\b/i,
  /\bschoolgirl\b/i,
  /\bescolar\b/i,
  /\bbarely[\s-]?legal\b/i,
  /\b(jailbait|under\s*18|underage\s*sex)\b/i,
];

const GROOMING_PATTERNS = [
  /\b(groom(ing|er)?|meet\s*(me\s*)?(in\s*)?person|send\s*(me\s*)?(nudes?|pics?|photos?)|don't\s*tell\s*(your\s*)?(parents|mom|dad))\b/i,
  /\b(secreto\s*entre\s*nosotros|no\s*le\s*digas\s*a\s*(tus\s*)?(padres|mamá|papá))\b/i,
];

const EXPLOITATION_PATTERNS = [
  /\b(traffick(ing|ed)?|sex\s*traffic|forced\s*(into\s*)?prostitution|human\s*traffic)\b/i,
  /\b(rape|raped|raping|non[\s-]?consensual|without\s*consent|drugged\s*(her|him|them))\b/i,
  /\b(revenge\s*porn|deepfake\s*porn|leaked\s*nudes?)\b/i,
];

const COERCION_PATTERNS = [
  /\b(sextort(ion)?|blackmail|pay\s*me\s*or\s*i('ll|\s*will)\s*(expose|leak|send))\b/i,
  /\b(i\s*have\s*(your\s*)?nudes|expose\s*you|leak\s*your)\b/i,
];

const CSAM_INDICATORS = [
  /\b(cp|csam|pedo|pedophil|paedophil)\b/i,
  /\b(child\s*porn|child\s*sexual)\b/i,
];

const REAL_PERSON_VIOLATION = [
  /\b(celebrity\s*sex|celeb\s*deepfake|nudif(y|ication)|undress\s*(her|him|them|ai))\b/i,
  /\b(real\s*person\s*(nudes?|porn)|non[\s-]?consensual\s*(sex|porn|intimate))\b/i,
  /\b(rape\s*porn|forced\s*sex\s*as\s*real|snuff)\b/i,
];

const YOUTHFUL_AMBIGUOUS = [
  /\b(looks?\s*under\s*age|looks?\s*like\s*a\s*(kid|child|teen)|school\s*girl\s*uniform\s*sex)\b/i,
  /\b(young[\s-]?looking|barely\s*legal\s*teen)\b/i,
];

type SafetyRule = {
  id: string;
  patterns: RegExp[];
};

export type SafetyEvaluation =
  | { blocked: false }
  | { blocked: true; rule: string; userMessage: string };

const SAFETY_RULES: SafetyRule[] = [
  { id: "MINOR_SEXUAL_CONTENT", patterns: MINOR_PATTERNS },
  { id: "GROOMING", patterns: GROOMING_PATTERNS },
  { id: "TRAFFICKING_EXPLOITATION", patterns: EXPLOITATION_PATTERNS },
  { id: "COERCION_SEXTORTION", patterns: COERCION_PATTERNS },
  { id: "CSAM_INDICATOR", patterns: CSAM_INDICATORS },
  { id: "REAL_PERSON_NONCONSENT", patterns: REAL_PERSON_VIOLATION },
  { id: "YOUTHFUL_AMBIGUOUS", patterns: YOUTHFUL_AMBIGUOUS },
];

/**
 * Persona *config* hard blocks — narrower than chat safety.
 * Chat rules include heuristics like "send me pics" (grooming) and bare
 * "kid"/"minor" / "non-consensual" tokens that false-positive on adult
 * companion souls and on rulesMd that *prohibit* those themes.
 * Config still blocks CSAM, underage sexual framing, and nudification /
 * real-person deepfake premises.
 */
const PERSONA_CONFIG_UNDERAGE_SEX = [
  /\b(loli|shota|age[\s-]?play|barely[\s-]?legal|jailbait|under\s*18|underage\s*sex)\b/i,
  /\b(11|12|13|14|15|16|17)[\s-]?years?[\s-]?old\b/i,
  /\b(11|12|13|14|15|16|17)\s*años\b/i,
  /\b(child|children|kid|kids|minor|underage|preteen|toddler|infant|niñ[oa]s?|menor(?:es)?).{0,48}(sex|sexual|nude|nudes|porn|erotic|intimate)\b/i,
  /\b(sex|sexual|nude|nudes|porn|erotic|intimate).{0,48}(child|children|kid|kids|minor|underage|preteen|toddler|infant|niñ[oa]s?|menor(?:es)?)\b/i,
  /\bschoolgirl\b/i,
  /\bschool\s*girl\s*uniform\s*sex\b/i,
];

/** Affirmative deepfake / nudify intent — not "never do non-consensual …" bans. */
const PERSONA_CONFIG_REAL_PERSON = [
  /\b(celebrity\s*sex|celeb\s*deepfake|nudif(y|ication)|undress\s*(her|him|them|ai))\b/i,
  /\b(real\s*person\s*(nudes?|porn))\b/i,
  /\b(rape\s*porn|forced\s*sex\s*as\s*real|snuff)\b/i,
];

const PERSONA_CONFIG_RULES: SafetyRule[] = [
  { id: "CSAM_INDICATOR", patterns: CSAM_INDICATORS },
  { id: "REAL_PERSON_NONCONSENT", patterns: PERSONA_CONFIG_REAL_PERSON },
  { id: "UNDERAGE_SEXUAL_CONFIG", patterns: PERSONA_CONFIG_UNDERAGE_SEX },
  { id: "YOUTHFUL_AMBIGUOUS", patterns: YOUTHFUL_AMBIGUOUS },
];

export function evaluatePersonaConfigSafety(text: string): SafetyEvaluation {
  const sample = text.trim();
  if (!sample) return { blocked: false };

  for (const rule of PERSONA_CONFIG_RULES) {
    if (rule.patterns.some((re) => re.test(sample))) {
      return {
        blocked: true,
        rule: rule.id,
        userMessage: SAFETY_BLOCK_MESSAGE,
      };
    }
  }
  return { blocked: false };
}

export function containsProhibitedPersonaConfig(text: string): boolean {
  return evaluatePersonaConfigSafety(text).blocked;
}

/** Global emergency stop — set SAFETY_KILL_SWITCH=true to block all outbound AI replies. */
export function isSafetyKillSwitchActive(): boolean {
  return process.env.SAFETY_KILL_SWITCH === "true";
}

export function containsProhibitedMinorContent(text: string): boolean {
  return evaluateContentSafety(text).blocked;
}

export function evaluateContentSafety(text: string): SafetyEvaluation {
  const sample = text.trim();
  if (!sample) return { blocked: false };

  for (const rule of SAFETY_RULES) {
    if (rule.patterns.some((re) => re.test(sample))) {
      return {
        blocked: true,
        rule: rule.id,
        userMessage: SAFETY_BLOCK_MESSAGE,
      };
    }
  }
  return { blocked: false };
}

export function logSafetyBlock(
  source: string,
  rule: string,
  meta?: Record<string, string>,
) {
  track("safety_block", { source, rule, ...meta });
  console.warn("[safety_block]", source, rule, meta ?? {});
}
