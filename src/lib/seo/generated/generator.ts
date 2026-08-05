import { generateText, Output } from "ai";
import { Prisma } from "@/generated/prisma/client";
import { getOpenRouter } from "@/lib/ai/openrouter";
import { resolveModel } from "@/lib/ai/models";
import { prisma } from "@/lib/db";
import { getSeoAutomationSettings } from "@/lib/platform/settings";
import { pickNextSeoTopic } from "@/lib/seo/generated/ideas";
import {
  seoGeneratedContentSchema,
  seoGeneratedReviewSchema,
  type SeoGeneratedContent,
  type SeoGenerationTopic,
} from "@/lib/seo/generated/schema";

export type SeoAutomationSource = "cron" | "manual";

export type SeoAutomationRunResult = {
  ok: boolean;
  skipped?: boolean;
  reason?: string;
  runId?: string;
  attempted: number;
  created: number;
  published: number;
  errors: string[];
};

function utcDayStart(now = new Date()) {
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );
}

function asJsonObject(value: Record<string, unknown>) {
  return value as Prisma.InputJsonObject;
}

async function loadUsedTopics() {
  const rows = await prisma.seoGeneratedPage.findMany({
    select: { slug: true, topicFingerprint: true },
  });

  return {
    usedSlugs: new Set(rows.map((row) => row.slug)),
    usedFingerprints: new Set(rows.map((row) => row.topicFingerprint)),
    offset: rows.length,
  };
}

function productFacts() {
  return [
    "Vesperer creates persistent AI personas, not one-off chatbots.",
    "Personas have identity layers, style, rules, context, long-term memory, and relationship state.",
    "A public persona can be published to the registry, forked, exported, and reused across channels.",
    "Supported surfaces include web chat, voice demos, Telegram bots, API keys, knowledge packs, and workspaces.",
    "The product is useful for companions, mentors, educators, creators, agencies, platforms, and AI employees.",
    "Do not claim integrations that are not live: WhatsApp and Discord are not available yet.",
    "Keep all public SEO content SFW and avoid adult/sexual content.",
  ].join("\n- ");
}

async function generatePageContent(
  topic: SeoGenerationTopic,
  modelId: string,
): Promise<SeoGeneratedContent> {
  const openrouter = getOpenRouter();
  const { output } = await generateText({
    model: openrouter(resolveModel(modelId)),
    output: Output.object({ schema: seoGeneratedContentSchema }),
    prompt: `You write programmatic SEO pages for Vesperer.
Goal: create one original, useful, search-indexable use-case page.
Language: English.
Tone: concrete, commercially useful, imaginative but real. No generic AI hype.

Product facts:
- ${productFacts()}

Topic:
- Audience: ${topic.audience}
- Use case: ${topic.useCase}
- Search intent: ${topic.intent}
- Channel: ${topic.channel}
- Product angle: ${topic.productAngle}
- Category: ${topic.category}

Rules:
- Never repeat the topic phrasing word-for-word in every heading.
- Make the use case creative but operationally plausible today with Vesperer.
- Mention only real Vesperer capabilities from the product facts.
- Do not mention pricing.
- Do not invent customers, metrics, guarantees, legal claims, medical outcomes, or unavailable integrations.
- Public SFW only.
- The page should explain when Vesperer is the right fit and when a simpler FAQ bot is enough.
- Return structured JSON only.`,
  });

  if (!output) {
    throw new Error("AI did not return SEO content");
  }

  return output;
}

async function reviewPageContent(params: {
  topic: SeoGenerationTopic;
  content: SeoGeneratedContent;
  reviewerModel: string;
}) {
  const openrouter = getOpenRouter();
  const { output } = await generateText({
    model: openrouter(resolveModel(params.reviewerModel)),
    output: Output.object({ schema: seoGeneratedReviewSchema }),
    prompt: `Review this Vesperer SEO page for publication quality.

Product truth:
- ${productFacts()}

Topic fingerprint: ${params.topic.fingerprint}
Content JSON:
${JSON.stringify(params.content)}

Score 0-100. Publishable only if:
- It is specific to the topic and not generic.
- It does not invent unavailable features, customers, prices, results, or integrations.
- It is SFW.
- It has a clear search intent and useful sections.
- It is not repetitive or thin.`,
  });

  if (!output) {
    throw new Error("AI did not return SEO review");
  }

  return output;
}

