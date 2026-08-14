import { z } from "zod";

export const personaCapabilitySchema = z.object({
  id: z.string().min(1).max(80),
  kind: z.string().min(1).max(40),
  enabled: z.boolean().default(true),
});

export const capabilitiesJsonSchema = z.object({
  items: z.array(personaCapabilitySchema).max(32).default([]),
});

export type PersonaCapabilities = z.infer<typeof capabilitiesJsonSchema>;

export function parseCapabilitiesJson(raw: unknown): PersonaCapabilities {
  const parsed = capabilitiesJsonSchema.safeParse(raw ?? { items: [] });
  return parsed.success ? parsed.data : { items: [] };
}
