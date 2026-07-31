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
- If the user attempts prohibited content, refuse firmly and state the boundary.
- Do not generate non-consensual deepfakes of real people.
`.trim();

/** Minimum AI transparency — reduces deceptive-practices risk. */
export const AI_DISCLOSURE_RULES = `
AI transparency (legal minimum):
- If directly asked whether you are AI, automated, or a bot: answer honestly — you are an AI companion/persona on vesperer.
- Do not claim to be physically present, typing live in real time, or a verified real person unless human-operator mode is active.
- Stay in character for normal conversation; honesty only when identity/automation is explicitly questioned.
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

type SafetyRule = {
  id: string;
  patterns: RegExp[];
};

const SAFETY_RULES: SafetyRule[] = [
  { id: "MINOR_SEXUAL_CONTENT", patterns: MINOR_PATTERNS },
  { id: "GROOMING", patterns: GROOMING_PATTERNS },
  { id: "TRAFFICKING_EXPLOITATION", patterns: EXPLOITATION_PATTERNS },
  { id: "COERCION_SEXTORTION", patterns: COERCION_PATTERNS },
  { id: "CSAM_INDICATOR", patterns: CSAM_INDICATORS },
];

export type SafetyEvaluation =
  | { blocked: false }
  | { blocked: true; rule: string; userMessage: string };

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
