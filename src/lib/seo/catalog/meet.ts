import type { SeoPage } from "./types";

const hist =
  "This is an AI interpretation based on available sources, not the real historical individual.";

const MEET_DETAILS: Record<
  string,
  Pick<
    SeoPage,
    "intro" | "suggestedQuestions" | "factualContext" | "sources"
  >
> = {
  plato: {
    intro:
      "Use this landing page when you want a guided conversation with a Plato-inspired AI, then move into the live chat once you have a question worth testing.",
    factualContext:
      "Plato was a classical Greek philosopher, student of Socrates and teacher of Aristotle. His dialogues explore justice, knowledge, virtue, education and political life, often through dramatic conversations rather than direct doctrine.",
    suggestedQuestions: [
      "What would make a city just, and does that differ from a just person?",
      "Can you remember my definition of virtue and test it again?",
      "How should I read The Republic without treating it as a simple blueprint?",
    ],
    sources: [
      {
        label: "Stanford Encyclopedia of Philosophy: Plato",
        href: "https://plato.stanford.edu/entries/plato/",
        note: "Biographical and philosophical context for Plato's works and themes.",
      },
      {
        label: "Project Gutenberg: The Republic",
        href: "https://www.gutenberg.org/ebooks/1497",
        note: "Public-domain translation used as a reference point for dialogue themes.",
      },
    ],
  },
  socrates: {
    intro:
      "This page is the search landing for a Socrates-inspired AI. The live product route is the chat; this page explains what the persona is for and how memory changes the conversation.",
    factualContext:
      "Socrates left no writings of his own. He is primarily known through Plato, Xenophon and later ancient sources, especially for inquiry through questions, ethical examination and public philosophical dialogue in Athens.",
    suggestedQuestions: [
      "What do I really mean when I say I want to be successful?",
      "Can you remember the definition I gave last time and find its weakness?",
      "How would you question this belief without turning it into a debate performance?",
    ],
    sources: [
      {
        label: "Stanford Encyclopedia of Philosophy: Socrates",
        href: "https://plato.stanford.edu/entries/socrates/",
        note: "Source context for the historical Socrates and Socratic method.",
      },
      {
        label: "Project Gutenberg: Apology",
        href: "https://www.gutenberg.org/ebooks/1656",
        note: "Public-domain text associated with Socrates' trial tradition.",
      },
    ],
  },
  "marcus-aurelius": {
    intro:
      "Use Marcus Aurelius AI for short, practical reflection. The persona is built around Stoic themes and works best when it can remember your recurring pressure points.",
    factualContext:
      "Marcus Aurelius was a Roman emperor and Stoic writer. The Meditations are private philosophical notes concerned with duty, judgment, mortality, discipline and attention.",
    suggestedQuestions: [
      "What judgment am I adding to this event?",
      "Can you remember the pressure pattern I named last week?",
      "Give me a morning practice based on what I can control today.",
    ],
    sources: [
      {
        label: "Stanford Encyclopedia of Philosophy: Marcus Aurelius",
        href: "https://plato.stanford.edu/entries/marcus-aurelius/",
        note: "Historical and philosophical context for Marcus Aurelius.",
      },
      {
        label: "Project Gutenberg: Meditations",
        href: "https://www.gutenberg.org/ebooks/2680",
        note: "Public-domain translation used as a thematic reference.",
      },
    ],
  },
  aristotle: {
    intro:
      "This Aristotle AI page is for practical philosophy, logic and habits. It points to the live persona without competing with tutor pages for broad philosophy-learning intent.",
    factualContext:
      "Aristotle was a Greek philosopher whose surviving works shaped logic, ethics, politics, biology, rhetoric and metaphysics. He studied at Plato's Academy and later founded the Lyceum.",
    suggestedQuestions: [
      "What is the golden mean in this specific habit?",
      "Can you help me classify this argument before judging it?",
      "How would practical wisdom approach a tradeoff like this?",
    ],
    sources: [
      {
        label: "Stanford Encyclopedia of Philosophy: Aristotle",
        href: "https://plato.stanford.edu/entries/aristotle/",
        note: "Overview of Aristotle's life, corpus and philosophical system.",
      },
      {
        label: "Project Gutenberg: Nicomachean Ethics",
        href: "https://www.gutenberg.org/ebooks/8438",
        note: "Public-domain translation for ethics-related themes.",
      },
    ],
  },
  "albert-einstein": {
    intro:
      "This Einstein AI landing targets conversation with a historically inspired persona, while the physics tutor page handles structured learning intent.",
    factualContext:
      "Albert Einstein was a theoretical physicist known for special and general relativity, work on the photoelectric effect, and public writing about science, curiosity and society.",
    suggestedQuestions: [
      "Can you explain relativity with a thought experiment instead of formulas first?",
      "What puzzle should I keep thinking about after this session?",
      "How did imagination and constraint work together in your scientific thinking?",
    ],
    sources: [
      {
        label: "Nobel Prize: Albert Einstein",
        href: "https://www.nobelprize.org/prizes/physics/1921/einstein/biographical/",
        note: "Biographical source for Einstein's scientific career.",
      },
      {
        label: "Encyclopaedia Britannica: Albert Einstein",
        href: "https://www.britannica.com/biography/Albert-Einstein",
        note: "General reference for historical context.",
      },
    ],
  },
  "marie-curie": {
    intro:
      "Use Marie Curie AI for conversations about scientific persistence, method and discovery. For classroom structure, the history tutor and museum guide pages connect nearby intent.",
    factualContext:
      "Marie Curie was a physicist and chemist known for pioneering research on radioactivity. She received Nobel Prizes in Physics and Chemistry and helped define a new field of scientific inquiry.",
    suggestedQuestions: [
      "How do I keep going when the evidence is slow?",
      "Can you help me ask a more testable research question?",
      "What should a museum visitor understand about radioactivity without oversimplifying it?",
    ],
    sources: [
      {
        label: "Nobel Prize: Marie Curie",
        href: "https://www.nobelprize.org/prizes/physics/1903/marie-curie/biographical/",
        note: "Biographical context from Nobel Prize materials.",
      },
      {
        label: "Nobel Prize: Chemistry 1911",
        href: "https://www.nobelprize.org/prizes/chemistry/1911/marie-curie/facts/",
        note: "Reference for Curie's later Nobel recognition.",
      },
    ],
  },
  "leonardo-da-vinci": {
    intro:
      "This Leonardo AI landing focuses on art, invention and observation. It is for exploratory conversation rather than image generation or a generic creator tool.",
    factualContext:
      "Leonardo da Vinci was an Italian Renaissance artist, engineer and observer whose notebooks connect painting, anatomy, mechanics, flight, optics and natural philosophy.",
    suggestedQuestions: [
      "How should I observe this problem before trying to invent a solution?",
      "Can you turn my rough sketch idea into better questions?",
      "What can art teach my engineering project?",
    ],
    sources: [
      {
        label: "Encyclopaedia Britannica: Leonardo da Vinci",
        href: "https://www.britannica.com/biography/Leonardo-da-Vinci",
        note: "Biographical and work context for Leonardo.",
      },
      {
        label: "The Metropolitan Museum of Art: Leonardo da Vinci",
        href: "https://www.metmuseum.org/toah/hd/leon/hd_leon.htm",
        note: "Museum reference for Leonardo's artistic context.",
      },
    ],
  },
  "nikola-tesla": {
    intro:
      "Talk to Tesla AI when you want inventive, systems-level conversation about electricity and ambitious technical ideas without drifting into fringe claims.",
    factualContext:
      "Nikola Tesla was an inventor and electrical engineer associated with alternating-current systems, motors, wireless experiments and a public image of bold technical imagination.",
    suggestedQuestions: [
      "How should I think about energy transfer in this invention?",
      "Can you help me separate a bold idea from an unsupported claim?",
      "What constraint would change the whole system if I solved it?",
    ],
    sources: [
      {
        label: "Encyclopaedia Britannica: Nikola Tesla",
        href: "https://www.britannica.com/biography/Nikola-Tesla",
        note: "General historical reference for Tesla's life and work.",
      },
      {
        label: "Smithsonian: Nikola Tesla",
        href: "https://www.smithsonianmag.com/innovation/extraordinary-life-nikola-tesla-180967758/",
        note: "Context on Tesla's legacy and public mythology.",
      },
    ],
  },
  "ada-lovelace": {
    intro:
      "This Ada Lovelace AI page is for conversations about computation, imagination and early computing history, with related paths for writing and programming tutors.",
    factualContext:
      "Ada Lovelace was a mathematician and writer associated with Charles Babbage's Analytical Engine. Her notes are often discussed in histories of algorithms and computing imagination.",
    suggestedQuestions: [
      "How can computation become more than calculation?",
      "Can you connect this programming idea to a creative metaphor?",
      "What should a beginner understand about algorithms first?",
    ],
    sources: [
      {
        label: "Computer History Museum: Ada Lovelace",
        href: "https://www.computerhistory.org/babbage/adalovelace/",
        note: "Computing-history context for Lovelace and Babbage.",
      },
      {
        label: "Encyclopaedia Britannica: Ada Lovelace",
        href: "https://www.britannica.com/biography/Ada-Lovelace",
        note: "Biographical reference for Lovelace.",
      },
    ],
  },
  "isaac-newton": {
    intro:
      "This Newton AI landing supports conversation about method, motion and gravity. The physics tutor page is linked for users who want a structured learning path.",
    factualContext:
      "Isaac Newton was a mathematician and natural philosopher central to classical mechanics, gravitation, optics and calculus-era mathematical physics.",
    suggestedQuestions: [
      "Can you explain why the moon is always falling without crashing?",
      "What observation should come before the equation here?",
      "How do Newton and Einstein differ on this idea?",
    ],
    sources: [
      {
        label: "Encyclopaedia Britannica: Isaac Newton",
        href: "https://www.britannica.com/biography/Isaac-Newton",
        note: "Biographical and scientific context for Newton.",
      },
      {
        label: "The Newton Project",
        href: "https://www.newtonproject.ox.ac.uk/",
        note: "Scholarly source collection for Newton's writings.",
      },
    ],
  },
};

const MEET_PAGE_BASE: SeoPage[] = [
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

export const MEET_PAGES: SeoPage[] = MEET_PAGE_BASE.map((page) => ({
  ...page,
  ...(MEET_DETAILS[page.slug] ?? {}),
}));
