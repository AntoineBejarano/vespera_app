import { generateText } from "ai";
import { z } from "zod";
import { getOpenRouter } from "@/lib/ai/openrouter";
import { resolveModel } from "@/lib/ai/models";
import { containsProhibitedMinorContent } from "@/lib/ai/safety";
import { getShowcaseBySlug } from "@/lib/characters/showcase";
import { redisGet, redisSet } from "@/lib/memory/redis";

export const maxDuration = 60;

const bodySchema = z.object({
  message: z.string().min(1).max(2000),
  peerId: z.string().min(8).max(80),
  agent: z.enum(["luna", "einstein", "stoic-mentor"]).default("luna"),
});

type DemoMemory = {
  facts: string[];
  turns: { role: "user" | "assistant"; content: string }[];
};

async function loadMemory(peerId: string, agent: string): Promise<DemoMemory> {
  const raw = await redisGet(`voice-demo:${agent}:${peerId}`);
  if (!raw) return { facts: [], turns: [] };
  try {
    const parsed = JSON.parse(raw) as DemoMemory;
    return {
      facts: Array.isArray(parsed.facts) ? parsed.facts.slice(0, 40) : [],
      turns: Array.isArray(parsed.turns) ? parsed.turns.slice(-16) : [],
    };
  } catch {
    return { facts: [], turns: [] };
  }
}

async function saveMemory(peerId: string, agent: string, memory: DemoMemory) {
  await redisSet(
    `voice-demo:${agent}:${peerId}`,
    JSON.stringify({
      facts: memory.facts.slice(0, 40),
      turns: memory.turns.slice(-16),
    }),
    60 * 60 * 24 * 30,
  );
}

function extractFacts(message: string, reply: string, existing: string[]): string[] {
  const next = [...existing];
  const patterns = [
    /(?:my name is|i'm|i am)\s+([A-Z][a-z]+)/i,
    /(?:i live in|i'm from|i am from)\s+([A-Za-z\s]+)/i,
    /(?:i work as|i'm a|i am a)\s+([A-Za-z\s]+)/i,
    /(?:remember that|don't forget)\s+(.+)/i,
  ];
  for (const pattern of patterns) {
    const m = message.match(pattern);
    if (m?.[1]) {
      const fact = m[0].trim().slice(0, 120);
      if (!next.some((f) => f.toLowerCase() === fact.toLowerCase())) {
        next.unshift(fact);
      }
    }
  }
  // Keep short memorable assistant commitments
  if (/i('ll| will) remember/i.test(reply) && message.length < 160) {
    const fact = `User said: ${message.trim().slice(0, 100)}`;
    if (!next.some((f) => f.toLowerCase() === fact.toLowerCase())) {
      next.unshift(fact);
    }
  }
  return next.slice(0, 40);
}

export async function POST(req: Request) {
  const parsed = bodySchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return Response.json({ error: "Invalid voice demo payload" }, { status: 400 });
  }

  const { message, peerId, agent } = parsed.data;
  if (containsProhibitedMinorContent(message)) {
    return Response.json(
      { error: "Message blocked by safety filters." },
      { status: 400 },
    );
  }

  const showcase = getShowcaseBySlug(agent);
  if (!showcase) {
    return Response.json({ error: "Unknown agent" }, { status: 404 });
  }

  const memory = await loadMemory(peerId, agent);
  const memoryBlock = memory.facts.length
    ? `Long-term memory about this caller (never forget these):\n${memory.facts.map((f) => `- ${f}`).join("\n")}`
    : "No prior long-term memories yet. Learn important facts naturally.";

  const system = `${showcase.soulMd}

${showcase.styleMd}

${showcase.rulesMd}

${showcase.contextMd}

You are speaking on a live voice call. Keep replies short (1–3 spoken sentences), natural, and conversational — no markdown, no bullet lists.
Always use long-term memory. If the caller mentioned their name, plans, preferences, or promises before, reference them.
${memoryBlock}`;

  try {
    const openrouter = getOpenRouter();
    const modelId = resolveModel(null);
    const { text } = await generateText({
      model: openrouter(modelId),
      system,
      messages: [
        ...memory.turns.map((t) => ({
          role: t.role as "user" | "assistant",
          content: t.content,
        })),
        { role: "user", content: message },
      ],
      temperature: 0.8,
    });

    const reply = (text || "I'm here — tell me more.").trim();
    const facts = extractFacts(message, reply, memory.facts);
    const turns = [
      ...memory.turns,
      { role: "user" as const, content: message },
      { role: "assistant" as const, content: reply },
    ].slice(-16);

    await saveMemory(peerId, agent, { facts, turns });

    return Response.json({
      text: reply,
      agent: {
        slug: showcase.slug,
        name: showcase.name,
        imageUrl: showcase.imageUrl,
        openingLine: showcase.openingLine,
      },
      memories: facts.slice(0, 8),
      rememberedCount: facts.length,
    });
  } catch (error) {
    console.error("[voice/demo]", error);
    return Response.json(
      { error: "Voice agent unavailable right now. Try again in a moment." },
      { status: 502 },
    );
  }
}
