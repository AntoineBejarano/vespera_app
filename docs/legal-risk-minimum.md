# Protección legal mínima — Vesperer

**No es asesoría legal.** Reduce riesgo operativo; revisa con abogado antes de escalar.

## Qué hace hoy el código

| Control | Dónde |
|---------|--------|
| Bloqueo input/output (menores, grooming, explotación, coerción, CSAM, real-person/non-consent) | `src/lib/ai/safety.ts` |
| Content policy runtime (deny-by-default adult delivery) | `src/lib/content-policy/` |
| After Dark partner approval auditada | `AdultWorkspaceApproval` + `POST /api/admin/workspaces/[id]/adult` |
| Kill switch | `SAFETY_KILL_SWITCH=true` |
| Transparencia IA Art. 50 baseline | prompts + UI + Telegram `/about` + `/start` |
| After Dark público | Landing invite-only → `partners@vesperer.com` |
| Denuncias | `/report` → `ABUSE_EMAIL` |

## Principio After Dark

> **Aprobación de workspace = configurar capacidades adultas. Nunca autoriza sola la entrega adulta a un usuario final.**

Hasta HEAA: sin companions adultos públicos, sin Telegram adulto al consumidor, sin imágenes explícitas públicas.

## Ops: habilitar partner

1. Contacto en `partners@vesperer.com`
2. Superadmin: `POST /api/admin/workspaces/:id/adult` con `{ "action": "approve", "reason": "…" }`
3. Revocar: `{ "action": "revoke", "reason": "…" }` (invalida `adultEnabled` + quita `isAdult` público)

Tenants **no** pueden auto-activar `adultEnabled` (403 `ADULT_SELF_ENABLE_FORBIDDEN`).

## Capa plataforma vs operador

| Vesperer | Partner / operador |
|----------|-------------------|
| Policy runtime, safety, Terms | Audiencia y canales propios |
| Partner approval | Contratos / HEAA cuando haya delivery |
| AI disclosure en producto | Notices en sus superficies |

**Deevly Labs LTD** — Company No. **16506991**  
**Vesperer** — producto (`vesperer.com` / `xxx.vesperer.com`)
