export type NavItem = {
  id: string;
  label: string;
  href?: string;
  soon?: boolean;
  external?: boolean;
  match?: (pathname: string) => boolean;
};

export type NavGroup = {
  id: string;
  label: string;
  items: NavItem[];
};

export const APP_NAV_GROUPS: NavGroup[] = [
  {
    id: "build",
    label: "Build",
    items: [
      {
        id: "personas",
        label: "Personas",
        href: "/personas",
        match: (p) => p === "/personas" || p.startsWith("/personas/"),
      },
      {
        id: "sources",
        label: "Sources",
        href: "/knowledge",
        match: (p) => p === "/knowledge" || p.startsWith("/knowledge/"),
      },
      {
        id: "chat",
        label: "Chat",
        href: "/chat",
        match: (p) => p === "/chat" || p.startsWith("/chat/"),
      },
    ],
  },
  {
    id: "channels",
    label: "Channels",
    items: [
      {
        id: "telegram",
        label: "Telegram",
        soon: true,
      },
      {
        id: "discord",
        label: "Discord",
        soon: true,
      },
      {
        id: "whatsapp",
        label: "WhatsApp",
        soon: true,
      },
    ],
  },
  {
    id: "configure",
    label: "Configure",
    items: [
      {
        id: "settings",
        label: "Settings",
        href: "/settings",
        match: (p) => p === "/settings",
      },
    ],
  },
];

export const APP_RESOURCE_LINKS: NavItem[] = [
  { id: "help", label: "Help", href: "/help", external: true },
  { id: "docs", label: "Docs", href: "/docs", external: true },
  {
    id: "claude",
    label: "Claude · vibecode",
    href: "/integrations/claude",
    external: true,
  },
];
