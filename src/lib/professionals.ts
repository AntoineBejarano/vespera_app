export const PROFESSIONAL_CATEGORY_LABELS = [
  "teacher",
  "teachers",
  "professor",
  "professors",
  "coach",
  "coaches",
  "mentor",
  "mentors",
  "advisor",
  "advisors",
  "consultant",
  "consultants",
  "expert",
  "experts",
  "education",
  "professional",
  "professionals",
] as const;

export function isProfessionalPersona(categories: string[]) {
  const normalized = new Set(
    categories.map((category) => category.trim().toLowerCase()),
  );
  return PROFESSIONAL_CATEGORY_LABELS.some((category) =>
    normalized.has(category),
  );
}

export function professionalRole(categories: string[]) {
  const normalized = categories.map((category) => category.trim().toLowerCase());
  if (normalized.some((item) => ["teacher", "teachers", "professor", "professors", "education"].includes(item))) return "Professor";
  if (normalized.some((item) => item === "coach" || item === "coaches")) return "Coach";
  if (normalized.some((item) => item === "mentor" || item === "mentors")) return "Mentor";
  if (normalized.some((item) => ["advisor", "advisors", "consultant", "consultants"].includes(item))) return "Advisor";
  return "Professional";
}
