# Hexclave → Supabase Auth migration checklist

Product authz is already portable: `Workspace` / `WorkspaceMember` + `src/lib/workspace/capabilities.ts`. Hexclave is only the v1 identity adapter.

## Before switching

1. Implement `SupabaseWorkspaceAuth` in `src/lib/workspace/auth/supabase.ts`:
   - Session from Supabase JWT / cookies
   - Map `auth.users.id` → `User.externalAuthUserId`
   - Set `User.authProvider = "supabase"`
2. Keep `requireWorkspacePermission` and all persona/knowledge/key routes unchanged.
3. Ensure every user has `externalAuthUserId` populated (today mirrored from `hexclaveId` on login).

## Cutover steps

1. Create Supabase project; enable Auth providers you need.
2. Export/link Hexclave users → Supabase `auth.users` (or forced re-signup + email match).
3. Set `AUTH_PROVIDER=supabase`.
4. Point `getAppUser` / session resolver at `SupabaseWorkspaceAuth` (via `getWorkspaceAuthPort()` + session bridge).
5. Invites: use `WorkspaceInvite` + Resend only (already persisted in Prisma).
6. Clear or ignore `Workspace.externalAuthTeamId` (Hexclave Team mapping).
7. Replace any remaining Hexclave UI widgets; `WorkspaceSwitcher` / Members UI stay.
8. (Optional) Add Postgres RLS if the client ever talks to Supabase DB directly. Next.js + Prisma server routes do not require RLS for authz.

## Do not change on migration

- Capability IDs (`personas.write`, …)
- `workspaceId` foreign keys on Character / KnowledgePack / UserApiKey / TelegramBot
- Owner invariants / invite rules / one-time API key display

## Verify

- [ ] Login / signup with Supabase session
- [ ] Personal workspace still Owner
- [ ] Invite accept flow
- [ ] `vsk_` / `vesp_` still derive workspace from the key
- [ ] No route calls Hexclave `getPermission` for product authz
