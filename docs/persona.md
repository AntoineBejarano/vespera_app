# Persona architecture (Meuxe-inspired)

Vespera adopts Meuxe’s **layered companion** idea, adapted for a multi-tenant web app on Railway.

## Meuxe on disk → Vespera in Postgres

| Meuxe (`companion-home/`) | Vespera |
|---------------------------|---------|
| `persona/{id}/soul.md` | `Character.soulMd` |
| `persona/{id}/style.md` | `Character.styleMd` |
| `persona/{id}/rules.md` | `Character.rulesMd` |
| `persona/{id}/context.md` | `Character.contextMd` |
| `persona/{id}/character.yaml` | `Character.metaJson` |
| `relationship/{id}.md` | `RelationshipState` (+ rendered at assemble time) |
| `memory/brief.md` | Upstash Vector / Postgres retrieval → injected brief |
| `journal/` | Future (not in MVP) |
| filesystem workspace | Not used (ephemeral containers) |

Canonical storage is **Postgres**, not local files — same mental model, portable across users/servers.

## Prompt assembly order

1. Runtime + hard safety + human-like style rules  
2. Soul (budget)  
3. Style (budget)  
4. Rules (budget)  
5. Context (budget, light)  
6. Relationship state (mood / trust / affection / energy)  
7. Memory brief  
8. Session summary  
9. Turn rules  

Code: `src/lib/persona/assemble.ts`

## Generation

Onboarding → `generatePersonaLayers()` writes all markdown layers + meta + legacy `identityJson` for UI compat.

## Relationship evolution

After each assistant turn, `maybeUpdateRelationship()` nudges trust/affection/energy/mood (small deltas).
