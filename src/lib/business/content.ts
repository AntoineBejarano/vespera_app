/**
 * Shared copy and structured content for /business SEO surfaces.
 * Keep this technical and operational — emotional marketing lives on `/` and After Dark.
 */

export const BUSINESS_HERO = {
  eyebrow: "Vesperer for Business",
  title: "Operate persistent AI identities at scale.",
  description:
    "Create, manage and deploy conversational identities with memory, permissions, API access and operational control — for creators, agencies, platforms and brands.",
} as const;

export const BUSINESS_SEGMENTS = [
  {
    slug: "creators",
    title: "Creators",
    href: "/business#creators",
    result: "Monetize and extend a consistent identity across chat, voice and channels.",
  },
  {
    slug: "agencies",
    title: "Agencies",
    href: "/business/agencies",
    result: "Run multiple talents and operators from one workspace with handoff and oversight.",
  },
  {
    slug: "platforms",
    title: "Platforms",
    href: "/business/platforms",
    result: "Integrate governed identities via API, chat keys and multi-tenant isolation.",
  },
  {
    slug: "brands",
    title: "Brands & institutions",
    href: "/business#brands",
    result: "Turn expertise, history and characters into persistent experiences people return to.",
  },
] as const;

export const BUSINESS_CAPABILITIES = [
  {
    id: "workspaces",
    title: "Workspaces & teams",
    body: "Organize personas, knowledge and channels inside workspaces. Invite operators, keep ownership clear, and separate client work without mixing memory or credentials.",
  },
  {
    id: "permissions",
    title: "Roles & permissions",
    body: "Control who can edit identity, publish channels, read conversations or manage billing. Simple roles for operators today — expandable as teams grow.",
  },
  {
    id: "identities",
    title: "Persistent identities",
    body: "Soul, style, rules and context stay layered so personality remains stable while knowledge and tone can evolve safely across models and releases.",
  },
  {
    id: "knowledge",
    title: "Knowledge packs",
    body: "Attach documents, FAQs, approved sources and Live Persona feeds so answers stay grounded. Attribution and review keep updates from erasing who the persona is.",
  },
  {
    id: "memory",
    title: "Memory & relationships",
    body: "Every peer gets an isolated history. Preferences, promises and relationship state persist across sessions, devices and channels — without leaking between users.",
  },
  {
    id: "api",
    title: "API & chat keys",
    body: "Provision account keys for agents and dashboards, and per-persona chat keys for end-user surfaces. Built for CLI, Cursor, Claude and custom backends.",
  },
  {
    id: "channels",
    title: "Channels",
    body: "Deploy the same identity to web chat, Telegram and voice. One definition, continuous memory — connectors for creator platforms on the roadmap.",
  },
  {
    id: "handoff",
    title: "Human handoff",
    body: "Escalate to a real operator when the conversation needs a human — without breaking the character frame or losing context.",
  },
  {
    id: "audit",
    title: "Audit & operational control",
    body: "Track meaningful changes to identity, channels and access. Kill switches and revocation paths let you stop a persona or channel immediately when something goes wrong.",
  },
  {
    id: "consent",
    title: "Consent, disclosure & ownership",
    body: "Creator authorization, AI disclosure and exportable configuration so identities remain owned, attributable and portable — not locked inside a brittle prompt.",
  },
] as const;

export const BUSINESS_FAQS = [
  {
    q: "What is Vesperer for Business?",
    a: "Vesperer for Business is the operational layer for creating, governing and deploying AI identities with persistent memory, workspaces, API access, channels and human handoff — for agencies, platforms, creators and brands.",
  },
  {
    q: "How is this different from a normal chatbot builder?",
    a: "Most tools optimize a single chat session. Vesperer keeps a stable identity, long-term memory per user, relationship state, channel continuity and operator controls so the same persona can run safely at scale.",
  },
  {
    q: "Can agencies manage multiple creators?",
    a: "Yes. Workspaces are designed for rosters: multiple personas, operator seats, human handoff and consistent identity across Telegram, web and voice. See Vesperer for Agencies for the multi-talent workflow.",
  },
  {
    q: "Can platforms integrate via API?",
    a: "Yes. Platforms can provision personas, issue chat keys, isolate peer memory and embed conversational identities inside their own product. See Vesperer for Platforms for integration details.",
  },
  {
    q: "Do you support adult creators?",
    a: "Adult experiences run on the separate After Dark surface (18+) with the same identity and memory core. Apex stays SFW for distribution, payments-friendly positioning and institutional use.",
  },
  {
    q: "Where can I find technical documentation?",
    a: "Public Chat API and CLI docs are available at /docs. Technology details for identity layers and memory are at /technology. For design partnerships, contact legal@vesperer.com.",
  },
] as const;

