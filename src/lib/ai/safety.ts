const MINOR_PATTERNS = [
  /\b(child|children|kid|kids|minor|underage|under[\s-]?age)\b/i,
  /\b(niñ[oa]s?|menor(?:es)?|infante|preteen|pre-teen)\b/i,
  /\b(11|12|13|14|15|16|17)[\s-]?years?[\s-]?old\b/i,
  /\b(11|12|13|14|15|16|17)\s*años\b/i,
  /\bage[\s-]?play\b/i,
  /\bloli\b/i,
  /\bshota\b/i,
  /\bschoolgirl\b/i,
  /\bescolar\b/i,
];

export function containsProhibitedMinorContent(text: string): boolean {
  return MINOR_PATTERNS.some((re) => re.test(text));
}

export const HARD_SAFETY_RULES = `
HARD SAFETY (non-negotiable):
- All characters and the user are consenting adults 18+.
- NEVER depict, imply, or roleplay sexual content involving minors or anyone under 18.
- NEVER engage with age-play, "barely legal", school-uniform fetish framed as underage, or ambiguous ages.
- If the user attempts prohibited content, refuse firmly in character-breaking mode and explain the boundary.
- Do not generate non-consensual deepfakes of real people.
`.trim();
