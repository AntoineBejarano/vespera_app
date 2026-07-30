export type TelegramProfile = {
  id: string;
  firstName?: string | null;
  lastName?: string | null;
  username?: string | null;
};

export function telegramDisplayName(profile: {
  telegramFirstName?: string | null;
  telegramLastName?: string | null;
  firstName?: string | null;
  lastName?: string | null;
}): string | null {
  const first =
    profile.telegramFirstName?.trim() || profile.firstName?.trim() || "";
  const last =
    profile.telegramLastName?.trim() || profile.lastName?.trim() || "";
  const full = [first, last].filter(Boolean).join(" ").trim();
  return full || null;
}

/**
 * Who to call them in chat.
 * Telegram channel: live Telegram first name wins (never the admin nickname alone).
 * Web/admin: howToAddress nickname, then account name.
 */
export function resolvePartnerName(params: {
  channel: "telegram" | "web";
  telegramFirstName?: string | null;
  telegramLastName?: string | null;
  howToAddress?: string | null;
  accountName?: string | null;
}): { displayName: string; howToAddress: string | null } {
  const tgFirst = params.telegramFirstName?.trim() || null;
  const tgFull = telegramDisplayName({
    telegramFirstName: params.telegramFirstName,
    telegramLastName: params.telegramLastName,
  });
  const nickname = params.howToAddress?.trim() || null;
  const account = params.accountName?.trim() || null;

  if (params.channel === "telegram") {
    const call = tgFirst || nickname || account;
    return {
      displayName: tgFull || call || "you",
      howToAddress: call,
    };
  }

  const call = nickname || account || tgFirst;
  return {
    displayName: call || tgFull || "you",
    howToAddress: call,
  };
}
