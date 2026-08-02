import "dotenv/config";
import { prisma } from "../src/lib/db";
import {
  buildMindGraph,
  publicLayersToMindDocs,
  layersToMindDocs,
} from "../src/lib/persona/mind-graph";
import { resolveSubject } from "../src/lib/persona/subject";
import {
  normalizeAffect,
  parseCurrentTone,
  clamp01,
} from "../src/lib/persona/affect";

async function main() {
  const subjects = await prisma.relationshipSubject.count();
  const rs = await prisma.relationshipState.findFirst({
    include: { subject: true },
  });
  const mem = await prisma.memory.findFirst({
    select: { subjectId: true, userId: true },
  });
  const intentions = await prisma.openIntention.count();
  const jobs = await prisma.postTurnJob.count();

  console.log("counts", { subjects, intentions, jobs, hasRs: !!rs, hasMem: !!mem });

  if (rs) {
    const a = normalizeAffect(rs);
    console.log("affect", {
      tone: a.currentTone,
      trust: a.trust,
      familiarity: a.familiarity,
    });
  }

  const pub = publicLayersToMindDocs({
    name: "Test",
    tagline: "Public bio",
    openingLine: "Hello",
    categories: ["Mentors"],
    styleMd: "# Style\nCasual and warm texting with short lines.",
    traits: ["warmth"],
  });
  const pubGraph = buildMindGraph(pub, { rootLabel: "Test" });
  const hasRules = pubGraph.nodes.some(
    (n) => /rules/i.test(n.label) || /rules/i.test(n.detail ?? ""),
  );
  console.log("public allowlist", {
    nodes: pubGraph.nodes.length,
    hasRules,
    types: [...new Set(pubGraph.nodes.map((n) => n.type))],
  });

  const full = layersToMindDocs({
    soulMd: "# Soul\nI am curious.",
    styleMd: "# Style\nShort.",
    rulesMd: "# Rules\nNever share API keys.",
    contextMd: "# Context\nLives in Lisbon.",
  });
  const fullGraph = buildMindGraph(full, { rootLabel: "Luna" });
  console.log("auth self layers", {
    nodes: fullGraph.nodes.length,
    universes: [...new Set(fullGraph.nodes.map((n) => n.universe))],
  });

  console.log(
    "clamp/tone",
    clamp01(1.5),
    parseCurrentTone("playful"),
    parseCurrentTone("evil"),
  );

  const ws = await prisma.workspace.findFirst();
  const user = await prisma.user.findFirst({ where: { isTelegramPeer: false } });
  if (ws && user) {
    const s = await resolveSubject({
      workspaceId: ws.id,
      webUserId: user.id,
      displayName: user.name,
    });
    console.log("resolveSubject", s.id, s.webUserId);
  }

  if (hasRules) {
    throw new Error("Public graph must not expose rules");
  }

  await prisma.$disconnect();
  console.log("smoke ok");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
