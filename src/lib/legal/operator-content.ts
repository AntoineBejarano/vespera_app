/** Shown in UI when linking Telegram, API keys, or publishing to end users. */
export const PLATFORM_OPERATOR_ACK_POINTS = [
  "You operate bots, API integrations, or public pages for your own audience — not Vesperer acting as publisher.",
  "You are responsible for verifying that your end users are adults (18+) in your channel and market.",
  "You must follow Telegram and any other platform terms, and surface an 18+ notice to your users.",
  "You must not use the Service for illegal content, minors, exploitation, or non-consensual material.",
  "Vesperer provides infrastructure, global safety blocks, and may suspend access for violations.",
] as const;

export const PLATFORM_OPERATOR_ACK_LABEL =
  "I accept Platform Operator Responsibilities for channels and API access I enable.";