export const AGENCY_HERO = {
  eyebrow: "Vesperer for Agencies",
  title: "Run a roster of AI identities without losing the plot.",
  description:
    "One workspace for multiple talents and operators: consistent personalities, per-fan memory, Telegram and web channels, human handoff, and the controls you need when volume grows.",
} as const;

export const AGENCY_CAPABILITIES = [
  {
    title: "Multi-talent workspaces",
    body: "Keep each creator’s identity, knowledge and channels separated while your team works from one place.",
  },
  {
    title: "Operator-friendly roles",
    body: "Let chatters and managers do their job without giving everyone full edit access to identity or credentials.",
  },
  {
    title: "Human handoff",
    body: "Pass sensitive or high-value conversations to a real person with context intact.",
  },
  {
    title: "Consistent character across volume",
    body: "Memory and relationship state stay per peer, so scale does not mean generic replies or personality drift.",
  },
  {
    title: "Channel deployment",
    body: "Ship the same persona to Telegram, web chat and voice — with more creator-platform connectors on the roadmap.",
  },
  {
    title: "Operational kill switch",
    body: "Pause a persona or channel immediately if content, consent or brand risk requires it.",
  },
] as const;

export const AGENCY_FAQS = [
  {
    q: "Who is Vesperer for Agencies for?",
    a: "Talent managers, chatter agencies and creator networks that need multiple AI identities with memory, handoff and team access — without building infrastructure from scratch.",
  },
  {
    q: "Can each fan have a separate memory?",
    a: "Yes. Memory and relationship state are peer-isolated, so the same persona can sustain thousands of separate ongoing conversations.",
  },
  {
    q: "Does After Dark support agency workflows?",
    a: "Adult creator lines run on After Dark (18+) with the same core. Apex remains available for SFW talent, coaches and brand work under the same business tooling.",
  },
] as const;

export const PLATFORM_HERO = {
  eyebrow: "Vesperer for Platforms",
  title: "Embed governed AI identities into your product.",
  description:
    "Use Vesperer as the identity, memory and conversation layer behind your app — with API keys, multi-tenant isolation, channel connectors and operational controls.",
} as const;

export const PLATFORM_CAPABILITIES = [
  {
    title: "API-first provisioning",
    body: "Create personas, attach knowledge and issue chat keys programmatically via API and CLI — including agent-driven setup.",
  },
  {
    title: "Multi-tenant isolation",
    body: "Keep workspaces, secrets, memory and credentials separated so one customer’s data never bleeds into another’s.",
  },
  {
    title: "Chat keys for end users",
    body: "Expose a clean chat surface to your users while retaining account-level control over models, limits and identity.",
  },
  {
    title: "Continuity across surfaces",
    body: "The same identity can continue across your web app, Telegram bots and voice without rebuilding personality each time.",
  },
  {
    title: "Governance hooks",
    body: "Disclosure, consent trails, audit-friendly change history and kill switches help you operate identities other companies cannot risk running blindly.",
  },
  {
    title: "Integration path",
    body: "Start with Chat API + web embed, add Telegram, then deepen with Live Persona sources, handoff webhooks and custom retention rules.",
  },
] as const;

export const PLATFORM_FAQS = [
  {
    q: "What does a platform integration look like?",
    a: "Typically: create a workspace, provision personas via API or CLI, issue chat keys for your frontends, and keep peer memory isolated inside Vesperer while your product owns UX and billing.",
  },
  {
    q: "Can we keep our own UI?",
    a: "Yes. Vesperer can power the identity and conversation backend while your application owns the interface, branding and monetization.",
  },
  {
    q: "Is there a design-partner program?",
    a: "Yes. We work with a small number of platforms and agencies on paid design partnerships for deeper integration, compliance controls and roadmap priority. Contact legal@vesperer.com.",
  },
] as const;
