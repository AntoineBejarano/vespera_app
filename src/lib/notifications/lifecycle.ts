import type { EmailTemplateId } from "@/lib/email/types";
import {
  sendTemplateEmail,
  type TemplatePropsMap,
} from "@/lib/email";
import { prisma } from "@/lib/db";

export async function sendLifecycleEmail<T extends EmailTemplateId>(params: {
  userId: string;
  to: string | string[];
  templateId: T;
  props: TemplatePropsMap[T];
  topic?: string;
  dedupeKey?: string;
}) {
  const topic = params.topic ?? params.templateId;
  const dedupeKey =
    params.dedupeKey ?? `email:${params.templateId}:${params.userId}`;

  const preference = await prisma.notificationPreference.findUnique({
    where: {
      userId_channel_topic: {
        userId: params.userId,
        channel: "email",
        topic,
      },
    },
  });

  if (preference?.enabled === false) {
    await prisma.notificationDelivery.upsert({
      where: { dedupeKey },
      create: {
        userId: params.userId,
        channel: "email",
        topic,
        templateId: params.templateId,
        status: "skipped",
        dedupeKey,
        skippedAt: new Date(),
        metaJson: { reason: "preference_disabled" },
      },
      update: {},
    });
    return { ok: false as const, skipped: true, error: "Preference disabled" };
  }

  const existing = await prisma.notificationDelivery.findUnique({
    where: { dedupeKey },
  });
  if (existing) {
    return {
      ok: existing.status === "sent",
      skipped: true,
      error: "Already handled",
    };
  }

  await prisma.notificationDelivery.create({
    data: {
      userId: params.userId,
      channel: "email",
      topic,
      templateId: params.templateId,
      status: "pending",
      dedupeKey,
    },
  });

  const result = await sendTemplateEmail({
    templateId: params.templateId,
    to: params.to,
    props: params.props,
    idempotencyKey: dedupeKey,
  });

  await prisma.notificationDelivery.update({
    where: { dedupeKey },
    data: result.ok
      ? { status: "sent", sentAt: new Date() }
      : {
          status: result.skipped ? "skipped" : "failed",
          skippedAt: result.skipped ? new Date() : undefined,
          error: result.error,
        },
  });

  return result;
}
