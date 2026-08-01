import type { SeoPage } from "./types";

export const CREATE_PAGES: SeoPage[] = [
  {
    verb: "create",
    slug: "ai-character",
    category: "Create",
    name: "Create an AI Character",
    title: "Create an AI Character with Memory | Vesperer",
    metaDescription:
      "Create an AI character with stable identity, long-term memory and evolving relationships. Publish, talk and deploy across channels.",
    h1: "Create an AI character people can return to",
    summary:
      "Describe who they are, teach what they know, then let relationships compound across chat and voice.",
    bullets: [
      "Stable identity you control",
      "Long-term memory per person",
      "Web, Telegram, voice and API",
      "Export configuration when you leave",
    ],
    topics: ["Identity", "Memory", "Publish", "Fork"],
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
