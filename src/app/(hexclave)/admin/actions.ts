"use server";

import { revalidatePath } from "next/cache";
import { getAppUser } from "@/lib/session";
import {
  PRIMARY_SUPERADMIN_EMAIL,
  isSuperadminUser,
} from "@/lib/platform/superadmin";
import {
  getSeoAutomationSettings,
  saveSeoAutomationSettings,
  type SeoAutomationMode,
} from "@/lib/platform/settings";
import { runSeoAutomation } from "@/lib/seo/generated/generator";

function readInt(formData: FormData, key: string, fallback: number) {
  const raw = formData.get(key);
  const value = typeof raw === "string" ? Number(raw) : NaN;
  return Number.isFinite(value) ? Math.round(value) : fallback;
}

export async function updateSeoAutomationAction(formData: FormData) {
  const user = await getAppUser();
  if (
    !user ||
    !isSuperadminUser(user) ||
    user.email?.trim().toLowerCase() !== PRIMARY_SUPERADMIN_EMAIL
  ) {
    throw new Error("Not authorized");
  }

  const current = await getSeoAutomationSettings();
  const intent = String(formData.get("intent") ?? "save");
  const requestedMode = String(formData.get("mode") ?? current.mode);
  const mode: SeoAutomationMode =
    requestedMode === "autopublish" ? "autopublish" : "draft_only";

  const enabled =
    intent === "start"
      ? true
      : intent === "pause"
        ? false
        : current.enabled;

  await saveSeoAutomationSettings(
    {
      enabled,
      mode,
      dailyPageLimit: readInt(
        formData,
        "dailyPageLimit",
        current.dailyPageLimit,
      ),
      dailyBudgetCents: readInt(
        formData,
        "dailyBudgetCents",
        current.dailyBudgetCents,
      ),
      writerModel:
        String(formData.get("writerModel") ?? current.writerModel).trim() ||
        current.writerModel,
      reviewerModel:
        String(formData.get("reviewerModel") ?? current.reviewerModel).trim() ||
        current.reviewerModel,
      minPublishScore: readInt(
        formData,
        "minPublishScore",
        current.minPublishScore,
      ),
    },
    user.id,
  );

  revalidatePath("/admin");
}

export async function runSeoGenerationAction() {
  const user = await getAppUser();
  if (
    !user ||
    !isSuperadminUser(user) ||
    user.email?.trim().toLowerCase() !== PRIMARY_SUPERADMIN_EMAIL
  ) {
    throw new Error("Not authorized");
  }

  await runSeoAutomation({
    source: "manual",
    ignoreEnabled: true,
    maxPages: 1,
  });

  revalidatePath("/admin");
}
