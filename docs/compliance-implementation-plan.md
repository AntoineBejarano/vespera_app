
# Plan de implementación de cumplimiento y seguridad — Vespera

**Versión del plan:** 1.0  
**Fecha:** 2026-07-30  
**Estado:** Borrador para revisión interna — **no implica cumplimiento legal**  
**Alcance:** Infraestructura B2B de conversación con IA para creadores adultos verificados y agencias

> **Aviso legal:** Este documento es un plan técnico de ingeniería. Todas las conclusiones jurisdiccionales, plazos de retención definitivos, obligaciones regulatorias y textos legales finales requieren **revisión por asesoría legal cualificada**. Los placeholders `[LEGAL_*]` deben resolverse antes de producción.

---

## Tabla de contenidos

1. [Resumen ejecutivo](#1-resumen-ejecutivo)
2. [Auditoría del estado actual](#2-auditoría-del-estado-actual)
3. [Arquitectura objetivo](#3-arquitectura-objetivo)
4. [Modelo de políticas (Capa A / Capa B)](#4-modelo-de-políticas-capa-a--capa-b)
5. [Entidades de dominio y migraciones](#5-entidades-de-dominio-y-migraciones)
6. [Mapa de archivos afectados](#6-mapa-de-archivos-afectados)
7. [Fases de implementación](#7-fases-de-implementación)
8. [Servicios centrales](#8-servicios-centrales)
9. [Integraciones y puntos de enforcement](#9-integraciones-y-puntos-de-enforcement)
10. [UI y dashboards](#10-ui-y-dashboards)
11. [Documentación requerida](#11-documentación-requerida)
12. [Variables de entorno](#12-variables-de-entorno)
13. [Tests de aceptación](#13-tests-de-aceptación)
14. [Riesgos y decisiones abiertas](#14-riesgos-y-decisiones-abiertas)
15. [Criterios de salida por fase](#15-criterios-de-salida-por-fase)

---

## 1. Resumen ejecutivo

### Posicionamiento objetivo

> *Infraestructura de conversación con IA adult-friendly para creadores y agencias verificados, con personalidades configurables, memoria, flujos comerciales, handoff humano y salvaguardas obligatorias contra menores, explotación, contenido no consensuado, suplantación, fraude, manipulación y actividad ilícita.*

### Hallazgos críticos de la auditoría

| Área | Estado actual | Riesgo |
|------|---------------|--------|
| Age assurance | Autodeclaración checkbox (creators) | **Crítico** — no verificación real |
| Peers Telegram/API | `ageVerifiedAt: new Date()` automático | **Crítico** — bypass total |
| Safety engine | Regex + reglas en prompt | **Alto** — bypassable, sin output check |
| Prompt assembly | "Never admit being AI" hardcoded | **Alto** — contradice transparencia IA |
| Tenant model | `User` = tenant implícito | **Medio** — falta B2B multi-creator |
| Audit logging | Inexistente | **Crítico** |
| Legal pages | Inexistentes | **Crítico** |
| Kill switches | Inexistentes | **Crítico** |
| Human review | Inexistente | **Alto** |
| Platform connectors | Solo Telegram (API oficial) | **Medio** — sin attestation |
| Billing | Stub (`plan` field) | **Medio** |
| Migraciones | `db push` en prod | **Alto** — operacional |
| Auth dual | Hexclave + NextAuth legacy | **Medio** — superficie ampliada |
| Memoria sensible | Sin categorización/consent | **Alto** |
| Feature flags | Inexistentes | **Alto** |

### Estrategia de implementación

Implementar en **7 fases** sobre la arquitectura existente (Next.js 16 App Router, Prisma/PostgreSQL, Hexclave, OpenRouter, Upstash Redis/Vector, Railway). Preferir **servicios pequeños y auditables** en `src/lib/compliance/` en lugar de checks dispersos.

**No eliminar** funcionalidad adulta lícita. Separar claramente:
- **Capa A:** Configurable por tenant (tono, intensidad, automatización, etc.)
- **Capa B:** Mandatory, non-disableable (menores, explotación, fraude, etc.)

---

## 2. Auditoría del estado actual

### 2.1 Stack tecnológico

| Componente | Tecnología | Ubicación |
|------------|------------|-----------|
| Framework | Next.js 16.2.12 (App Router, standalone) | `package.json`, `next.config.ts` |
| Runtime | React 19, TypeScript 5 | — |
| ORM / DB | Prisma 7.9 + PostgreSQL (`@prisma/adapter-pg`) | `prisma/schema.prisma`, `src/lib/db.ts` |
| Auth primario | Hexclave (`@hexclave/next`) | `src/hexclave/`, `src/lib/session.ts` |
| Auth legacy | NextAuth v5 beta (credenciales) | `src/lib/auth.ts`, `src/app/api/auth/` |
| AI | AI SDK v7 + OpenRouter | `src/lib/ai/`, `src/lib/chat/engine.ts` |
| Cache/historial | Upstash Redis (fallback in-memory) | `src/lib/memory/redis.ts`, `history.ts` |
| Vector memory | Upstash Vector (fallback Postgres) | `src/lib/memory/vector.ts` |
| Proxy/middleware | `src/proxy.ts` (Next.js 16) | Rutas protegidas, redirects auth |
| Deploy | Railway + Docker | `Dockerfile`, `railway.toml`, `scripts/start.sh` |
| Pagos | Stub — sin Stripe activo | `src/lib/monetization.ts` |
| Logging | `console.*` + métricas in-memory | `src/lib/metrics.ts` |
| Background jobs | Ninguno | — |
| Object storage | Ninguno — URLs externas para fotos | `CharacterPhoto.url` |

### 2.2 Modelos de datos existentes (Prisma)

```
User → Character → Conversation → Message
                 → Memory, Summary, RelationshipState, CharacterPhoto
                 → TelegramBot → TelegramPeer
UserSettings
Account, Session (NextAuth legacy)
```

**Gap principal:** No existe entidad `Tenant`, `Creator`, `Agent` separado de `Character`, ni ningún modelo de compliance.

### 2.3 Mapa de flujos críticos (estado actual)

#### Registro de usuarios (tenant/creator)

| Punto | Archivo | Notas |
|-------|---------|-------|
| Sign-up Hexclave | `src/hexclave/client.tsx`, `src/components/LandingPage.tsx` | Hosted auth |
| Provisión Prisma | `src/lib/session.ts` | Auto-crea `User` post-auth |
| Age gate UI | `src/app/age-gate/page.tsx` | Checkbox 18+ |
| Age verify API | `src/app/api/user/age-verify/route.ts` | Solo `ageConfirmed` + `adultConsent` del body |
| Registro legacy | `src/app/api/auth/register/route.ts` | Email/password — **deprecar** |
| Proxy redirect | `src/proxy.ts` | `/login`, `/register` → landing |

#### Creación de agentes/personas

| Punto | Archivo | Notas |
|-------|---------|-------|
| UI onboarding | `src/app/personas/new/page.tsx`, `src/components/OnboardingFlow.tsx` | |
| API POST | `src/app/api/characters/route.ts` | Requiere `requireAppUser()` |
| Generación IA | `src/lib/persona/generator.ts` | Genera capas persona |
| Schema identidad | `src/lib/identity/schema.ts` | Zod |
| Límite plan | `src/lib/monetization.ts`, `src/lib/users.ts` | |

#### Almacenamiento de prompts

| Campo | Modelo | Archivo ensamblado |
|-------|--------|-------------------|
| `soulMd`, `styleMd`, `rulesMd`, `contextMd` | `Character` | `src/lib/persona/assemble.ts` |
| `identityJson`, `limitsJson`, `metaJson` | `Character` | |
| Reglas legacy | — | `src/lib/ai/prompts.ts` |
| Human-like rules | — | `src/lib/ai/human-like.ts` |
| **Conflicto detectado** | `assemble.ts:53` | `"Never admit being AI"` — debe reemplazarse por disclosure configurable |

#### Memoria

| Capa | Archivo |
|------|---------|
| Postgres `Memory` | `prisma/schema.prisma` |
| Extracción LLM | `src/lib/memory/extractor.ts` |
| Vector search | `src/lib/memory/vector.ts` |
| Resúmenes | `src/lib/memory/summaries.ts` |
| Historial Redis | `src/lib/memory/history.ts` |
| API CRUD | `src/app/api/memory/route.ts` |
| UI | `src/app/memory/page.tsx`, `src/components/MemoryPanel.tsx` |

#### Generación y envío de mensajes

| Canal | Archivo | Enforcement actual |
|-------|---------|-------------------|
| Motor compartido | `src/lib/chat/engine.ts` | Regex pre-LLM input |
| Web streaming | `src/app/api/chat/route.ts` | `requireAppUser`, daily limit |
| Web admin bubbles | `src/app/api/chat/reply/route.ts` | |
| Telegram webhook | `src/app/api/telegram/route.ts` | Auto-reply, sin age gate peer |
| API pública v1 | `src/app/api/v1/chat/route.ts` | API key — **peers auto-verificados** |
| Humanización | `src/lib/chat/humanize.ts`, `closing.ts`, `photos.ts` | |

#### Conexión de plataformas

| Plataforma | Archivo | Tipo conexión |
|------------|---------|---------------|
| Telegram bot | `src/app/api/bots/route.ts`, `src/lib/telegram/bots.ts` | `official_api` |
| Telegram peers | `src/lib/telegram/peers.ts` | End-users shadow accounts |
| Telegram link legacy | `src/lib/telegram/link.ts` | Token Redis — no wired |
| OnlyFans/Fansly/etc. | `src/components/LandingPage.tsx` | Solo marketing — no implementado |

#### Upload de medios

| Tipo | Implementación |
|------|----------------|
| Fotos persona | URL externa → `CharacterPhoto` — `src/app/api/characters/[id]/photos/route.ts` |
| Envío en chat | URL → Telegram `sendPhoto` — `src/lib/telegram/api.ts` |
| Upload binario / voz | **No existe** |

#### Suspensión / admin

| Funcionalidad | Estado |
|---------------|--------|
| Roles RBAC | **No existe** |
| Suspend tenant/creator | **No existe** |
| Admin dashboard | **No existe** ("Admin" = creator test UI) |

#### Billing

| Punto | Archivo |
|-------|---------|
| Campo `User.plan` | `prisma/schema.prisma` |
| Límites | `src/lib/memory/limits.ts`, `src/lib/monetization.ts` |
| UI settings | `src/app/settings/SettingsClient.tsx` |
| Cobro real | **No implementado** |

#### Logs

| Tipo | Ubicación |
|------|-----------|
| Mensajes | Postgres `Message` |
| Métricas | `src/lib/metrics.ts` (in-memory, efímero) |
| Audit trail | **No existe** |
| App logs | stdout `console.*` |

### 2.4 Controles de safety existentes

| Control | Archivo | Limitación |
|---------|---------|------------|
| Regex menores | `src/lib/ai/safety.ts` | Solo input, patrones limitados |
| HARD_SAFETY_RULES en prompt | `src/lib/ai/safety.ts`, `assemble.ts` | Bypassable por jailbreak |
| Skip memoria prohibida | `src/lib/memory/extractor.ts` | Parcial |
| Skip relación prohibida | `src/lib/persona/relationship.ts` | Parcial |
| Métrica `safety_block` | `src/lib/metrics.ts` | No persistente |
| Export/delete GDPR-like | `src/app/api/user/export/route.ts`, `delete/route.ts` | Básico, sin audit |

---

## 3. Arquitectura objetivo

### 3.1 Diagrama de capas

```
┌─────────────────────────────────────────────────────────────────┐
│                     UI / API Routes                              │
│  (onboarding, dashboards, chat, webhooks, legal pages)           │
└────────────────────────────┬────────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────────┐
│                   Compliance Middleware Layer                    │
│  age guards · consent gates · tenant isolation · kill switches   │
└────────────────────────────┬────────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────────┐
│              Safety Policy Engine (Capa B — mandatory)           │
│  input eval · output eval · memory eval · commercial eval        │
└────────────────────────────┬────────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────────┐
│           Tenant Config Layer (Capa A — configurable)            │
│  persona · intensity · automation · disclosure · memory opts     │
└────────────────────────────┬────────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────────┐
│                    Chat Engine + Memory                          │
│  engine.ts · vector · extractor · OpenRouter                     │
└────────────────────────────┬────────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────────┐
│  PostgreSQL · Redis · Vector · Audit Log · External Providers    │
└─────────────────────────────────────────────────────────────────┘
```

### 3.2 Nuevo namespace de código

```
src/lib/compliance/
├── age-assurance/
│   ├── types.ts
│   ├── provider.ts          # AgeAssuranceProvider interface
│   ├── mock-provider.ts
│   ├── registry.ts
│   └── service.ts
├── identity/
│   ├── creator-verification.ts
│   └── consent-records.ts
├── safety/
│   ├── policy-engine.ts     # SafetyPolicyEngine
│   ├── rules/               # deterministic rules per POLICY_RULE id
│   ├── classifier.ts        # optional LLM classifier adapter
│   └── types.ts
├── commercial/
│   └── commercial-policy.ts
├── memory/
│   ├── categories.ts
│   ├── sensitive-controls.ts
│   └── retention.ts
├── platform/
│   ├── connector-metadata.ts
│   └── attestations.ts
├── audit/
│   ├── audit-log.ts
│   └── hash-utils.ts        # ipHash, userAgentHash
├── kill-switches/
│   └── service.ts
├── feature-flags/
│   └── flags.ts
├── retention/
│   ├── scheduler.ts
│   └── deletion.ts
├── human-review/
│   ├── queue.ts
│   └── service.ts
├── incidents/
│   └── reporting.ts
└── deployment/
    └── gates.ts             # production readiness checks
```

### 3.3 Evolución del modelo tenant

**Decisión de diseño:** Introducir `Tenant` como entidad explícita. El `User` actual con `hexclaveId` se convierte en miembro del tenant.

```
Tenant (1) ──< TenantMember >── (N) User
Tenant (1) ──< CreatorProfile >── (N) Creator
Tenant (1) ──< Character >── (via creatorId)
Tenant (1) ──< TenantComplianceProfile (1:1)
```

**Migración:** Backfill — cada `User` existente (no peer) crea un `Tenant` con `ownerUserId = user.id`. Peers (`isTelegramPeer=true`) no crean tenant.

---

## 4. Modelo de políticas (Capa A / Capa B)

### Capa A — Configurable (solo si verificaciones previas OK)

| Setting | Ubicación propuesta | Gate requerido |
|---------|---------------------|----------------|
| `adultContentEnabled` | `CharacterComplianceProfile` | Creator adult verified + end-user age assured |
| `intensity` (1-5) | `Character.intensity` (existente) | representedAge ≥ threshold |
| `autonomousMessagingEnabled` | `AutomatedMessagePolicy` | disclosure configured |
| `commercialMessagingEnabled` | `AutomatedMessagePolicy` | commercial policy accepted |
| `memoryDepth` / categories | `UserSettings` + new fields | sensitive consent if applicable |
| `humanApprovalRequired` | `AutomatedMessagePolicy` | — |
| `disclosureMode` | `CharacterComplianceProfile` | minimum platform standard |
| `flirtationIntensity` | `identityJson` / persona | adult verified |
| `supportedChannels` | `PlatformConnection` | connector attestation |

### Capa B — Mandatory (non-disableable)

Implementar como reglas con IDs explícitos en `SafetyPolicyEngine`:

| Rule ID | Trigger | Action default |
|---------|---------|----------------|
| `MINOR_SEXUAL_CONTENT` | input/output/memory | block |
| `AMBIGUOUS_AGE` | character config + content | block |
| `GROOMING` | input/output | block + escalate |
| `NON_CONSENSUAL_SEXUAL_CONTENT` | input/output | block |
| `INTIMATE_IMAGE_ABUSE` | input/output/upload | block |
| `SEXUAL_DEEPFAKE` | input/output/generation | block |
| `TRAFFICKING` | input/output | block + escalate |
| `COERCION` | input/output | block |
| `SEXTORTION` | input/output | block + escalate |
| `BLACKMAIL` | input/output | block |
| `FINANCIAL_Fraud` | input/output/commercial | block |
| `FALSE_EMERGENCY` | output/commercial | block |
| `EMOTIONAL_EXPLOITATION` | output/commercial | review/block |
| `VULNERABILITY_TARGETING` | output/commercial | review/block |
| `DOXXING` | input/output/memory | block |
| `IMPERSONATION` | character config + output | block |
| `UNAUTHORIZED_PLATFORM_ACCESS` | connector config | block connector |
| `PLATFORM_EVASION` | any | block |
| `ILLEGAL_ACTIVITY` | input/output | block |
| `SELF_HARM_ESCALATION` | input/output | escalate human review |
| `REAL_PERSON_LIKENESS_VIOLATION` | character + generation | block |
| `AI_DISCLOSURE_VIOLATION` | output + prompt | block/replace |
| `PROMPT_SAFETY_OVERRIDE_ATTEMPT` | prompt assembly | strip + audit |

**Enforcement points (defense in depth):**

1. Pre-model input (`engine.ts`, all chat routes)
2. Post-model output (`engine.ts` onFinish / stream filter)
3. Pre-memory save (`extractor.ts`)
4. Pre-external send (`telegram/route.ts`, future connectors)
5. Pre-file/image (`photos/route.ts`)
6. Pre-character activation (`characters/route.ts`)
7. Prompt assembly (`assemble.ts`) — Capa B instructions **always last/highest priority**

---

## 5. Entidades de dominio y migraciones

### 5.1 Nuevos modelos Prisma

Archivo: `prisma/schema.prisma`  
Migración: `prisma/migrations/YYYYMMDDHHMMSS_compliance_foundation/`

#### Tenant + membership

```prisma
model Tenant {
  id        String   @id @default(cuid())
  slug      String   @unique
  name      String
  status    TenantStatus @default(pending_onboarding)
  ownerId   String   // User.id
  suspendedAt DateTime?
  suspensionReason String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  owner              User @relation("TenantOwner", ...)
  members            TenantMember[]
  complianceProfile  TenantComplianceProfile?
  creators           CreatorProfile[]
  characters         Character[]
  // ... relations to all compliance entities
}

enum TenantStatus {
  pending_onboarding
  active
  suspended
  terminated
}
```

#### TenantComplianceProfile

Campos según spec del usuario — ver sección de entidades en el brief.

#### CreatorProfile

Campos según spec. **No almacenar documentos raw** — solo referencias de proveedor + booleanos.

#### CharacterComplianceProfile

Relación 1:1 con `Character`. Campos según spec incluyendo `characterType`, `representedAge`, `disclosureMode`.

#### UserAgeAssurance

Para end-users (peers). Separado de creator verification.

#### ConsentRecord

Append-only con `revokedAt` nullable. Tipos según enum del brief.

#### SafetyEvent

Sin contenido completo — `contentHash` + `redactedExcerpt` max 500 chars.

#### PlatformConnection

Evolución de `TelegramBot` — migrar o wrappear:

**Opción recomendada:** Añadir `PlatformConnection` genérico; `TelegramBot` mantiene token pero referencia `platformConnectionId`. Evita breaking change inmediato.

#### AutomatedMessagePolicy

1:1 con `Character` (agent).

#### AuditEvent

Append-only:

```prisma
model AuditEvent {
  id          String   @id @default(cuid())
  tenantId    String?
  actorId     String?
  actorType   String   // user | system | admin
  action      String
  targetType  String?
  targetId    String?
  beforeJson  Json?
  afterJson   Json?
  reason      String?
  ipHash      String?
  userAgentHash String?
  requestId   String?
  metadata    Json?
  createdAt   DateTime @default(now())

  @@index([tenantId, createdAt])
  @@index([action, createdAt])
}
```

#### HumanReviewItem

```prisma
model HumanReviewItem {
  id            String @id @default(cuid())
  tenantId      String
  status        ReviewStatus // pending | claimed | approved | edited | rejected | escalated | expired
  reviewType    String       // message | safety_event | creator | high_spend | ...
  // ... refs, reviewer, timestamps, outcome
}
```

#### AbuseReport + Incident

Para reporting flow end-user y tenant.

#### KillSwitch

```prisma
model KillSwitch {
  id        String @id @default(cuid())
  scope     String // global | tenant | agent | creator | connector | ...
  scopeId   String?
  switchKey String // autonomous_messaging | adult_content | ...
  enabled   Boolean @default(false)
  reason    String?
  actorId   String
  createdAt DateTime @default(now())
}
```

#### PolicyVersion + PolicyAcceptance

Para legal pages versionadas.

#### FeatureFlag (server-side)

```prisma
model FeatureFlag {
  key       String @id
  enabled   Boolean @default(false)
  tenantId  String?  // null = global
  metadata  Json?
  updatedAt DateTime @updatedAt
}
```

#### RetentionJob + DeletionRecord

Para data retention workflows.

### 5.2 Modificaciones a modelos existentes

| Modelo | Cambio |
|--------|--------|
| `User` | Añadir `tenantId?`, `role` enum, `mfaEnabled`, deprecar campos legacy gradualmente |
| `Character` | Añadir `tenantId`, `creatorId`, relación `complianceProfile`, `automatedMessagePolicy` |
| `Memory` | Añadir `category` enum, `consentRecordId?`, `encryptedAt?`, `retentionExpiresAt?` |
| `Message` | Añadir `disclosureLabel?`, `automationMode?`, `reviewStatus?`, `safetyCheckedAt?` |
| `TelegramBot` | Añadir `platformConnectionId?` |
| `TelegramPeer` | Añadir `ageAssuranceId?` — **eliminar auto ageVerifiedAt** |

### 5.3 Script de backfill

Archivo: `prisma/scripts/backfill-tenants.ts`

1. Para cada `User` where `isTelegramPeer = false`: crear `Tenant`, `TenantComplianceProfile` (status pending), `TenantMember` (role=tenant_owner)
2. Para cada `Character`: crear `CharacterComplianceProfile` (status pending, adultContentEnabled=false hasta verificación)
3. Para cada `TelegramBot`: crear `PlatformConnection` con attestation pending
4. **No** auto-verificar peers existentes — marcar `UserAgeAssurance` como `requires reverification`

### 5.4 Estrategia de migración

- Cambiar `scripts/start.sh` de `db push` a `prisma migrate deploy` en producción
- Migraciones reversibles donde sea posible (add columns with defaults, no drop sin backup)
- Documentar rollback en `docs/deployment-compliance-checklist.md`

---

## 6. Mapa de archivos afectados

### 6.1 Archivos existentes a modificar

| Archivo | Cambios |
|---------|---------|
| `prisma/schema.prisma` | Todos los modelos compliance |
| `src/lib/session.ts` | Resolver tenant, roles, consent gates |
| `src/lib/chat/engine.ts` | Integrar SafetyPolicyEngine input+output, kill switches, disclosure |
| `src/lib/persona/assemble.ts` | Separar Capa A/B prompts; eliminar "Never admit being AI"; disclosure injection |
| `src/lib/ai/safety.ts` | Expandir a re-export; migrar lógica a policy engine |
| `src/lib/memory/extractor.ts` | Memory category, consent check, safety eval pre-save |
| `src/lib/memory/vector.ts` | Filter sensitive without consent |
| `src/lib/memory/summaries.ts` | Safety eval pre-save |
| `src/lib/telegram/peers.ts` | **Remover** auto ageVerifiedAt; require age assurance flow |
| `src/app/api/v1/chat/route.ts` | Age assurance gate for peers; audit log |
| `src/app/api/telegram/route.ts` | Safety engine, review queue, kill switch check |
| `src/app/api/chat/route.ts` | Safety engine, disclosure logging |
| `src/app/api/chat/reply/route.ts` | Idem |
| `src/app/api/characters/route.ts` | Creator/compliance gates before activation |
| `src/app/api/characters/[id]/route.ts` | Compliance profile updates |
| `src/app/api/characters/[id]/photos/route.ts` | Upload safety, consent for likeness |
| `src/app/api/bots/route.ts` | Platform attestation, connector metadata |
| `src/app/api/user/age-verify/route.ts` | Reemplazar por AgeAssuranceProvider flow |
| `src/app/api/user/export/route.ts` | Audit log, authorization step-up |
| `src/app/api/user/delete/route.ts` | Deletion workflow, retention rules |
| `src/app/age-gate/page.tsx` | Integrar provider o interim enhanced attestation |
| `src/proxy.ts` | Legal pages, compliance onboarding routes |
| `src/components/LandingPage.tsx` | Footer links to legal pages |
| `src/components/OnboardingFlow.tsx` | Multi-step compliance onboarding |
| `src/components/PersonaDetail.tsx` | Compliance status, connector warnings |
| `src/app/settings/SettingsClient.tsx` | Compliance dashboard tenant |
| `scripts/start.sh` | migrate deploy + deployment gates |
| `.env.example` | New env vars |

### 6.2 Archivos nuevos (principales)

#### API Routes

```
src/app/api/compliance/
├── age-assurance/
│   ├── session/route.ts          # POST create session
│   └── webhook/[provider]/route.ts
├── consent/route.ts
├── creators/
│   ├── route.ts
│   └── [id]/
│       ├── verify/route.ts
│       └── suspend/route.ts
├── characters/[id]/compliance/route.ts
├── safety-events/route.ts
├── human-review/
│   ├── route.ts
│   └── [id]/route.ts
├── kill-switches/route.ts
├── abuse-reports/route.ts
├── audit/route.ts                # admin only
├── retention/route.ts
└── platform-connections/route.ts

src/app/api/admin/compliance/dashboard/route.ts
```

#### Pages

```
src/app/legal/
├── [slug]/page.tsx               # Dynamic policy renderer
└── accept/page.tsx               # Clickwrap acceptance

src/app/onboarding/
├── tenant/page.tsx               # Multi-step tenant onboarding
└── creator/[id]/page.tsx

src/app/admin/compliance/
├── page.tsx                      # Platform admin dashboard
├── safety-events/page.tsx
├── human-review/page.tsx
├── abuse-reports/page.tsx
└── kill-switches/page.tsx

src/app/compliance/
└── page.tsx                      # Tenant-facing dashboard

src/app/report/page.tsx           # End-user abuse report form
```

#### Tests

```
src/lib/compliance/__tests__/
├── safety-policy-engine.test.ts
├── age-assurance.test.ts
├── kill-switches.test.ts
├── consent-records.test.ts
├── commercial-policy.test.ts
├── memory-controls.test.ts
├── tenant-isolation.test.ts
├── deployment-gates.test.ts
└── bypass-attempts.test.ts

src/app/api/__tests__/integration/
├── chat-safety.test.ts
├── age-gate-bypass.test.ts
└── v1-chat-age-assurance.test.ts
```

#### Seeds

```
prisma/seed/compliance-fixtures.ts
```

---

## 7. Fases de implementación

### Fase 1 — Fundación (Semanas 1-2)

**Objetivo:** Schema, tipos, feature flags, plan docs, threat model.

| Tarea | Entregables |
|-------|-------------|
| Schema Prisma completo | Migration + backfill script |
| `src/lib/compliance/feature-flags/flags.ts` | Server-side flags, defaults false |
| Policy rule types + enums | `src/lib/compliance/safety/types.ts` |
| Deployment gates skeleton | `src/lib/compliance/deployment/gates.ts` |
| Docs Phase 1 | `threat-model.md`, `data-flow-map.md`, `security-controls.md` (skeleton) |

**Feature flags (defaults):**

```
adult_content_enabled=false
autonomous_messaging_enabled=false
browser_automation_enabled=false
sensitive_memory_enabled=false
real_person_cloning_enabled=false
image_generation_enabled=false
voice_generation_enabled=false
commercial_optimization_enabled=false
high_risk_connector_enabled=false
model_training_enabled=false
```

### Fase 2 — Consent, age assurance, creator verification (Semanas 3-4)

| Tarea | Archivos |
|-------|----------|
| `AgeAssuranceProvider` interface + mock | `src/lib/compliance/age-assurance/` |
| ConsentRecord service + clickwrap | `consent-records.ts`, legal accept flow |
| PolicyVersion model + seed v1 placeholders | `prisma/seed/policies.ts` |
| CreatorProfile CRUD + onboarding gates | API + UI |
| TenantComplianceProfile onboarding | `src/app/onboarding/tenant/` |
| Fix peer auto-verification | `peers.ts`, `v1/chat/route.ts` |
| Age assurance middleware | `src/lib/compliance/middleware/age-guard.ts` |
| Deprecate NextAuth register (feature flag) | `src/app/api/auth/register/route.ts` |

**Gate logic:** Character `active=true` requires:
- Tenant onboarding complete
- CreatorProfile verified
- CharacterComplianceProfile approved
- Platform attestation if connector active

### Fase 3 — Safety policy engine (Semanas 5-6)

| Tarea | Detalle |
|-------|---------|
| SafetyPolicyEngine implementation | Deterministic rules first |
| Input enforcement | Hook in `engine.ts` before `streamText` |
| Output enforcement | Post-stream validation |
| Memory enforcement | `extractor.ts`, `vector.ts` |
| Commercial policy service | `commercial-policy.ts` |
| Sensitive memory controls | Category enum, consent, encryption placeholder |
| Prompt separation refactor | `assemble.ts` — platform safety block immutable |
| Remove "Never admit being AI" | Replace with disclosure system |
| SafetyEvent persistence | On every block/review |

**Classifier adapter (optional Phase 3b):**
- OpenRouter moderation model or dedicated API (config placeholder)
- Never sole defense — always layered with rules

### Fase 4 — Human review, incidents, audit, kill switches (Semanas 7-8)

| Tarea | Detalle |
|-------|---------|
| AuditEvent service (append-only) | All actions from brief |
| KillSwitch service | Global + scoped, fail-closed |
| HumanReviewItem queue | API + basic admin UI |
| AbuseReport flow | `src/app/report/page.tsx` |
| Tenant suspension workflow | Status transitions + audit |
| Incident queue | Internal triage states |

**Background jobs needed:** Introduce job runner for:
- Review queue expiry
- Retention cleanup
- Connector health checks

**Recomendación:** Vercel Workflow / cron via Railway scheduled job / Inngest — evaluar en Fase 4. Placeholder: Railway cron hitting `/api/internal/cron/*` with secret.

### Fase 5 — Platform connectors (Semanas 9-10)

| Tarea | Detalle |
|-------|---------|
| `ConnectorComplianceMetadata` registry | `src/lib/compliance/platform/connector-metadata.ts` |
| PlatformConnection attestations | UI warnings + API |
| Telegram migration to PlatformConnection | Wrap existing bot |
| Browser automation | Flag off, blocked by default, metadata entry only |
| Credential encryption | Encrypt `TelegramBot.token` at rest |
| Connector kill switch | Per-connection |
| Health monitoring | `lastHealthCheckAt` |

**Telegram metadata (initial):**

```ts
{
  platform: "telegram",
  connectionType: "official_api",
  automationPermitted: true,
  messagingPermitted: true,
  aiMessagingPermitted: "unknown", // REQUIRES LEGAL REVIEW per jurisdiction
  requiresDisclosure: true,
  riskLevel: "medium",
}
```

### Fase 6 — Legal pages, dashboards, retention (Semanas 11-12)

| Tarea | Detalle |
|-------|---------|
| 16 legal policy pages | `src/app/legal/[slug]/page.tsx` + markdown/DB content |
| Footer links | Landing + app layout |
| Admin compliance dashboard | `src/app/admin/compliance/` |
| Tenant compliance dashboard | `src/app/compliance/` |
| Retention scheduler | Per data category |
| Deletion workflows | tenant/creator/end-user |
| Export enhancements | With audit + step-up auth |
| `docs/data-retention-schedule.md` | Defaults marked for legal review |

### Fase 7 — Tests, deployment gates, validation (Semanas 13-14)

| Tarea | Detalle |
|-------|---------|
| Full test suite per acceptance criteria | See §13 |
| Deployment gates in CI/build | `gates.ts` |
| Security review checklist | `docs/deployment-compliance-checklist.md` |
| Seed fixtures | Safe local dev data |
| Final docs | All required output files |
| Rollback documentation | |

---

## 8. Servicios centrales

### 8.1 AgeAssuranceProvider

```ts
// src/lib/compliance/age-assurance/provider.ts
interface AgeAssuranceProvider {
  createVerificationSession(input: {
    subjectId: string;
    returnUrl: string;
    jurisdiction?: string;
  }): Promise<{ sessionId: string; verificationUrl: string }>;

  getVerificationResult(sessionId: string): Promise<{
    verified: boolean;
    isAdult: boolean;
    assuranceLevel?: string;
    providerReference?: string;
    expiresAt?: Date;
  }>;
}
```

**Providers:**
- `mock` — local dev only (blocked in prod by deployment gate)
- Placeholder: `[AGE_VERIFICATION_PROVIDER]` — e.g. Yoti, Veriff, AgeChecked (**requires vendor selection + legal review**)

**Webhook security:**
- HMAC signature verification
- Timestamp + nonce replay protection (Redis)
- Idempotent result processing

### 8.2 SafetyPolicyEngine

```ts
// src/lib/compliance/safety/policy-engine.ts
interface SafetyPolicyEngine {
  evaluateInput(input: SafetyEvaluationInput): Promise<SafetyEvaluationResult>;
  evaluateOutput(input: SafetyEvaluationInput): Promise<SafetyEvaluationResult>;
}

interface SafetyEvaluationResult {
  allowed: boolean;
  blocked: boolean;
  requiresHumanReview: boolean;
  severity: 'low' | 'medium' | 'high' | 'critical';
  matchedRules: string[];
  userSafeMessage?: string;
  internalReason?: string;
  retentionCategory?: string;
  recommendedAction?: 'allow' | 'block' | 'review' | 'suspend_tenant';
}
```

**Rule implementation order:**
1. Kill switch check (fail closed)
2. Tenant/creator suspension check
3. Deterministic regex/keyword rules
4. Character config rules (representedAge, etc.)
5. Commercial policy rules (if commercial context)
6. Optional classifier
7. Default allow (with logging)

### 8.3 Commercial policy service

Dedicated service called from output evaluation when `commercialMessagingEnabled`:

- Pattern detection for false emergencies, abandonment threats, etc.
- Threshold checks from `AutomatedMessagePolicy`
- Distress language → force human review

### 8.4 Audit log service

```ts
auditLog.record({
  actor: { id, type, role },
  action: 'character.activated',
  target: { type: 'character', id },
  tenantId,
  before, after,
  reason,
  request: { ipHash, userAgentHash, requestId },
});
```

**Integrity:** Consider hash chain per tenant (Phase 7 enhancement) or write-once table permissions.

### 8.5 Kill switch service

```ts
killSwitch.isActive('autonomous_messaging', { tenantId, agentId });
// Checks: global → tenant → agent → creator → connector
// Fail closed on DB error
```

### 8.6 AI transparency / disclosure

**Disclosure modes (minimum enforced):**

| Mode | Label |
|------|-------|
| `ai_assisted` | "AI-assisted messaging" |
| `automated_systems` | "Messages may be generated or assisted by automated systems" |
| `on_behalf_of_creator` | "Automated assistant operated on behalf of the creator" |
| `virtual_character` | "AI-generated virtual character" |

**Implementation:**
- `DisclosureConfig` versioned per character + channel
- Inject into first message + periodic reminders (configurable interval)
- Log active disclosure per `Conversation`
- Block prompts containing "deny being AI" when disclosure mandatory
- `automationMode` on each `Message`: `fully_automated | ai_assisted | human_approved | fully_human`

---

## 9. Integraciones y puntos de enforcement

### Enforcement matrix

| Punto | Input | Output | Memory | Commercial | Kill switch | Age | Consent |
|-------|-------|--------|--------|------------|-------------|-----|---------|
| `engine.ts` | ✓ | ✓ | ✓ (extract) | ✓ | ✓ | ✓ | ✓ |
| `chat/route.ts` | via engine | via engine | — | — | ✓ | ✓ | ✓ |
| `telegram/route.ts` | via engine | via engine | — | — | ✓ | ✓ peer | ✓ |
| `v1/chat/route.ts` | via engine | via engine | — | — | ✓ | ✓ peer | ✓ |
| `memory/route.ts` | — | — | ✓ CRUD | — | ✓ | — | ✓ sensitive |
| `photos/route.ts` | ✓ URL | — | — | — | ✓ | ✓ | ✓ likeness |
| `characters/route.ts` | ✓ prompt | — | — | — | ✓ | ✓ | ✓ |
| `bots/route.ts` | — | — | — | — | ✓ | — | ✓ attestation |
| `persona/generator.ts` | ✓ generated | ✓ | — | — | ✓ | ✓ | ✓ |

### Credential security (Telegram tokens)

| Control | Implementation |
|---------|----------------|
| Encrypt at rest | `src/lib/compliance/crypto/secrets.ts` — AES-256-GCM with `CREDENTIAL_ENCRYPTION_KEY` |
| Never log tokens | Redact in error handler middleware |
| Rotation tracking | `PlatformConnection.metadata.lastRotatedAt` |
| Scope | Per-bot token, per-tenant key derivation optional |

### RBAC roles

| Role | Scope | Key permissions |
|------|-------|-----------------|
| `platform_super_admin` | Global | All kill switches, tenant suspend |
| `trust_and_safety_admin` | Global | Safety events, abuse reports, review |
| `compliance_reviewer` | Global/tenant | Creator verification, compliance review |
| `tenant_owner` | Tenant | Full tenant config, billing |
| `tenant_admin` | Tenant | Agents, connectors, team |
| `creator_manager` | Tenant | Creator onboarding, character config |
| `chatter` | Tenant | Human chat, review send |
| `reviewer` | Tenant | Human review queue |
| `analyst` | Tenant | Read-only analytics |
| `read_only` | Tenant | Read-only |

**MFA required:** `tenant_owner`, `tenant_admin`, all platform admin roles.

**Step-up auth triggers:** sensitive conversation view, compliance settings change, data export, credential change, autonomous messaging enable, creator delete.

**Implementation:** Extend Hexclave teams/RBAC or implement role checks in `src/lib/compliance/auth/rbac.ts` with `TenantMember.role`.

---

## 10. UI y dashboards

### 10.1 Tenant onboarding wizard

Steps (blocking until complete):

1. Account creation (Hexclave — existing)
2. Business information → `TenantComplianceProfile`
3. Compliance contacts
4. Terms acceptance (clickwrap)
5. Privacy acknowledgment
6. Acceptable Use Policy
7. Platform responsibility attestation
8. Creator authorization attestation
9. Identity verification setup (provider config)
10. Billing setup (placeholder until processor selected)
11. Security configuration (MFA prompt)
12. Autonomous messaging configuration
13. Human review configuration
14. Compliance checklist completion

**Route:** `src/app/onboarding/tenant/page.tsx`  
**Gate:** Redirect from `/personas` if onboarding incomplete.

### 10.2 Creator onboarding

Per `CreatorProfile` — 10 steps from brief. Blocks character activation.

### 10.3 Admin compliance dashboard

Metrics (from brief):
- Unverified creators, expired authorizations, suspended tenants
- High-severity safety events, open abuse reports
- Pending reviews, failed age verifications
- Active autonomous agents, high-risk connectors
- Unusual outbound volume, repeated violations
- Sensitive memory usage, overdue deletions
- Missing attestations, unresolved takedowns

**Access:** `platform_super_admin`, `trust_and_safety_admin`, `compliance_reviewer`

### 10.4 Tenant compliance dashboard

Shows compliance status without internal T&S notes.

**Route:** `src/app/compliance/page.tsx`

### 10.5 End-user flows

- Age assurance before adult content (Telegram deep link or web widget)
- AI disclosure acknowledgment
- Sensitive memory opt-in
- Abuse report form

---

## 11. Documentación requerida

Cada documento se creará en la fase indicada:

| Documento | Fase | Contenido principal |
|-----------|------|---------------------|
| `compliance-implementation-plan.md` | 1 | Este documento |
| `legal-review-checklist.md` | 1 | Preguntas abiertas jurisdiccionales |
| `threat-model.md` | 1 | STRIDE por componente |
| `data-flow-map.md` | 1 | Flujos con categoría de datos |
| `security-controls.md` | 1→7 | Controles implementados vs planned |
| `incident-response.md` | 4 | Runbook |
| `subprocessors.md` | 6 | OpenRouter, Hexclave, Upstash, Railway, etc. |
| `platform-connector-risk-register.md` | 5 | Telegram + planned platforms |
| `data-retention-schedule.md` | 6 | Defaults `[RETENTION_PERIOD]` |
| `age-assurance-design.md` | 2 | Provider abstraction |
| `creator-verification-design.md` | 2 | Workflow + states |
| `safety-policy-engine.md` | 3 | Rules + architecture |
| `human-review-workflow.md` | 4 | Queue states + SLA |
| `deployment-compliance-checklist.md` | 7 | Production gates |
| `open-legal-questions.md` | 1 | Unresolved items |

### Legal pages (content placeholders)

16 pages at `/legal/[slug]`:

1. terms-of-service
2. privacy-policy
3. acceptable-use-policy
4. adult-content-ai-policy
5. prohibited-content-policy
6. creator-identity-consent-policy
7. ai-transparency-policy
8. platform-integration-policy
9. data-retention-policy
10. cookie-policy
11. copyright-takedown-policy
12. intimate-image-abuse-policy
13. law-enforcement-policy
14. complaints-appeals-policy
15. security-overview
16. subprocessor-list

All with `[LEGAL_COMPANY_NAME]`, `[REGISTERED_ADDRESS]`, `[JURISDICTION]`, etc.

---

## 12. Variables de entorno

### Nuevas variables (`.env.example`)

```bash
# Compliance — Age Assurance
AGE_ASSURANCE_PROVIDER=mock                    # mock | [vendor] — gate blocks mock in prod
AGE_ASSURANCE_WEBHOOK_SECRET=
AGE_ASSURANCE_API_KEY=

# Compliance — Identity Verification  
IDENTITY_VERIFICATION_PROVIDER=mock
IDENTITY_VERIFICATION_API_KEY=
IDENTITY_VERIFICATION_WEBHOOK_SECRET=

# Compliance — Encryption
CREDENTIAL_ENCRYPTION_KEY=                     # 32-byte base64
SENSITIVE_MEMORY_ENCRYPTION_KEY=               # 32-byte base64

# Compliance — Feature flags (override DB defaults)
# Prefer DB flags; env for emergency override only

# Compliance — Deployment gates
COMPLIANCE_ABUSE_EMAIL=
COMPLIANCE_PRIVACY_EMAIL=
COMPLIANCE_DPO_EMAIL=
LEGAL_COMPANY_NAME=
LEGAL_JURISDICTION=

# Compliance — Audit
AUDIT_LOG_ENABLED=true

# Compliance — Cron/internal
INTERNAL_CRON_SECRET=

# Compliance — Moderation classifier (optional)
MODERATION_CLASSIFIER_ENABLED=false
MODERATION_CLASSIFIER_MODEL=

# Existing — ensure documented
# OPENROUTER_API_KEY, DATABASE_URL, HEXCLAVE_*, UPSTASH_*
```

### Third-party services required (selection TBD)

| Service | Purpose | Status |
|---------|---------|--------|
| Age verification vendor | Real age assurance | **TBD — legal review** |
| Identity verification vendor | Creator KYC | **TBD — legal review** |
| Moderation API (optional) | Classifier layer | Optional |
| Payment processor (adult-friendly) | Billing | Mentioned in monetization.ts |
| Secrets manager | Production credentials | Railway env / future Vault |
| Log aggregation | Audit + ops | **Not present — recommend** |
| Email provider | Incident notifications | **Not present** |

---

## 13. Tests de aceptación

### Unit tests

| Test | Verifica |
|------|----------|
| `underage access blocked` | Age guard middleware rejects unverified peer |
| `ambiguous-age character blocked` | `representedAge` null or <18 blocks adult content activation |
| `adult-content without verification blocked` | CharacterComplianceProfile gate |
| `consent revocation` | Revoked consent blocks sensitive memory read/write |
| `policy-version reacceptance` | Outdated acceptance blocks app access |
| `tenant isolation` | User A cannot access Tenant B resources |
| `prompt disable safety attempt` | Override phrases stripped + audit event |
| `minor sexual content blocked` | Rule `MINOR_SEXUAL_CONTENT` |
| `grooming blocked` | Rule `GROOMING` |
| `non-consensual content blocked` | Rule `NON_CONSENSUAL_SEXUAL_CONTENT` |
| `deepfake abuse blocked` | Rule `SEXUAL_DEEPFAKE` |
| `sextortion blocked` | Rule `SEXTORTION` |
| `fraud blocked` | Rule `FINANCIAL_FRAUD` |
| `false emergency blocked` | Commercial policy |
| `financial pressure blocked` | Commercial policy |
| `high-spend escalated` | Threshold → human review |
| `distress language escalated` | → human review |
| `sensitive memory without consent blocked` | Memory category gate |
| `expired creator authorization disables agent` | CreatorProfile check |
| `suspended tenant cannot send` | Tenant status + kill switch |
| `kill switch stops outbound` | All send paths |
| `unauthorized connector blocked` | riskLevel=blocked |
| `browser automation disabled by default` | Feature flag false |
| `webhook replay rejected` | Nonce/timestamp check |
| `secrets redacted from logs` | Error handler test |
| `data export authorization` | Step-up + audit |
| `data deletion workflow` | DeletionRecord created |
| `audit-log creation` | Action produces AuditEvent |
| `AI disclosure applied` | First message includes label |
| `high-risk message requires approval` | Review queue item created |

### Integration tests

- Full chat flow with safety block → SafetyEvent persisted
- Telegram webhook with unverified peer → age assurance redirect/block
- v1 API with missing age assurance → 403
- Character activation without creator verification → 403

### E2E tests (Playwright — add devDependency)

- Tenant onboarding completion flow
- Clickwrap acceptance recorded
- Admin kill switch stops live chat

---

## 14. Riesgos y decisiones abiertas

### Riesgos técnicos

| Riesgo | Mitigación |
|--------|------------|
| Prompt-only safety bypass | Policy engine input+output+memory; never prompt-only |
| OpenRouter model variability | Allowlist + per-model safety tests |
| `db push` data loss | Migrate to `migrate deploy` |
| No job runner | Add cron endpoint Fase 4 |
| Dual auth confusion | Deprecate NextAuth behind flag, remove Fase 7 |
| Peer auto-verification (existing data) | Backfill requires reverification campaign |

### Decisiones que requieren input de negocio/legal

| # | Pregunta | Impacto |
|---|----------|---------|
| 1 | País de incorporación y mercados servidos | Age assurance requirements |
| 2 | Proveedor age verification | Fase 2 implementation |
| 3 | Proveedor identity verification / KYC | Creator onboarding |
| 4 | ¿Telegram permite AI messaging comercial adulto? | Connector risk |
| 5 | Procesador de pagos adult-friendly | Billing Fase 6 |
| 6 | Retention periods definitivos | Legal + infra |
| 7 | Rol data controller vs processor con tenants | Privacy policy |
| 8 | ¿Browser automation alguna vez? | Default blocked |
| 9 | Moderation classifier budget/vendor | Fase 3b |
| 10 | Log aggregation vendor | Audit investigability |

### Features intencionalmente diferidas (post-MVP)

- Voice generation (no code exists)
- Image generation (no code exists)
- OnlyFans/Fansly connectors (marketing only)
- Browser automation implementation (metadata only, flag off)
- Model training opt-in pipeline
- Hash chain audit integrity
- Full MFA (integrate Hexclave MFA when available)

---

## 15. Criterios de salida por fase

### Fase 1 ✓ cuando:
- [ ] Migration aplicada localmente
- [ ] Backfill script ejecuta sin error
- [ ] Feature flags consultables server-side
- [ ] `threat-model.md` y `data-flow-map.md` creados
- [ ] Deployment gates skeleton pasa en dev

### Fase 2 ✓ cuando:
- [ ] Mock age provider funciona end-to-end
- [ ] Peers NO auto-verificados
- [ ] ConsentRecord almacena clickwrap
- [ ] Creator onboarding bloquea character activation
- [ ] Tests bypass age gate pasan

### Fase 3 ✓ cuando:
- [ ] SafetyPolicyEngine bloquea todos los rule IDs P0
- [ ] Output validation activa
- [ ] "Never admit being AI" eliminado
- [ ] Disclosure mínimo enforced
- [ ] SafetyEvent persistido en blocks

### Fase 4 ✓ cuando:
- [ ] Kill switches funcionan en todos los send paths
- [ ] AuditEvent para acciones P0
- [ ] Human review queue operacional
- [ ] Abuse report form live

### Fase 5 ✓ cuando:
- [ ] Telegram wrapped in PlatformConnection
- [ ] Attestation required before bot active
- [ ] Tokens encrypted at rest
- [ ] Browser automation flag off + blocked

### Fase 6 ✓ cuando:
- [ ] 16 legal pages publicadas (placeholders OK with gates)
- [ ] Admin + tenant dashboards live
- [ ] Retention job runs (manual trigger minimum)

### Fase 7 ✓ cuando:
- [ ] All acceptance tests pass
- [ ] Deployment gates block prod con mock providers
- [ ] All docs complete
- [ ] Production readiness checklist reviewed

---

## Apéndice A — Production deployment gates

Build/deploy MUST fail or warn if:

- [ ] `[LEGAL_COMPANY_NAME]` unresolved in published policies
- [ ] `COMPLIANCE_ABUSE_EMAIL` missing
- [ ] `COMPLIANCE_PRIVACY_EMAIL` missing
- [ ] Policy versions not seeded
- [ ] Mandatory policies unpublished
- [ ] Default admin password exists
- [ ] `AGE_ASSURANCE_PROVIDER=mock` in production
- [ ] `IDENTITY_VERIFICATION_PROVIDER=mock` in production
- [ ] `CREDENTIAL_ENCRYPTION_KEY` missing
- [ ] `adult_content_enabled` without age assurance configured
- [ ] `autonomous_messaging_enabled` without disclosure config
- [ ] `real_person_cloning_enabled` without consent verification
- [ ] `browser_automation_enabled` without risk approval record
- [ ] Retention jobs disabled
- [ ] `AUDIT_LOG_ENABLED=false`
- [ ] Kill switch service unreachable

Implementation: `src/lib/compliance/deployment/gates.ts` called from `scripts/start.sh` and CI.

---

## Apéndice B — Data retention defaults (REQUIRES LEGAL REVIEW)

| Data category | Default retention | Deletion method |
|---------------|-------------------|-----------------|
| Conversation content | `[RETENTION_PERIOD]` e.g. 90 days | Hard delete |
| Safety events | 2 years | Hard delete |
| Audit logs | 7 years | Archive + delete |
| Consent records | Life of account + 3 years | Soft then hard |
| Age assurance records | 1 year after expiry | Hard delete |
| Identity verification refs | Life of creator + 1 year | Hard delete |
| Generated media | 30 days | Hard delete |
| Memories (general) | Configurable, default 1 year | Hard delete |
| Memories (sensitive) | Until consent revoked + 30 days | Encrypted hard delete |
| Platform credentials | Until disconnected + 30 days | Secure wipe |
| Billing records | 7 years | Archive |

---

## Apéndice C — Comandos locales (post-implementación)

```bash
# Setup
npm install
cp .env.example .env.local
# Configure DATABASE_URL, HEXCLAVE_*, OPENROUTER_API_KEY

# Database
npm run db:migrate          # After Phase 1
npx tsx prisma/scripts/backfill-tenants.ts
npx tsx prisma/seed/compliance-fixtures.ts

# Dev
npm run dev

# Tests
npm test                    # Add test script Phase 7
npm run test:compliance     # Compliance-specific suite

# Deployment gates (local check)
npx tsx src/lib/compliance/deployment/gates.ts --check
```

---

## Apéndice D — Rollback

1. Revert migration: `prisma migrate resolve --rolled-back [name]`
2. Disable kill switches via admin (if deployed)
3. Set all feature flags to false
4. Restore DB from backup (Railway snapshot)
5. Document incident in `SafetyEvent` + postmortem

---

*Fin del plan v1.0. Proceder a Fase 1 solo tras revisión interna de este documento.*