export async function runSeoAutomation(params: {
  source: SeoAutomationSource;
  ignoreEnabled?: boolean;
  maxPages?: number;
}): Promise<SeoAutomationRunResult> {
  const settings = await getSeoAutomationSettings();
  if (!settings.enabled && !params.ignoreEnabled) {
    return {
      ok: true,
      skipped: true,
      reason: "SEO automation is paused",
      attempted: 0,
      created: 0,
      published: 0,
      errors: [],
    };
  }

  const today = utcDayStart();
  const createdToday = await prisma.seoGeneratedPage.count({
    where: { generatedAt: { gte: today } },
  });
  const remainingToday = Math.max(0, settings.dailyPageLimit - createdToday);
  const requested = Math.max(1, params.maxPages ?? settings.dailyPageLimit);
  const planned = Math.min(remainingToday, requested);

  if (planned <= 0) {
    return {
      ok: true,
      skipped: true,
      reason: "Daily page limit reached",
      attempted: 0,
      created: 0,
      published: 0,
      errors: [],
    };
  }

  const run = await prisma.seoGenerationRun.create({
    data: {
      source: params.source,
      settingsJson: asJsonObject({
        enabled: settings.enabled,
        mode: settings.mode,
        dailyPageLimit: settings.dailyPageLimit,
        dailyBudgetCents: settings.dailyBudgetCents,
        writerModel: settings.writerModel,
        reviewerModel: settings.reviewerModel,
        minPublishScore: settings.minPublishScore,
      }),
    },
  });

  let attempted = 0;
  let created = 0;
  let published = 0;
  const errors: string[] = [];

  try {
    const used = await loadUsedTopics();

    for (let i = 0; i < planned; i += 1) {
      const topic = pickNextSeoTopic({
        ...used,
        offset: used.offset + i,
      });
      if (!topic) {
        errors.push("No unused SEO topic candidates left");
        break;
      }

      attempted += 1;
      used.usedSlugs.add(topic.slug);
      used.usedFingerprints.add(topic.fingerprint);

      try {
        const content = await generatePageContent(topic, settings.writerModel);
        const review = await reviewPageContent({
          topic,
          content,
          reviewerModel: settings.reviewerModel,
        });
        const shouldPublish =
          settings.mode === "autopublish" &&
          review.publishable &&
          review.score >= settings.minPublishScore;

        await prisma.seoGeneratedPage.create({
          data: {
            slug: topic.slug,
            title: content.title,
            h1: content.h1,
            metaDescription: content.metaDescription,
            summary: content.summary,
            category: topic.category,
            audience: topic.audience,
            useCase: topic.useCase,
            intent: topic.intent,
            status: shouldPublish ? "published" : "draft",
            topicFingerprint: topic.fingerprint,
            contentJson: content as Prisma.InputJsonObject,
            qaJson: review as Prisma.InputJsonObject,
            score: review.score,
            model: resolveModel(settings.writerModel),
            reviewerModel: resolveModel(settings.reviewerModel),
            costCents: 0,
            publishedAt: shouldPublish ? new Date() : null,
          },
        });

        created += 1;
        if (shouldPublish) published += 1;
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Unknown SEO generation error";
        errors.push(`${topic.slug}: ${message}`);
      }
    }

    const ok = errors.length === 0 || created > 0;
    await prisma.seoGenerationRun.update({
      where: { id: run.id },
      data: {
        status: ok ? "completed" : "failed",
        pagesAttempted: attempted,
        pagesCreated: created,
        pagesPublished: published,
        error: errors.length ? errors.join("\n") : null,
        finishedAt: new Date(),
      },
    });

    return {
      ok,
      runId: run.id,
      attempted,
      created,
      published,
      errors,
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown SEO automation error";
    await prisma.seoGenerationRun.update({
      where: { id: run.id },
      data: {
        status: "failed",
        pagesAttempted: attempted,
        pagesCreated: created,
        pagesPublished: published,
        error: message,
        finishedAt: new Date(),
      },
    });

    return {
      ok: false,
      runId: run.id,
      attempted,
      created,
      published,
      errors: [message],
    };
  }
}
