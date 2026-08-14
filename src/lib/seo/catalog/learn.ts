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
    intro:
      "Vesperer tutors are designed to remember your progress: the timelines you confuse, the essay thesis you are testing, and the historical comparisons you keep returning to.",
    bullets: [
      "Builds on prior sessions instead of resetting",
      "Essay coaching with remembered thesis drafts",
      "Links to historical personas for immersion",
      "Useful for students and lifelong learners",
    ],
    topics: ["Timelines", "Primary sources", "Essays", "Civilizations"],
    suggestedQuestions: [
      "Can you help me compare two historical periods without flattening the differences?",
      "What causes did we already discuss for this revolution, and what am I missing?",
      "Can you remember my thesis and challenge it with counter-evidence?",
    ],
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
      { verb: "meet", slug: "plato", label: "Talk to Plato" },
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
      { verb: "learn", slug: "interview-coach", label: "Interview coach" },
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
    intro:
      "The Stoic Mentor is a practice partner, not a quote dispenser. It remembers recurring frictions, decisions you postponed, and the exercises that actually helped you act with steadier judgment.",
    bullets: [
      "Decision frameworks without fluff",
      "Daily practice that compounds because progress is remembered",
      "Links to Marcus Aurelius conversations",
      "Voice demo available for short reflection sessions",
    ],
    topics: ["Focus", "Resilience", "Judgment", "Action"],
    suggestedQuestions: [
      "What part of this situation is actually under my control?",
      "Can you remember the pattern I keep repeating under pressure?",
      "Give me a short evening review based on what I said earlier this week.",
    ],
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
      {
        q: "How does memory help a Stoic mentor?",
        a: "It can notice repeated judgments, commitments and avoidance patterns across sessions, then bring you back to the practice that fits the current moment.",
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
    slug: "math-tutor",
    category: "Learn",
    name: "AI Math Tutor",
    title: "AI Math Tutor That Remembers Your Progress | Vesperer",
    metaDescription:
      "Learn math with an AI tutor that remembers your mistakes, pacing and problem history. Practice algebra, calculus and reasoning with continuity.",
    h1: "An AI math tutor that remembers your progress",
    summary:
      "Step-by-step math practice that keeps track of what clicked, what did not, and which problem types still need work.",
    intro:
      "A good math tutor should not ask you to re-explain your level every session. Vesperer keeps the thread so practice can build from arithmetic confidence to advanced reasoning.",
    bullets: [
      "Tracks recurring mistakes and misconceptions",
      "Adapts examples to the methods that worked before",
      "Supports homework practice without doing the learning for you",
      "Connects conceptual gaps across sessions",
    ],
    topics: ["Algebra", "Calculus", "Problem solving", "Study progress"],
    suggestedQuestions: [
      "Can you remember which algebra steps I keep skipping?",
      "Give me a similar problem to the one I missed yesterday.",
      "Explain this concept with the analogy that worked last time.",
    ],
    sampleDialogue: [
      {
        role: "user",
        text: "I got stuck factoring again.",
      },
      {
        role: "persona",
        text: "Last time the issue was spotting the common term first. Let us pause before expanding anything and identify the shared factor.",
      },
    ],
    faqs: [
      {
        q: "Will it just give answers?",
        a: "It should guide reasoning and practice. You can set rules so it explains steps, asks checks and avoids simply completing homework.",
      },
    ],
    related: [
      { verb: "learn", slug: "physics-tutor", label: "Physics tutor" },
      { verb: "learn", slug: "programming-tutor", label: "Programming tutor" },
      { verb: "create", slug: "ai-character", label: "Create a tutor" },
    ],
    demoSlug: "einstein",
    ctaPrimary: { label: "Start learning", href: "/c/einstein" },
    ctaSecondary: {
      label: "Create your own tutor",
      href: "/handler/sign-up",
    },
  },
  {
    verb: "learn",
    slug: "programming-tutor",
    category: "Learn",
    name: "AI Programming Tutor",
    title: "AI Programming Tutor with Memory | Vesperer",
    metaDescription:
      "An AI programming tutor that remembers your projects, bugs and learning path. Practice coding with continuity across sessions.",
    h1: "An AI programming tutor that remembers your projects",
    summary:
      "Learn coding with a tutor that tracks your stack, recurring bugs and the mental models you are building.",
    intro:
      "Programming progress is cumulative. Vesperer can keep project context, preferred explanations and prior mistakes available so each session starts from where you actually are.",
    bullets: [
      "Remembers your project goals and stack",
      "Tracks concepts you have already practised",
      "Explains bugs in the context of your code history",
      "Helps you build durable debugging habits",
    ],
    topics: ["Programming", "Debugging", "Projects", "Learning path"],
    suggestedQuestions: [
      "Can you remember the bug pattern I keep hitting in this project?",
      "Explain async code using the example from my last session.",
      "Give me a practice task that fits my current stack.",
    ],
    sampleDialogue: [
      {
        role: "user",
        text: "My React state is wrong again.",
      },
      {
        role: "persona",
        text: "You had a similar stale-state issue yesterday. Before changing code, where is the value captured and where is it updated?",
      },
    ],
    faqs: [
      {
        q: "Does it replace documentation?",
        a: "No. It helps you interpret docs, practise concepts and remember your learning path. Always verify production code against official sources.",
      },
    ],
    related: [
      { verb: "learn", slug: "math-tutor", label: "Math tutor" },
      { verb: "learn", slug: "interview-coach", label: "Interview coach" },
      { verb: "create", slug: "ai-character", label: "Create a tutor" },
    ],
    demoSlug: "ada-lovelace",
    ctaPrimary: { label: "Start learning", href: "/c/ada-lovelace" },
    ctaSecondary: {
      label: "Create your own tutor",
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
