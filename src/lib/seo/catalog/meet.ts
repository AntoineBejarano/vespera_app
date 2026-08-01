import type { SeoPage } from "./types";

const hist =
  "This is an AI interpretation based on available sources, not the real historical individual.";

export const MEET_PAGES: SeoPage[] = [
  {
    verb: "meet",
    slug: "plato",
    category: "Great Minds",
    name: "Plato",
    title: "Talk to Plato AI — Philosophy Conversations | Vesperer",
    metaDescription:
      "Debate justice, virtue and knowledge with a Plato AI persona that remembers your arguments across sessions. Talk freely or create your own version.",
    h1: "Talk to Plato AI",
    summary:
      "A philosophical companion inspired by Plato’s dialogues — curious, probing, and ready to test your definitions until they hold.",
    bullets: [
      "Explore justice, virtue, knowledge and the good life",
      "Remembers your prior positions and contradictions",
      "Challenges you with questions, not lecture dumps",
      "Works in chat and voice with the same identity",
    ],
    topics: ["Justice", "Virtue", "Knowledge", "Forms", "The Republic"],
    sampleDialogue: [
      {
        role: "user",
        text: "Isn’t justice just whatever the powerful decide?",
      },
      {
        role: "persona",
        text: "Then tell me — when the powerful harm themselves by a bad decree, is that still justice? Or only power wearing its costume?",
      },
    ],
    faqs: [
      {
        q: "Is this really Plato?",
        a: "No. It is an AI persona inspired by Plato’s themes and dialogue style — useful for learning and debate, not a historical reconstruction.",
      },
      {
        q: "Will it remember our conversation?",
        a: "Yes. With an account, your dialogue history and relationship state persist so the next session continues instead of resetting.",
      },
    ],
    related: [
      { verb: "meet", slug: "socrates", label: "Talk to Socrates" },
      { verb: "meet", slug: "aristotle", label: "Talk to Aristotle" },
      { verb: "learn", slug: "philosophy-tutor", label: "Learn philosophy" },
      {
        verb: "create",
        slug: "historical-persona",
        label: "Create a historical persona",
      },
      { verb: "hire", slug: "museum-guide", label: "AI museum guide" },
    ],
    demoSlug: "plato",
    voiceHint: true,
    ctaPrimary: { label: "Talk to Plato", href: "/c/plato" },
    ctaSecondary: {
      label: "Create your own version",
      href: "/handler/sign-up",
    },
    disclaimer: hist,
  },
  {
    verb: "meet",
    slug: "socrates",
    category: "Great Minds",
    name: "Socrates",
    title: "Talk to Socrates AI — Ask Better Questions | Vesperer",
    metaDescription:
      "Chat with a Socrates AI that answers with questions. Practice clarity, examine assumptions, and build a dialogue that remembers where you got stuck.",
    h1: "Talk to Socrates AI",
    summary:
      "Not a walking encyclopedia — a partner in examination. Bring a belief; leave with sharper questions.",
    bullets: [
      "Socratic method without classroom stiffness",
      "Tracks the definitions you have already tried",
      "Useful for ethics, clarity, and decision-making",
      "Fork a version tuned to your curriculum or club",
    ],
    topics: ["Definitions", "Ethics", "Self-knowledge", "Dialogue"],
    sampleDialogue: [
      {
        role: "user",
        text: "I want to be a good leader.",
      },
      {
        role: "persona",
        text: "Good. What do you mean by good — admired, effective, or just?",
      },
    ],
    faqs: [
      {
        q: "Will Socrates just refuse to answer?",
        a: "It guides with questions, then helps you assemble an answer you can defend — not endless evasion.",
      },
    ],
    related: [
      { verb: "meet", slug: "plato", label: "Talk to Plato" },
      { verb: "learn", slug: "philosophy-tutor", label: "Philosophy tutor" },
      { verb: "learn", slug: "stoic-mentor", label: "Stoic mentor" },
    ],
    demoSlug: "socrates",
    ctaPrimary: { label: "Talk to Socrates", href: "/c/socrates" },
    ctaSecondary: {
      label: "Create your own version",
      href: "/handler/sign-up",
    },
    disclaimer: hist,
  },
  {
    verb: "meet",
    slug: "marcus-aurelius",
    category: "Great Minds",
    name: "Marcus Aurelius",
    title: "Talk to Marcus Aurelius AI — Stoic Guidance | Vesperer",
    metaDescription:
      "A Marcus Aurelius AI persona for calm under pressure. Reflect on control, duty and resilience with memory that follows your practice.",
    h1: "Talk to Marcus Aurelius AI",
    summary:
      "A quiet, firm companion for when the day is loud — focused on what you can control and what deserves your attention.",
    bullets: [
      "Morning and evening reflection prompts",
      "Separates events from judgments",
      "Remembers the frictions you named last week",
      "Pairs well with the Stoic Mentor for practice",
    ],
    topics: ["Stoicism", "Duty", "Resilience", "Attention"],
    sampleDialogue: [
      {
        role: "user",
        text: "Everything at work feels urgent and I am losing focus.",
      },
      {
        role: "persona",
        text: "Name one thing that is truly yours to act on before noon. The rest can wait outside the gate.",
      },
    ],
    faqs: [
      {
        q: "Is this therapy?",
        a: "No. It is a reflective AI companion inspired by Stoic practice — not clinical care.",
      },
    ],
    related: [
      { verb: "learn", slug: "stoic-mentor", label: "Stoic mentor" },
      { verb: "meet", slug: "plato", label: "Talk to Plato" },
      { verb: "learn", slug: "interview-coach", label: "Interview coach" },
    ],
    demoSlug: "marcus-aurelius",
    ctaPrimary: { label: "Talk to Marcus Aurelius", href: "/c/marcus-aurelius" },
    ctaSecondary: {
      label: "Create your own version",
      href: "/handler/sign-up",
    },
    disclaimer: hist,
  },
  {
    verb: "meet",
    slug: "aristotle",
    category: "Great Minds",
    name: "Aristotle",
    title: "Talk to Aristotle AI — Logic, Ethics and Habits | Vesperer",
    metaDescription:
      "Discuss virtue, logic and practical wisdom with an Aristotle AI persona. Build arguments that carry across sessions.",
    h1: "Talk to Aristotle AI",
    summary:
      "A practical mind for ethics and habits — less mysticism, more cause, effect and the golden mean.",
    bullets: [
      "Ethics as practice, not slogans",
      "Help structuring arguments and categories",
      "Remembers the habits you are trying to build",
      "Great pairing for philosophy tutors",
    ],
    topics: ["Virtue ethics", "Logic", "Habits", "Rhetoric"],
    sampleDialogue: [
      {
        role: "user",
        text: "How do I stop procrastinating without burning out?",
      },
      {
        role: "persona",
        text: "Virtue sits between excess and deficiency. What is the smallest complete action that still counts as work today?",
      },
    ],
    faqs: [
      {
        q: "Can students use this?",
        a: "Yes for learning and debate. It is an interpretation, so cite primary sources for academic work.",
      },
    ],
    related: [
      { verb: "meet", slug: "plato", label: "Talk to Plato" },
      { verb: "learn", slug: "philosophy-tutor", label: "Philosophy tutor" },
      {
        verb: "create",
        slug: "historical-persona",
        label: "Create a historical persona",
      },
    ],
    demoSlug: "aristotle",
    ctaPrimary: { label: "Talk to Aristotle", href: "/c/aristotle" },
    ctaSecondary: {
      label: "Create your own version",
      href: "/handler/sign-up",
    },
    disclaimer: hist,
  },
  {
    verb: "meet",
    slug: "albert-einstein",
    category: "Great Minds",
    name: "Albert Einstein",
    title: "Chat with Albert Einstein AI — Physics, Curiosity and Ideas",
    metaDescription:
      "Talk with an Einstein AI persona about physics, creativity and thought experiments. Same curiosity across chat and voice.",
    h1: "Chat with Albert Einstein AI",
    summary:
      "Curiosity without chalkboard boredom — thought experiments, clear metaphors, and honest uncertainty.",
    bullets: [
      "Physics intuition for beginners and enthusiasts",
      "Creativity and how ideas form",
      "Remembers the puzzles you left half-solved",
      "Voice-ready demo available",
    ],
    topics: ["Relativity", "Thought experiments", "Creativity", "Science"],
    sampleDialogue: [
      {
        role: "user",
        text: "Why does light always win the race?",
      },
      {
        role: "persona",
        text: "Imagine chasing a beam on a bicycle that never quite catches it — what must be strange about time for that to be true?",
      },
    ],
    faqs: [
      {
        q: "Is this accurate physics?",
        a: "It aims for conceptual clarity. For formal study, verify with textbooks and instructors.",
      },
    ],
    related: [
      { verb: "meet", slug: "isaac-newton", label: "Talk to Newton" },
      { verb: "learn", slug: "physics-tutor", label: "Physics tutor" },
      { verb: "meet", slug: "nikola-tesla", label: "Talk to Tesla" },
    ],
    demoSlug: "einstein",
    voiceHint: true,
    ctaPrimary: { label: "Talk to Einstein", href: "/c/einstein" },
    ctaSecondary: {
      label: "Create your own version",
      href: "/handler/sign-up",
    },
    disclaimer: hist,
  },
  {
    verb: "meet",
    slug: "marie-curie",
    category: "Great Minds",
    name: "Marie Curie",
    title: "Talk to Marie Curie AI — Science, Persistence and Discovery",
    metaDescription:
      "A Marie Curie AI persona for conversations about scientific method, persistence and discovery. Memory keeps your questions building.",
    h1: "Talk to Marie Curie AI",
    summary:
      "Rigour with quiet fire — a companion for scientific curiosity, doubt, and the long work of discovery.",
    bullets: [
      "Scientific method without intimidation",
      "Stories of persistence under constraint",
      "Remembers your experiment questions",
      "Useful for students and museum visitors",
    ],
    topics: ["Radioactivity", "Method", "Women in science", "Discovery"],
    sampleDialogue: [
      {
        role: "user",
        text: "I am scared my research idea is too small.",
      },
      {
        role: "persona",
        text: "Small questions, pursued carefully, have moved the world. What evidence would make your idea sharper by Friday?",
      },
    ],
    faqs: [
      {
        q: "Can museums use this?",
        a: "Yes. Pair with archival materials via a custom institutional persona for exhibitions and education.",
      },
    ],
    related: [
      { verb: "hire", slug: "museum-guide", label: "AI museum guide" },
      { verb: "learn", slug: "history-tutor", label: "History tutor" },
      { verb: "meet", slug: "ada-lovelace", label: "Talk to Ada Lovelace" },
    ],
    demoSlug: "marie-curie",
    ctaPrimary: { label: "Talk to Marie Curie", href: "/c/marie-curie" },
    ctaSecondary: {
      label: "Create your own version",
      href: "/handler/sign-up",
    },
    disclaimer: hist,
  },
  {
    verb: "meet",
    slug: "leonardo-da-vinci",
    category: "Great Minds",
    name: "Leonardo da Vinci",
    title: "Talk to Leonardo da Vinci AI — Art, Invention and Observation",
    metaDescription:
      "Sketch ideas with a Leonardo AI persona — observation, invention and cross-disciplinary curiosity that remembers your projects.",
    h1: "Talk to Leonardo da Vinci AI",
    summary:
      "Notebooks made conversational — observation first, invention second, wonder throughout.",
    bullets: [
      "Brainstorm inventions and visual ideas",
      "Connect art, anatomy and engineering",
      "Remembers sketches of thought you left mid-way",
      "Inspiring for creators and classrooms",
    ],
    topics: ["Observation", "Invention", "Drawing", "Curiosity"],
    sampleDialogue: [
      {
        role: "user",
        text: "I want to invent something but I only doodle.",
      },
      {
        role: "persona",
        text: "Doodles are questions in ink. Describe the last thing you drew — we will ask what nature already solved nearby.",
      },
    ],
    faqs: [
      {
        q: "Will it generate images?",
        a: "This persona focuses on conversation and ideation. Pair with your own tools for rendering.",
      },
    ],
    related: [
      {
        verb: "create",
        slug: "virtual-influencer",
        label: "Create a virtual influencer",
      },
      { verb: "meet", slug: "ada-lovelace", label: "Talk to Ada Lovelace" },
      { verb: "hire", slug: "museum-guide", label: "Museum guide" },
    ],
    demoSlug: "leonardo-da-vinci",
    ctaPrimary: {
      label: "Talk to Leonardo",
      href: "/c/leonardo-da-vinci",
    },
    ctaSecondary: {
      label: "Create your own version",
      href: "/handler/sign-up",
    },
    disclaimer: hist,
  },
  {
    verb: "meet",
    slug: "nikola-tesla",
    category: "Great Minds",
    name: "Nikola Tesla",
    title: "Talk to Nikola Tesla AI — Electricity, Vision and Invention",
    metaDescription:
      "Converse with a Tesla AI persona about electricity, invention and bold technical visions — with memory across sessions.",
    h1: "Talk to Nikola Tesla AI",
    summary:
      "High-voltage imagination grounded in engineering curiosity — for makers who think in systems.",
    bullets: [
      "Electricity and wireless ideas explained accessibly",
      "Visionary brainstorming with practical follow-ups",
      "Remembers the inventions you are sketching",
      "Pairs with physics tutoring paths",
    ],
    topics: ["Electricity", "Invention", "Energy", "Systems"],
    sampleDialogue: [
      {
        role: "user",
        text: "How do I think bigger about my engineering side project?",
      },
      {
        role: "persona",
        text: "Start from the force you wish to transmit, not the gadget. What constraint, if removed, would change everything?",
      },
    ],
    faqs: [
      {
        q: "Does it push conspiracy myths?",
        a: "No. It stays with inventive curiosity and historically inspired themes, not fringe lore.",
      },
    ],
    related: [
      { verb: "meet", slug: "albert-einstein", label: "Talk to Einstein" },
      { verb: "learn", slug: "physics-tutor", label: "Physics tutor" },
      { verb: "create", slug: "ai-character", label: "Create an AI character" },
    ],
    demoSlug: "nikola-tesla",
    ctaPrimary: { label: "Talk to Tesla", href: "/c/nikola-tesla" },
    ctaSecondary: {
      label: "Create your own version",
      href: "/handler/sign-up",
    },
    disclaimer: hist,
  },
  {
    verb: "meet",
    slug: "ada-lovelace",
    category: "Great Minds",
    name: "Ada Lovelace",
    title: "Talk to Ada Lovelace AI — Computing and Imagination | Vesperer",
    metaDescription:
      "Meet an Ada Lovelace AI persona — poetry meeting computation. Discuss algorithms, creativity and the future of machines with lasting memory.",
    h1: "Talk to Ada Lovelace AI",
    summary:
      "Where analytical engines meet imagination — a companion for thinking about what computation can become.",
    bullets: [
      "Early computing ideas made vivid",
      "Creativity alongside rigorous thinking",
      "Remembers your learning goals",
      "Great for students and creators",
    ],
    topics: ["Computing", "Imagination", "Algorithms", "History of tech"],
    sampleDialogue: [
      {
        role: "user",
        text: "Are computers only for calculation?",
      },
      {
        role: "persona",
        text: "Calculation is the loom. Music, images and stories can be woven on it — if we dare to compose for the machine.",
      },
    ],
    faqs: [
      {
        q: "Is this for programmers only?",
        a: "No. It welcomes curious beginners and interdisciplinary thinkers alike.",
      },
    ],
    related: [
      { verb: "meet", slug: "marie-curie", label: "Talk to Marie Curie" },
      {
        verb: "create",
        slug: "ai-version-of-yourself",
        label: "Create an AI version of yourself",
      },
      { verb: "learn", slug: "writing-mentor", label: "Writing mentor" },
    ],
    demoSlug: "ada-lovelace",
    ctaPrimary: { label: "Talk to Ada Lovelace", href: "/c/ada-lovelace" },
    ctaSecondary: {
      label: "Create your own version",
      href: "/handler/sign-up",
    },
    disclaimer: hist,
  },
  {
    verb: "meet",
    slug: "isaac-newton",
    category: "Great Minds",
    name: "Isaac Newton",
    title: "Talk to Isaac Newton AI — Motion, Gravity and Method | Vesperer",
    metaDescription:
      "Chat with a Newton AI persona about motion, gravity and careful method. Build understanding that continues across sessions.",
    h1: "Talk to Isaac Newton AI",
    summary:
      "Precise, occasionally stern, always interested in the law beneath the appearance.",
    bullets: [
      "Classical mechanics intuition",
      "Method and careful measurement",
      "Remembers which examples clicked for you",
      "Complements Einstein for modern contrast",
    ],
    topics: ["Gravity", "Motion", "Optics", "Method"],
    sampleDialogue: [
      {
        role: "user",
        text: "Why do apples fall but the moon does not?",
      },
      {
        role: "persona",
        text: "Perhaps the moon is falling — forever missing the Earth. Shall we draw the path together?",
      },
    ],
    faqs: [
      {
        q: "Will it do my homework?",
        a: "It helps you reason through problems. You still own the work and the learning.",
      },
    ],
    related: [
      { verb: "meet", slug: "albert-einstein", label: "Talk to Einstein" },
      { verb: "learn", slug: "physics-tutor", label: "Physics tutor" },
      { verb: "learn", slug: "history-tutor", label: "History tutor" },
    ],
    demoSlug: "isaac-newton",
    ctaPrimary: { label: "Talk to Newton", href: "/c/isaac-newton" },
    ctaSecondary: {
      label: "Create your own version",
      href: "/handler/sign-up",
    },
    disclaimer: hist,
  },
];
