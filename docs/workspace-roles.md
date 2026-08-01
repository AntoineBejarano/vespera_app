# Workspace roles (product)

Canonical authz: Prisma `WorkspaceMember.role` + `src/lib/workspace/capabilities.ts`.

## Visible roles (v1)

| Role | Purpose |
|------|---------|
| Owner | Billing, transfer, enable After Dark, promote Admins |
| Admin | Publish, archive, keys, bots, invite Editor/Viewer |
| Editor | Create/edit drafts, playground, knowledge write |
| Viewer | Read-only (no playground run) |

Backend checks **capabilities** (e.g. `personas.write`), never role names in routes.

## Phase 2 — Operator (reserved)

`operator` is **not** invitible in v1. When After Dark human-in-the-loop (review queue / send-as-persona) ships:

1. Add `"operator"` to `WORKSPACE_ROLES` / invitable set.
2. Grant a narrow capability set, e.g. `playground.run`, `chat_history.read`, future `human_review.*`.
3. Do **not** grant `content.publish`, keys, members, or `adult.enable_workspace`.

Until then, do not show Operator in the invite dropdown.

## Owner invariants

- Exactly one Owner
- Owner cannot leave or self-remove
- Transfer requires acceptance + is atomic; previous Owner becomes Admin
- Delete workspace requires typing the workspace name
