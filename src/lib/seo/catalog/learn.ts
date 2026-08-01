import type { SeoPage } from "./types";

export const LEARN_PAGES: SeoPage[] = [
  {
    verb: "learn",
    slug: "philosophy-tutor",
    category: "Learn",
    name: "AI Philosophy Tutor",
    title: "AI Philosophy Tutor — Dialogue That Remembers | Vesperer",
    metaDescription:
      "An AI philosophy tutor that remembers your questions, essays and disagreements. Learn through dialogue, not flashcards.",
    h1: "An AI philosophy tutor that remembers how you think",
    summary:
      "From ethics to epistemology — a tutor that tracks your evolving positions and pushes for clearer arguments.",
    bullets: [
      "Socratic dialogue tailored to your level",
      "Remembers papers, theses and sticking points",
      "Connects to Plato, Socrates and Aristotle personas",
      "Chat or voice — same continuity",
    ],
    topics: ["Ethics", "Epistemology", "Argumentation", "History of ideas"],
    sampleDialogue: [
      {
        role: "user",
        text: "I still do not get the difference between utilitarianism and deontology.",
      },
      {
        role: "persona",
        text: "Last week you chose the trolley switch. Would a deontologist refuse the switch even if five lives were saved? Walk me through why.",
      },
    ],
    faqs: [
      {
        q: "Can it replace a professor?",
        a: "No. It is a practice partner that remembers your progress — ideal between classes and study groups.",
      },
    ],
    related: [
      { verb: "meet", slug: "plato", label: "Talk to Plato" },
      { verb: "meet", slug: "socrates", label: "Talk to Socrates" },
      { verb: "learn", slug: "stoic-mentor", label: "Stoic mentor" },
      {
        verb: "create",
        slug: "historical-persona",
        label: "Create a historical persona",
      },
    ],
    demoSlug: "plato",
    ctaPrimary: { label: "Start learning", href: "/c/plato" },
    ctaSecondary: {
      label: "Create your own tutor",
      href: "/handler/sign-up",
    },
  },
  {
    verb: "learn",
    slug: "physics-tutor",
    category: "Learn",
    name: "AI Physics Tutor",
    title: "AI Physics Tutor — Concepts with Continuity | Vesperer",
    metaDescription:
      "Learn physics with an AI tutor that remembers which analogies worked for you. From mechanics to relativity intuition.",
    h1: "An AI physics tutor that remembers your sticking points",
    summary:
      "Clear metaphors first, equations when you are ready — and continuity so you never re-explain what you already mastered.",
    bullets: [
      "Concept-first explanations",
      "Tracks misconceptions across sessions",
      "Pairs with Einstein and Newton personas",
      "Practice problems with patient follow-up",
    ],
    topics: ["Mechanics", "Energy", "Waves", "Relativity intuition"],
    sampleDialogue: [
      {
        role: "user",
        text: "I keep mixing up mass and weight.",
      },
      {
        role: "persona",
        text: "You nailed inertia last time. Weight is how hard gravity pulls on that mass — same object, different moon. Want a quick check question?",
      },
    ],
    faqs: [
      {
        q: "Exam prep?",
        a: "Yes for conceptual drill. Always verify formal methods with your course materials.",
      },
    ],
    related: [
      { verb: "meet", slug: "albert-einstein", label: "Talk to Einstein" },
      { verb: "meet", slug: "isaac-newton", label: "Talk to Newton" },
      { verb: "learn", slug: "history-tutor", label: "History tutor" },
    ],
    demoSlug: "einstein",
    voiceHint: true,
    ctaPrimary: { label: "Start learning", href: "/c/einstein" },
    ctaSecondary: {
      label: "Create your own tutor",
      href: "/handler/sign-up",
    },
  },
  {
    verb: "learn",
    slug: "history-tutor",
    category: "Learn",
    name: "AI History Tutor",
    title: "AI History Tutor — Context That Compounds | Vesperer",
    metaDescription:
      "Study history with an AI tutor that remembers your timeline questions and essay angles. Context that compounds session after session.",
    h1: "An AI history tutor that keeps the thread",
    summary:
      "Cause, context and consequence — without drowning you in dates you already know.",
    bullets: [
      "Builds on prior sessions instead of resetting",
      "Essay coaching with remembered thesis drafts",
      "Links to historical personas for immersion",
      "Useful for students and lifelong learners",
    ],
    topics: ["Timelines", "Primary sources", "Essays", "Civilizations"],
    sampleDialogue: [
      {
        role: "user",
        text: "Why did the French Revolution turn so radical?",
      },
      {
        role: "persona",
        text: "You asked about bread prices last time — hold that. Fear, war and factional trust collapse matter as much as ideals. Which thread do you want first?",
      },
    ],
    faqs: [
      {
        q: "Is it biased?",
        a: "It presents multiple interpretations and encourages primary sources. Always cross-check for academic work.",
      },
    ],
    related: [
      { verb: "meet", slug: "marie-curie", label: "Marie Curie" },
      { verb: "hire", slug: "museum-guide", label: "Museum guide" },
      { verb: "learn", slug: "philosophy-tutor", label: "Philosophy tutor" },
    ],
    demoSlug: "marie-curie",
    ctaPrimary: { label: "Start learning", href: "/c/marie-curie" },
    ctaSecondary: {
      label: "Create your own tutor",
      href: "/handler/sign-up",
    },
  },
  {
    verb: "learn",
    slug: "language-partner",
    category: "Learn",
    name: "AI Language Conversation Partner",
    title: "AI Language Conversation Partner | Vesperer",
    metaDescription:
      "Practice languages with an AI partner that remembers your level, mistakes and goals. Conversation that continues where you left off.",
    h1: "A language partner that remembers your level",
    summary:
      "Real conversation practice — corrections when useful, patience always, continuity every time you return.",
    bullets: [
      "Remembers vocabulary you are building",
      "Adjusts difficulty to your comfort",
      "Voice-friendly for speaking practice",
      "Create partners for any language you need",
    ],
    topics: ["Conversation", "Vocabulary", "Pronunciation", "Fluency"],
    sampleDialogue: [
      {
        role: "user",
        text: "Can we practise ordering coffee in Spanish again?",
      },
      {
        role: "persona",
        text: "Of course — last time you wanted less English scaffolding. Ready when you are: ¿Qué te apetece hoy?",
      },
    ],
    faqs: [
      {
        q: "Which languages?",
        a: "Create a partner for the language you need and teach it your goals. Continuity works the same across languages.",
      },
    ],
    related: [
      { verb: "create", slug: "ai-character", label: "Create an AI character" },
      { verb: "learn", slug: "writing-mentor", label: "Writing mentor" },
      { verb: "create", slug: "ai-character", label: "Create an AI character" },
    ],
    demoSlug: "luna",
    voiceHint: true,
    ctaPrimary: { label: "Start practising", href: "/c/luna" },
    ctaSecondary: {
      label: "Create your language partner",
      href: "/handler/sign-up",
    },
  },
  {
    verb: "learn",
    slug: "stoic-mentor",
    category: "Learn",
    name: "AI Stoic Mentor",
    title: "AI Stoic Mentor — Clarity Under Pressure | Vesperer",
    metaDescription:
      "A Stoic mentor AI for decisions, focus and resilience. Remembers your frictions and practices — no empty pep talks.",
    h1: "An AI Stoic mentor for clarity under pressure",
    summary:
      "Sparse, precise guidance that remembers what you can control — and what you keep trying to control anyway.",
    bullets: [
      "Decision frameworks without fluff",
      "Daily practice that compounds",
      "Links to Marcus Aurelius conversations",
      "Voice demo available",
    ],
    topics: ["Focus", "Resilience", "Judgment", "Action"],
    sampleDialogue: [
      {
        role: "user",
        text: "I keep replaying a meeting where I froze.",
      },
      {
        role: "persona",
        text: "The replay is optional. What virtue can you practise in the next meeting that was missing in the last?",
      },
    ],
    faqs: [
      {
        q: "Is this mental health care?",
        a: "No. It is a reflective mentor for everyday resilience — seek professionals for clinical needs.",
      },
    ],
    related: [
      {
        verb: "meet",
        slug: "marcus-aurelius",
        label: "Talk to Marcus Aurelius",
      },
      { verb: "learn", slug: "interview-coach", label: "Interview coach" },
      { verb: "learn", slug: "philosophy-tutor", label: "Philosophy tutor" },
    ],
    demoSlug: "stoic-mentor",
    voiceHint: true,
    ctaPrimary: { label: "Meet the mentor", href: "/c/stoic-mentor" },
    ctaSecondary: {
      label: "Create your own mentor",
      href: "/handler/sign-up",
    },
  },
  {
    verb: "learn",
    slug: "interview-coach",
    category: "Learn",
    name: "AI Interview Coach",
    title: "AI Interview Coach — Practice That Remembers | Vesperer",
    metaDescription:
      "Practise interviews with an AI coach that remembers your weak spots, stories and target roles. Continuity between mock sessions.",
    h1: "An AI interview coach that remembers your weak spots",
    summary:
      "Mock interviews with memory — so tomorrow’s practice builds on today’s feedback.",
    bullets: [
      "Role-specific question banks",
      "Tracks stories you already polished",
      "Technical and behavioural rounds",
      "Create a coach for your industry",
    ],
    topics: ["Behavioural", "Technical", "Storytelling", "Confidence"],
    sampleDialogue: [
      {
        role: "user",
        text: "I have the interview tomorrow.",
      },
      {
        role: "persona",
        text: "I remember — the technical round worried you most. Want to practise system design for twenty minutes?",
      },
    ],
    faqs: [
      {
        q: "Will it guarantee a job?",
        a: "No. It improves preparation and continuity of practice — you still earn the offer.",
      },
    ],
    related: [
      { verb: "learn", slug: "stoic-mentor", label: "Stoic mentor" },
      { verb: "learn", slug: "writing-mentor", label: "Writing mentor" },
      {
        verb: "create",
        slug: "ai-version-of-yourself",
        label: "Create an AI version of yourself",
      },
    ],
    demoSlug: "stoic-mentor",
    ctaPrimary: { label: "Start practising", href: "/c/stoic-mentor" },
    ctaSecondary: {
      label: "Create your interview coach",
      href: "/handler/sign-up",
    },
  },
  {
    verb: "learn",
    slug: "writing-mentor",
    category: "Learn",
    name: "AI Writing Mentor",
    title: "AI Writing Mentor — Voice and Drafts That Persist | Vesperer",
    metaDescription:
      "A writing mentor AI that remembers your drafts, voice goals and recurring issues. Continuity for essays, stories and posts.",
    h1: "An AI writing mentor that remembers your drafts",
    summary:
      "Feedback with memory — so you improve a voice, not restart notes every session.",
    bullets: [
      "Tracks your style goals",
      "Remembers prior draft feedback",
      "Fiction, essays and professional writing",
      "Create a mentor matched to your genre",
    ],
    topics: ["Voice", "Structure", "Revision", "Clarity"],
    sampleDialogue: [
      {
        role: "user",
        text: "My opening still feels flat.",
      },
      {
        role: "persona",
        text: "Last draft buried the conflict in paragraph three. Lead with the decision you were afraid to make — want a rewrite pass?",
      },
    ],
    faqs: [
      {
        q: "Does it write for me?",
        a: "It coaches and co-edits. Your authorship and judgment stay central.",
      },
    ],
    related: [
      { verb: "create", slug: "ai-character", label: "Create an AI character" },
      {
        verb: "create",
        slug: "virtual-influencer",
        label: "Virtual influencer",
      },
      { verb: "learn", slug: "language-partner", label: "Language partner" },
    ],
    demoSlug: "luna",
    ctaPrimary: { label: "Start writing", href: "/c/luna" },
    ctaSecondary: {
      label: "Create your writing mentor",
      href: "/handler/sign-up",
    },
  },
];
