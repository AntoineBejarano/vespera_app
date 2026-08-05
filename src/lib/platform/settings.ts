import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";

export const SEO_AUTOMATION_SETTING_KEY = "seo_automation";

export type SeoAutomationMode = "draft_only" | "autopublish";

export type SeoAutomationSettings = {
  enabled: boolean;
  mode: SeoAutomationMode;
  dailyPageLimit: number;
  dailyBudgetCents: number;
  writerModel: string;
  reviewerModel: string;
  minPublishScore: number;
  updatedByUserId: string | null;
  updatedAt: string | null;
};

export const DEFAULT_SEO_AUTOMATION_SETTINGS: SeoAutomationSettings = {
  enabled: false,
  mode: "draft_only",
  dailyPageLimit: 3,
  dailyBudgetCents: 300,
  writerModel: "gpt-5.6-terra",
  reviewerModel: "gpt-5.6-luna",
  minPublishScore: 85,
  updatedByUserId: null,
  updatedAt: null,
};

function numberInRange(value: unknown, fallback: number, min: number, max: number) {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, Math.round(n)));
}

function stringOr(value: unknown, fallback: string) {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

export function parseSeoAutomationSettings(
  raw: unknown,
  meta?: { updatedByUserId?: string | null; updatedAt?: Date | null },
): SeoAutomationSettings {
  const value =
    raw && typeof raw === "object" && !Array.isArray(raw)
      ? (raw as Record<string, unknown>)
      : {};
  const mode = value.mode === "autopublish" ? "autopublish" : "draft_only";

  return {
    enabled: Boolean(value.enabled),
    mode,
    dailyPageLimit: numberInRange(
      value.dailyPageLimit,
      DEFAULT_SEO_AUTOMATION_SETTINGS.dailyPageLimit,
      1,
      25,
    ),
    dailyBudgetCents: numberInRange(
      value.dailyBudgetCents,
      DEFAULT_SEO_AUTOMATION_SETTINGS.dailyBudgetCents,
      0,
      10000,
    ),
    writerModel: stringOr(
      value.writerModel,
      DEFAULT_SEO_AUTOMATION_SETTINGS.writerModel,
    ),
    reviewerModel: stringOr(
      value.reviewerModel,
      DEFAULT_SEO_AUTOMATION_SETTINGS.reviewerModel,
    ),
    minPublishScore: numberInRange(
      value.minPublishScore,
      DEFAULT_SEO_AUTOMATION_SETTINGS.minPublishScore,
      50,
      100,
    ),
    updatedByUserId: meta?.updatedByUserId ?? null,
    updatedAt: meta?.updatedAt ? meta.updatedAt.toISOString() : null,
  };
}

export async function getSeoAutomationSettings() {
  const row = await prisma.platformSetting
    .findUnique({
      where: { key: SEO_AUTOMATION_SETTING_KEY },
    })
    .catch((err) => {
      console.error("[platform_settings] failed to load seo automation", {
        err,
      });
      return null;
    });

  return parseSeoAutomationSettings(row?.value, {
    updatedByUserId: row?.updatedByUserId ?? null,
    updatedAt: row?.updatedAt ?? null,
  });
}

export async function saveSeoAutomationSettings(
  next: Omit<SeoAutomationSettings, "updatedByUserId" | "updatedAt">,
  updatedByUserId: string,
) {
  const value = {
    enabled: next.enabled,
    mode: next.mode,
    dailyPageLimit: next.dailyPageLimit,
    dailyBudgetCents: next.dailyBudgetCents,
    writerModel: next.writerModel,
    reviewerModel: next.reviewerModel,
    minPublishScore: next.minPublishScore,
  } satisfies Prisma.JsonObject;

  const row = await prisma.platformSetting.upsert({
    where: { key: SEO_AUTOMATION_SETTING_KEY },
    create: {
      key: SEO_AUTOMATION_SETTING_KEY,
      value,
      updatedByUserId,
    },
    update: {
      value,
      updatedByUserId,
    },
  });

  return parseSeoAutomationSettings(row.value, {
    updatedByUserId: row.updatedByUserId,
    updatedAt: row.updatedAt,
  });
}
