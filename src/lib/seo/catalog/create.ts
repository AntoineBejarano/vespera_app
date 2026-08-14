import type { SeoPage } from "./types";

export const CREATE_PAGES: SeoPage[] = [
  {
    verb: "create",
    slug: "ai-character",
    category: "Create",
    name: "Create an AI Character",
    title: "AI Character Creator with Memory | Vesperer",
    metaDescription:
      "AI character creator with long-term memory, persistent identity and portable exports. Create an AI character users can return to across chat and voice.",
    h1: "AI character creator with long-term memory",
    summary:
      "Create an AI character with a stable identity, private long-term memory per user, and portable exports that keep you from locking the character to one platform.",
    intro:
      "Vesperer is built for characters that persist: a versioned persona, memory that compounds across sessions, and deployment paths for web chat, voice, Telegram, API and character-card workflows.",
    bullets: [
      "Stable identity layers for soul, style, rules and context",
      "Long-term memory per person, isolated by relationship",
      "Web, Telegram, voice and API surfaces share the same persona",
      "Export configuration for Character Card, SillyTavern and Chai-style workflows",
    ],
    topics: [
      "AI character creator",
      "Long-term memory",
      "Persistent identity",
      "Character portability",
      "Export",
    ],
    suggestedQuestions: [
      "How do I create an AI character that remembers returning users?",
      "What should go into a character's identity, rules and opening message?",
      "How can I export an AI character if I move platforms later?",
    ],
    sampleDialogue: [
      {
        role: "user",
        text: "I want a detective who never forgets clues.",
      },
      {
        role: "persona",
        text: "Then we lock voice, rules and case memory first. Who is the detective — and what must they never invent?",
      },
    ],
    faqs: [
      {
        q: "Do I need to code?",
        a: "No. Start in the dashboard. Developers can also use the CLI and API.",
      },
      {
        q: "What makes Vesperer different from a normal character prompt?",
        a: "A prompt describes one session. Vesperer keeps a versioned identity plus long-term memory and relationship state so the character can continue with each returning user.",
      },
      {
        q: "Can I move a character between platforms?",
        a: "Yes. Vesperer is positioned as the portable master identity: build and version the character here, then export or adapt it for other tools where you have rights to use it.",
      },
    ],
    related: [
      { verb: "create", slug: "historical-persona", label: "Historical persona" },
      {
        verb: "create",
        slug: "virtual-influencer",
        label: "Virtual influencer",
      },
      { verb: "meet", slug: "plato", label: "See Plato as an example" },
      { verb: "hire", slug: "ai-receptionist", label: "Or hire a receptionist" },
    ],
    demoSlug: "luna",
    ctaPrimary: { label: "Create your character", href: "/handler/sign-up" },
    ctaSecondary: { label: "Bring an existing character", href: "/bring" },
  },
  {
    verb: "create",
    slug: "character-card",
    category: "Character tools",
    name: "Character Card Creator",
    title: "Character Card Creator with Memory | Vesperer",
    metaDescription:
      "Create a Character Card-ready AI character with personality, opening message, rules, lore and portable Vesperer memory.",
    h1: "Character Card creator for portable AI characters",
    summary:
      "Build the canonical identity first, then export a Character Card-style package without losing the versioned source of truth.",
    intro:
      "Character cards are useful for portability, but the card itself is only a snapshot. Vesperer keeps the living identity, memory boundaries and provenance around that export.",
    bullets: [
      "Draft name, description, first message and example dialogue",
      "Keep soul, style, rules and context as versioned layers",
      "Export a portable snapshot while preserving the master persona",
      "Use per-user memory in Vesperer when conversations continue here",
    ],
    topics: ["Character Card", "Character Card v2", "Export", "Portability"],
    suggestedQuestions: [
      "What fields should a strong AI character card include?",
      "How do I keep a character card portable without losing the original?",
      "Can I import a Character Card and keep improving it?",
    ],
    sampleDialogue: [
      {
        role: "user",
        text: "I have a character card, but the personality keeps drifting.",
      },
      {
        role: "persona",
        text: "Then keep the card as an export, not the source. We will version the rules and voice, then regenerate the portable snapshot.",
      },
    ],
    faqs: [
      {
        q: "Is this only for Character Card v2?",
        a: "No. Use it to organize the same core fields even when another platform expects a slightly different format.",
      },
      {
        q: "Does Vesperer claim ownership of my card?",
        a: "No. Build or import only characters you own or have permission to use, and keep the canonical version under your account.",
      },
    ],
    related: [
      { verb: "create", slug: "ai-character", label: "AI character creator" },
      {
        verb: "create",
        slug: "sillytavern-character",
        label: "SillyTavern character creator",
      },
      {
        verb: "create",
        slug: "import-export-ai-characters",
        label: "Import and export AI characters",
      },
    ],
    ctaPrimary: { label: "Create a character card", href: "/handler/sign-up" },
    ctaSecondary: { label: "Import a character", href: "/bring" },
  },
  {
    verb: "create",
    slug: "sillytavern-character",
    category: "Character tools",
    name: "SillyTavern Character Creator",
    title: "SillyTavern Character Creator and Import | Vesperer",
    metaDescription:
      "Create or import SillyTavern-style AI characters, keep a portable master persona and continue with long-term memory in Vesperer.",
    h1: "SillyTavern character creator and import path",
    summary:
      "Use Vesperer as the durable home for SillyTavern-style characters: identity, lore, rules, exports and memory in one place.",
    intro:
      "SillyTavern workflows are often power-user friendly but file-centered. Vesperer keeps the character portable while adding persistent relationship memory and multi-channel deployment.",
    bullets: [
      "Import existing character-card fields or draft a new persona",
      "Separate lore, behaviour rules, style and opening lines",
      "Export snapshots while preserving a versioned Vesperer master",
      "Continue conversations with long-term memory when users return",
    ],
    topics: ["SillyTavern", "Character Card", "Import", "Long-term memory"],
    suggestedQuestions: [
      "How do I import a SillyTavern character into Vesperer?",
      "What is the difference between a character file and a persistent persona?",
      "How can I keep lore portable across chat tools?",
    ],
    sampleDialogue: [
      {
        role: "user",
        text: "My SillyTavern card has lore, examples and jailbreak rules mixed together.",
      },
      {
        role: "persona",
        text: "We will separate identity from behaviour and boundaries first, then preserve only the rules you actually want to carry forward.",
      },
    ],
    faqs: [
      {
        q: "Can I import every SillyTavern field automatically?",
        a: "Vesperer can help reconstruct the important identity fields. You should review imports manually, especially safety rules and third-party content.",
      },
      {
        q: "Is Vesperer a SillyTavern replacement?",
        a: "It is a persistent identity and memory layer. Many creators use it as the source of truth, then export snapshots for other chat tools.",
      },
    ],
    related: [
      { verb: "create", slug: "character-card", label: "Character Card creator" },
      {
        verb: "create",
        slug: "import-export-ai-characters",
        label: "Import/export AI characters",
      },
      { verb: "create", slug: "ai-character", label: "AI character creator" },
    ],
    ctaPrimary: { label: "Create a SillyTavern character", href: "/handler/sign-up" },
    ctaSecondary: { label: "Import an existing character", href: "/bring" },
  },
  {
    verb: "create",
    slug: "import-export-ai-characters",
    category: "Character tools",
    name: "Import and Export AI Characters",
    title: "Import and Export AI Characters | Vesperer",
    metaDescription:
      "Import, back up and export AI characters across platforms while keeping persistent identity, long-term memory and version history in Vesperer.",
    h1: "Import and export AI characters without losing identity",
    summary:
      "Move character work between tools with a canonical Vesperer identity, clear provenance and exports that do not erase memory context.",
    intro:
      "Most character platforms make each upload feel final. Vesperer treats imports and exports as checkpoints around a living persona you can revise, fork and continue.",
    bullets: [
      "Import prompts, JSON, Character Card and SillyTavern-style exports",
      "Back up identity layers before publishing elsewhere",
      "Track versions and forks so provenance remains visible",
      "Keep Vesperer memory separate from portable static exports",
    ],
    topics: ["Import", "Export", "Backup", "Migration", "Version history"],
    suggestedQuestions: [
      "How do I back up an AI character before moving platforms?",
      "What should I check before importing a third-party character?",
      "How do exports preserve identity without exposing private memories?",
    ],
    sampleDialogue: [
      {
        role: "user",
        text: "I want to leave a platform but keep the character I wrote.",
      },
      {
        role: "persona",
        text: "Bring the fields you own, rebuild the identity layers, and keep private memories out of public exports unless you explicitly choose otherwise.",
      },
    ],
    faqs: [
      {
        q: "Can I import copyrighted characters?",
        a: "Only import characters and materials you own or have permission to use. Vesperer is designed for creator-owned identity.",
      },
      {
        q: "Are private memories included in exports?",
        a: "Not by default. Exports should contain character configuration, not another user's private relationship memory.",
      },
    ],
    related: [
      { verb: "create", slug: "ai-character", label: "AI character creator" },
      { verb: "create", slug: "character-card", label: "Character Card creator" },
      {
        verb: "create",
        slug: "sillytavern-character",
        label: "SillyTavern import",
      },
    ],
    ctaPrimary: { label: "Import a character", href: "/bring" },
    ctaSecondary: { label: "Create a new character", href: "/handler/sign-up" },
  },
  {
    verb: "create",
    slug: "character-ai-alternative",
    category: "Alternatives",
    name: "Character.AI Alternative",
    title: "Character.AI Alternative with Memory and Portability | Vesperer",
    metaDescription:
      "A Character.AI alternative for creators who want persistent identity, long-term memory, exports and ownership of their AI characters.",
    h1: "A Character.AI alternative built for portable identity",
    summary:
      "Use Vesperer when the character is your asset: a versioned persona with memory, exports and cross-channel continuity.",
    intro:
      "Vesperer is not trying to be another closed chat feed. It is the durable layer for characters you create, improve and publish across surfaces.",
    bullets: [
      "Build creator-owned personas instead of disposable chats",
      "Keep long-term memory per relationship",
      "Export and fork character configurations",
      "Deploy the same identity beyond one platform",
    ],
    topics: ["Character.AI alternative", "Portability", "Creator-owned AI"],
    suggestedQuestions: [
      "What should I look for in a Character.AI alternative?",
      "How does portability change AI character creation?",
      "Can a character remember users without being locked to one app?",
    ],
    sampleDialogue: [
      {
        role: "user",
        text: "I do not want my character trapped in one app.",
      },
      {
        role: "persona",
        text: "Then make the identity portable first. The app becomes a channel, not the only place the character exists.",
      },
    ],
    faqs: [
      {
        q: "Is Vesperer affiliated with Character.AI?",
        a: "No. Vesperer is independent and focused on persistent identity, memory and portability for creator-owned characters.",
      },
      {
        q: "Can I recreate a character from another platform?",
        a: "Only recreate characters you own or have rights to use. Use imports as a backup and migration workflow for your own work.",
      },
    ],
    related: [
      { verb: "create", slug: "ai-character", label: "AI character creator" },
      {
        verb: "create",
        slug: "import-export-ai-characters",
        label: "Import/export AI characters",
      },
      { verb: "create", slug: "chai-alternative", label: "Chai alternative" },
    ],
    ctaPrimary: { label: "Create a portable character", href: "/handler/sign-up" },
    ctaSecondary: { label: "Bring your character", href: "/bring" },
  },
  {
    verb: "create",
    slug: "chai-alternative",
    category: "Alternatives",
    name: "Chai Alternative",
    title: "Chai Alternative for Portable AI Characters | Vesperer",
    metaDescription:
      "A Chai alternative for creators who want portable AI characters, persistent identity, long-term memory and exportable persona files.",
    h1: "A Chai alternative for characters you can carry with you",
    summary:
      "Build the master persona in Vesperer, keep memory and versions intact, and export Chai-ready fields when you want to publish elsewhere.",
    intro:
      "The Chai-specific creator page is for publishing into Chai. This page is for creators comparing alternatives and wanting a durable home for their character identity.",
    bullets: [
      "Persistent identity instead of one-off prompt tweaking",
      "Long-term memory for returning users",
      "Chai-ready export fields without platform lock-in",
      "Registry pages for version and provenance",
    ],
    topics: ["Chai alternative", "AI companion creator", "Export", "Memory"],
    suggestedQuestions: [
      "What is a good Chai alternative for character creators?",
      "Can I keep a Chai-ready character backed up somewhere else?",
      "How does long-term memory change companion design?",
    ],
    sampleDialogue: [
      {
        role: "user",
        text: "I like Chai, but I want a backup of my best character.",
      },
      {
        role: "persona",
        text: "Keep the master identity here, export the Chai fields when needed, and continue refining the version you control.",
      },
    ],
    faqs: [
      {
        q: "Is this the same as the Chai character creator page?",
        a: "No. /chai-character-creator targets Chai publishing intent. This page compares the broader alternative: portable identity, memory and registry provenance.",
      },
      {
        q: "Does Vesperer publish directly to Chai?",
        a: "No. Exports are copy-paste ready. Vesperer is not affiliated with or endorsed by Chai AI.",
      },
    ],
    related: [
      { verb: "create", slug: "ai-character", label: "AI character creator" },
      {
        verb: "create",
        slug: "import-export-ai-characters",
        label: "Import/export AI characters",
      },
      { verb: "create", slug: "character-card", label: "Character Card creator" },
    ],
    ctaPrimary: { label: "Create a portable character", href: "/handler/sign-up" },
    ctaSecondary: { label: "Chai-specific creator", href: "/chai-character-creator" },
  },
  {
    verb: "create",
    slug: "historical-persona",
    category: "Create",
    name: "Create a Historical AI Persona",
    title: "Create a Historical AI Persona | Vesperer",
    metaDescription:
      "Build a historical AI persona from sources and notes — with clear AI disclosure, memory and museum-ready continuity.",
    h1: "Create a historical AI persona from your sources",
    summary:
      "Turn research, letters and exhibition copy into a mind visitors can question — clearly labelled as AI.",
    bullets: [
      "Ground the persona in materials you provide",
      "Required interpretive disclaimer",
      "Great for museums, classes and creators",
      "Link out to related great minds",
    ],
    topics: ["Archives", "Education", "Museums", "Disclosure"],
    sampleDialogue: [
      {
        role: "user",
        text: "We have Curie lab notes we want visitors to explore.",
      },
      {
        role: "persona",
        text: "We will encode what the notes allow, refuse what they do not, and greet returning school groups without starting over.",
      },
    ],
    faqs: [
      {
        q: "Can we claim it is the real person?",
        a: "No. Vesperer pages disclose AI interpretation. Accuracy depends on your sources and review.",
      },
    ],
    related: [
      { verb: "hire", slug: "museum-guide", label: "AI museum guide" },
      { verb: "meet", slug: "marie-curie", label: "Marie Curie example" },
      { verb: "meet", slug: "plato", label: "Plato example" },
      { verb: "learn", slug: "history-tutor", label: "History tutor" },
    ],
    demoSlug: "plato",
    ctaPrimary: {
      label: "Create a historical persona",
      href: "/handler/sign-up",
    },
    ctaSecondary: { label: "Explore great minds", href: "/explore?filter=meet" },
  },
  {
    verb: "create",
    slug: "ai-version-of-yourself",
    category: "Create",
    name: "Create an AI Version of Yourself",
    title: "Create an AI Version of Yourself | Vesperer",
    metaDescription:
      "Encode your voice, rules and knowledge into an AI persona fans or clients can talk to — with separate memory per person.",
    h1: "Create an AI version of yourself",
    summary:
      "One identity for your audience — thousands of separate relationships that remember each fan or client.",
    bullets: [
      "Your tone, boundaries and expertise",
      "Per-person memory isolation",
      "Publish privately or publicly",
      "Human handoff when needed",
    ],
    topics: ["Creators", "Coaches", "Personal brand", "Audience"],
    sampleDialogue: [
      {
        role: "user",
        text: "Can fans ask my AI about my course?",
      },
      {
        role: "persona",
        text: "Yes — teach the syllabus and FAQs once. Each fan’s progress stays theirs; your voice stays yours.",
      },
    ],
    faqs: [
      {
        q: "Will it pretend to be me offline?",
        a: "You set disclosure and boundaries. Most creators label the persona clearly as AI.",
      },
    ],
    related: [
      {
        verb: "create",
        slug: "virtual-influencer",
        label: "Virtual influencer",
      },
      { verb: "create", slug: "ai-character", label: "AI character" },
      { verb: "learn", slug: "writing-mentor", label: "Writing mentor" },
    ],
    demoSlug: "luna",
    ctaPrimary: { label: "Create your persona", href: "/handler/sign-up" },
    ctaSecondary: { label: "For creators", href: "/#creators" },
  },
  {
    verb: "create",
    slug: "virtual-influencer",
    category: "Create",
    name: "Create a Virtual Influencer",
    title: "Create a Virtual Influencer Persona | Vesperer",
    metaDescription:
      "Build a virtual influencer with consistent identity and per-fan memory — chat and voice that feel continuous.",
    h1: "Create a virtual influencer with real continuity",
    summary:
      "A creative world fans can enter — same character every time, personal history with each follower.",
    bullets: [
      "Consistent lore and voice",
      "Separate memory per fan",
      "Chat and voice surfaces",
      "Fork-friendly for collaborators",
    ],
    topics: ["Lore", "Audience", "Voice", "Community"],
    sampleDialogue: [
      {
        role: "user",
        text: "Remember my character’s rival from last month?",
      },
      {
        role: "persona",
        text: "How could I forget — they stole the sky-map. Ready for the next chapter?",
      },
    ],
    faqs: [
      {
        q: "Copyrighted characters?",
        a: "Only create or import characters you own or have rights to use.",
      },
    ],
    related: [
      { verb: "create", slug: "ai-character", label: "Create an AI character" },
      {
        verb: "create",
        slug: "ai-version-of-yourself",
        label: "AI version of yourself",
      },
      {
        verb: "create",
        slug: "historical-persona",
        label: "Historical persona",
      },
    ],
    demoSlug: "aiko",
    ctaPrimary: {
      label: "Create a virtual influencer",
      href: "/handler/sign-up",
    },
    ctaSecondary: { label: "Bring a character", href: "/bring" },
  },
  {
    verb: "create",
    slug: "ai-receptionist",
    category: "Create",
    name: "Create an AI Receptionist",
    title: "Create an AI Receptionist Persona | Vesperer",
    metaDescription:
      "Create an AI receptionist persona with your services, rules and memory for returning customers.",
    h1: "Create an AI receptionist for your front desk",
    summary:
      "Configure identity, knowledge and booking rules — then deploy where your visitors already talk.",
    bullets: [
      "Teach services and tone",
      "Remember returning visitors",
      "Deploy to web, Telegram or API",
      "Escalate edge cases to humans",
    ],
    topics: ["Services", "Booking", "Tone", "Handoff"],
    sampleDialogue: [
      {
        role: "user",
        text: "How fast can we go live?",
      },
      {
        role: "persona",
        text: "Define hours, services and never-say rules today. Test in admin chat, then connect a channel.",
      },
    ],
    faqs: [
      {
        q: "Is this the same as Hire AI receptionist?",
        a: "Hire pages sell the outcome. This page is the creation path — both lead to the same product.",
      },
    ],
    related: [
      { verb: "hire", slug: "ai-receptionist", label: "Why hire a receptionist" },
      { verb: "hire", slug: "dental-receptionist", label: "Dental vertical" },
      { verb: "create", slug: "ai-character", label: "Create any character" },
    ],
    ctaPrimary: {
      label: "Create your receptionist",
      href: "/handler/sign-up",
    },
    ctaSecondary: {
      label: "See the hire page",
      href: "/hire/ai-receptionist",
    },
  },
];
