import type { SeoPage } from "./types";

export const HIRE_PAGES: SeoPage[] = [
  {
    verb: "hire",
    slug: "ai-receptionist",
    category: "Work",
    name: "AI Receptionist",
    title: "AI Receptionist That Remembers Returning Customers | Vesperer",
    metaDescription:
      "An AI receptionist that knows your services, books appointments and remembers every returning customer across chat and voice.",
    h1: "An AI receptionist that remembers every returning customer",
    summary:
      "Answer enquiries, qualify intent and continue prior conversations — so people never re-introduce themselves.",
    bullets: [
      "Responds on chat and voice with one identity",
      "Knows services, hours and pricing rules you teach it",
      "Books and reschedules with remembered preferences",
      "Hands off to a human when judgment is required",
    ],
    topics: ["Booking", "FAQs", "Returning visitors", "Handoff"],
    sampleDialogue: [
      {
        role: "user",
        text: "Hi — I was in last Friday afternoon.",
      },
      {
        role: "persona",
        text: "Welcome back. You usually prefer Friday after 3. Want the same hygienist slot, or should we look at Tuesday?",
      },
    ],
    faqs: [
      {
        q: "Does it replace staff?",
        a: "It covers routine questions and booking so your team focuses on in-person care and edge cases.",
      },
      {
        q: "Can it invent prices?",
        a: "No — it follows the knowledge and rules you configure, and escalates when unsure.",
      },
    ],
    related: [
      { verb: "hire", slug: "dental-receptionist", label: "Dental receptionist" },
      { verb: "hire", slug: "ai-booking-assistant", label: "Booking assistant" },
      { verb: "hire", slug: "ai-virtual-assistant", label: "Virtual assistant" },
      { verb: "create", slug: "ai-receptionist", label: "Create a receptionist" },
    ],
    ctaPrimary: { label: "Build an AI receptionist", href: "/handler/sign-up" },
    ctaSecondary: { label: "See pricing", href: "/#pricing" },
    roiHints: {
      label: "Missed front-desk coverage",
      missedLeadsPerWeek: 8,
      valuePerLead: 120,
      hoursSavedPerWeek: 10,
      hourlyCost: 18,
    },
  },
  {
    verb: "hire",
    slug: "ai-virtual-assistant",
    category: "Work",
    name: "AI Virtual Assistant",
    title: "AI Virtual Assistant with Persistent Memory | Vesperer",
    metaDescription:
      "Hire an AI virtual assistant that remembers preferences, open tasks and prior conversations across channels.",
    h1: "An AI virtual assistant that remembers the person",
    summary:
      "Scheduling, follow-ups and FAQs — with relationship continuity, not a blank chat every Monday.",
    bullets: [
      "Remembers preferences and open loops",
      "Consistent tone across web and Telegram",
      "Escalates exceptions to humans",
      "Teach it your playbooks once",
    ],
    topics: ["Scheduling", "Follow-ups", "Preferences", "Playbooks"],
    sampleDialogue: [
      {
        role: "user",
        text: "Can we move Thursday’s call?",
      },
      {
        role: "persona",
        text: "You asked to avoid mornings last month. I can offer Thursday 15:30 or Friday 11:00 — which works?",
      },
    ],
    faqs: [
      {
        q: "Integrations?",
        a: "Start with chat, Telegram and API. Deeper calendar wiring depends on your stack — talk to us for Business plans.",
      },
    ],
    related: [
      { verb: "hire", slug: "ai-receptionist", label: "AI receptionist" },
      { verb: "hire", slug: "ai-booking-assistant", label: "Booking assistant" },
      { verb: "create", slug: "ai-character", label: "Create a persona" },
    ],
    ctaPrimary: { label: "Build a virtual assistant", href: "/handler/sign-up" },
    ctaSecondary: { label: "See pricing", href: "/#pricing" },
    roiHints: {
      label: "Admin time recovered",
      missedLeadsPerWeek: 4,
      valuePerLead: 90,
      hoursSavedPerWeek: 12,
      hourlyCost: 22,
    },
  },
  {
    verb: "hire",
    slug: "ai-sales-agent",
    category: "Work",
    name: "AI Sales Agent",
    title: "AI Sales Agent That Remembers Every Lead | Vesperer",
    metaDescription:
      "An AI sales agent that qualifies leads, follows your pitch and remembers where each prospect left off.",
    h1: "An AI sales agent that remembers every lead",
    summary:
      "Qualify, nurture and continue prior conversations — so prospects never restart from zero.",
    bullets: [
      "Consistent pitch and objection handling",
      "Remembers stage, objections and preferences",
      "Works across chat and voice demos",
      "Hands hot leads to humans with context",
    ],
    topics: ["Qualification", "Objections", "Follow-up", "Handoff"],
    sampleDialogue: [
      {
        role: "user",
        text: "We looked at Creator vs Studio last week.",
      },
      {
        role: "persona",
        text: "You were leaning Studio for three personas. Want the same comparison with this month’s usage limits?",
      },
    ],
    faqs: [
      {
        q: "Will it hard-sell?",
        a: "It follows your rules — including when to stay helpful and when to escalate.",
      },
    ],
    related: [
      {
        verb: "hire",
        slug: "ai-customer-support",
        label: "Customer support agent",
      },
      { verb: "hire", slug: "real-estate-assistant", label: "Real-estate assistant" },
      { verb: "create", slug: "ai-character", label: "Create a sales persona" },
    ],
    ctaPrimary: { label: "Build a sales agent", href: "/handler/sign-up" },
    ctaSecondary: { label: "See pricing", href: "/#pricing" },
    roiHints: {
      label: "Leads that went cold",
      missedLeadsPerWeek: 12,
      valuePerLead: 250,
      hoursSavedPerWeek: 8,
      hourlyCost: 28,
    },
  },
  {
    verb: "hire",
    slug: "ai-customer-support",
    category: "Work",
    name: "AI Customer Support Agent",
    title: "AI Customer Support with Relationship Memory | Vesperer",
    metaDescription:
      "Support that remembers prior tickets and preferences — grounded in your docs, tone and escalation rules.",
    h1: "Support that remembers the customer, not just the ticket",
    summary:
      "Answers from your knowledge — continuity from your relationship history.",
    bullets: [
      "Grounded in your docs and policies",
      "Remembers prior issues per person",
      "Stable tone across channels",
      "Clear human handoff paths",
    ],
    topics: ["Policies", "Tickets", "Tone", "Escalation"],
    sampleDialogue: [
      {
        role: "user",
        text: "The export still fails like last Tuesday.",
      },
      {
        role: "persona",
        text: "I see — we tried the CSV path then. Let’s try the JSON export you preferred before, or escalate to a human with that history attached.",
      },
    ],
    faqs: [
      {
        q: "What if it is unsure?",
        a: "Configure escalation rules. Uncertainty should become a handoff, not a guess.",
      },
    ],
    related: [
      { verb: "hire", slug: "ai-receptionist", label: "AI receptionist" },
      { verb: "hire", slug: "ai-sales-agent", label: "Sales agent" },
      { verb: "hire", slug: "ai-virtual-assistant", label: "Virtual assistant" },
    ],
    ctaPrimary: { label: "Build a support agent", href: "/handler/sign-up" },
    ctaSecondary: { label: "See pricing", href: "/#pricing" },
    roiHints: {
      label: "Repeat contacts",
      missedLeadsPerWeek: 6,
      valuePerLead: 40,
      hoursSavedPerWeek: 15,
      hourlyCost: 20,
    },
  },
  {
    verb: "hire",
    slug: "ai-booking-assistant",
    category: "Work",
    name: "AI Appointment Booking Assistant",
    title: "AI Appointment Booking Assistant | Vesperer",
    metaDescription:
      "Book and reschedule appointments with an AI that remembers preferred times, services and returning visitors.",
    h1: "Booking that remembers how people like to schedule",
    summary:
      "Fewer no-shows from confusion — more returning visitors who feel recognised.",
    bullets: [
      "Preferred slots and services remembered",
      "Rescheduling without repetition",
      "Works alongside receptionist personas",
      "Teach your availability rules once",
    ],
    topics: ["Appointments", "Rescheduling", "Preferences", "Reminders"],
    sampleDialogue: [
      {
        role: "user",
        text: "Same time as usual?",
      },
      {
        role: "persona",
        text: "Wednesday 10:30 with Alex — confirmed last month. Shall I hold that again?",
      },
    ],
    faqs: [
      {
        q: "Calendar sync?",
        a: "Start with conversational booking and human confirmation. Deeper calendar sync is available on Business plans.",
      },
    ],
    related: [
      { verb: "hire", slug: "ai-receptionist", label: "AI receptionist" },
      { verb: "hire", slug: "dental-receptionist", label: "Dental receptionist" },
      { verb: "hire", slug: "hotel-concierge", label: "Hotel concierge" },
    ],
    ctaPrimary: { label: "Build a booking assistant", href: "/handler/sign-up" },
    ctaSecondary: { label: "See pricing", href: "/#pricing" },
    roiHints: {
      label: "Empty slots from slow replies",
      missedLeadsPerWeek: 10,
      valuePerLead: 75,
      hoursSavedPerWeek: 6,
      hourlyCost: 16,
    },
  },
  {
    verb: "hire",
    slug: "hotel-concierge",
    category: "Work",
    name: "AI Hotel Concierge",
    title: "AI Hotel Concierge for Guests Who Return | Vesperer",
    metaDescription:
      "A hotel concierge AI that knows amenities, local tips and returning guest preferences across stays.",
    h1: "A concierge that remembers returning guests",
    summary:
      "Local tips, amenity questions and stay preferences — continuity that feels like hospitality, not a FAQ bot.",
    bullets: [
      "Property knowledge you control",
      "Remembers guest preferences across stays",
      "Voice-friendly for lobby or pre-arrival",
      "Escalates VIP or sensitive requests",
    ],
    topics: ["Amenities", "Local tips", "Preferences", "Pre-arrival"],
    sampleDialogue: [
      {
        role: "user",
        text: "We stayed last spring — still have late checkout?",
      },
      {
        role: "persona",
        text: "Welcome back. You preferred a high floor and late checkout at 1pm. I can request that again for Friday.",
      },
    ],
    faqs: [
      {
        q: "Multi-property?",
        a: "Create a persona per property or brand voice — Studio and Business plans support rosters.",
      },
    ],
    related: [
      { verb: "hire", slug: "ai-receptionist", label: "AI receptionist" },
      { verb: "hire", slug: "ai-booking-assistant", label: "Booking assistant" },
      { verb: "hire", slug: "museum-guide", label: "Museum guide" },
    ],
    ctaPrimary: { label: "Build a concierge", href: "/handler/sign-up" },
    ctaSecondary: { label: "Talk to us", href: "mailto:legal@mail.vesperer.com?subject=Hotel%20concierge" },
    roiHints: {
      label: "After-hours guest questions",
      missedLeadsPerWeek: 20,
      valuePerLead: 35,
      hoursSavedPerWeek: 14,
      hourlyCost: 15,
    },
  },
  {
    verb: "hire",
    slug: "real-estate-assistant",
    category: "Work",
    name: "AI Real-Estate Assistant",
    title: "AI Real-Estate Assistant — Qualify and Remember | Vesperer",
    metaDescription:
      "Qualify buyers and renters with an AI that remembers budget, neighbourhoods and prior viewings.",
    h1: "A real-estate assistant that remembers every lead",
    summary:
      "Capture intent, answer listing questions and continue where the last chat ended.",
    bullets: [
      "Budget and neighbourhood memory per lead",
      "Listing FAQs from your materials",
      "Qualifies before human agents spend time",
      "Consistent brand voice",
    ],
    topics: ["Qualification", "Listings", "Viewings", "Follow-up"],
    sampleDialogue: [
      {
        role: "user",
        text: "Still looking near the park, max 400k.",
      },
      {
        role: "persona",
        text: "Got it — two-bed near Riverside, under 400k. The Oak Street flat you liked is still available Saturday at 11.",
      },
    ],
    faqs: [
      {
        q: "Compliance?",
        a: "You configure disclosures and rules. The persona should not invent legal advice or hide required notices.",
      },
    ],
    related: [
      { verb: "hire", slug: "ai-sales-agent", label: "Sales agent" },
      { verb: "hire", slug: "ai-receptionist", label: "Receptionist" },
      { verb: "hire", slug: "ai-virtual-assistant", label: "Virtual assistant" },
    ],
    ctaPrimary: {
      label: "Build a real-estate assistant",
      href: "/handler/sign-up",
    },
    ctaSecondary: { label: "See pricing", href: "/#pricing" },
    roiHints: {
      label: "Unanswered listing chats",
      missedLeadsPerWeek: 15,
      valuePerLead: 400,
      hoursSavedPerWeek: 9,
      hourlyCost: 30,
    },
  },
  {
    verb: "hire",
    slug: "dental-receptionist",
    category: "Work",
    name: "AI Dental Receptionist",
    title: "AI Dental Receptionist for Returning Patients | Vesperer",
    metaDescription:
      "A dental receptionist AI that knows your services, books cleanings and remembers returning patients — without generic chatbot feel.",
    h1: "A dental receptionist that remembers returning patients",
    summary:
      "Hours, services, insurance FAQs you approve — plus continuity for patients who book every six months.",
    bullets: [
      "Hygiene and treatment FAQs from your scripts",
      "Remembers preferred times and hygienists",
      "Reduces phone tag for routine booking",
      "Escalates clinical questions to staff",
    ],
    topics: ["Cleanings", "Hours", "Insurance FAQs", "Recare"],
    sampleDialogue: [
      {
        role: "user",
        text: "Need my six-month cleaning.",
      },
      {
        role: "persona",
        text: "Welcome back — you usually see Jordan on Friday afternoons. I can offer Friday 14:15 or Monday 09:00.",
      },
    ],
    faqs: [
      {
        q: "Medical advice?",
        a: "No. Clinical questions escalate. The persona handles scheduling and approved clinic information only.",
      },
    ],
    related: [
      { verb: "hire", slug: "ai-receptionist", label: "AI receptionist" },
      { verb: "hire", slug: "ai-booking-assistant", label: "Booking assistant" },
      {
        verb: "create",
        slug: "ai-receptionist",
        label: "Create a receptionist persona",
      },
    ],
    ctaPrimary: {
      label: "Build a dental receptionist",
      href: "/handler/sign-up",
    },
    ctaSecondary: {
      label: "Talk to us",
      href: "mailto:legal@mail.vesperer.com?subject=Dental%20receptionist",
    },
    roiHints: {
      label: "Missed booking calls",
      missedLeadsPerWeek: 9,
      valuePerLead: 150,
      hoursSavedPerWeek: 11,
      hourlyCost: 17,
    },
  },
  {
    verb: "hire",
    slug: "museum-guide",
    category: "Work",
    name: "AI Museum Guide",
    title: "AI Museum Guide & Historical Personas | Vesperer",
    metaDescription:
      "Turn collections into interactive guides and historical personas visitors can question through text or voice.",
    h1: "Let visitors question the collection",
    summary:
      "Ingest exhibition copy and research notes into guides and historical minds — continuity for school groups and returning members.",
    bullets: [
      "Grounded in your approved materials",
      "Historical personas with clear AI disclaimers",
      "Voice-friendly gallery experiences",
      "Remembers a visitor’s prior path when they return",
    ],
    topics: ["Collections", "Education", "Historical personas", "Voice"],
    sampleDialogue: [
      {
        role: "user",
        text: "We saw the Curie letters last visit — what is new?",
      },
      {
        role: "persona",
        text: "Welcome back. The new case adds lab notebooks from 1898. Want the five-minute highlight or a deeper path?",
      },
    ],
    faqs: [
      {
        q: "Are historical personas accurate?",
        a: "They are AI interpretations based on sources you provide — always disclosed as such to visitors.",
      },
    ],
    related: [
      { verb: "meet", slug: "marie-curie", label: "Talk to Marie Curie" },
      { verb: "meet", slug: "plato", label: "Talk to Plato" },
      {
        verb: "create",
        slug: "historical-persona",
        label: "Create a historical persona",
      },
      { verb: "learn", slug: "history-tutor", label: "History tutor" },
    ],
    ctaPrimary: { label: "Build a museum guide", href: "/handler/sign-up" },
    ctaSecondary: {
      label: "Talk to us",
      href: "mailto:legal@mail.vesperer.com?subject=Museum%20guide",
    },
    roiHints: {
      label: "After-hours visitor questions",
      missedLeadsPerWeek: 25,
      valuePerLead: 15,
      hoursSavedPerWeek: 20,
      hourlyCost: 18,
    },
  },
];
