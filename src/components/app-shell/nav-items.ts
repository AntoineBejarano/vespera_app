export type NavItem = {
  id: string;
  label: string;
  href?: string;
  soon?: boolean;
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
        href: "/personas",
        match: () => false,
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
      {
        id: "api-keys",
        label: "API keys",
        href: "/settings#api-keys",
        match: () => false,
      },
      {
        id: "workspace",
        label: "Workspace",
        href: "/settings#workspace",
        match: () => false,
      },
    ],
  },
  {
    id: "resources",
    label: "Resources",
    items: [
      {
        id: "help",
        label: "Help",
        href: "/help",
      },
      {
        id: "docs",
        label: "Docs",
        href: "/docs",
      },
      {
        id: "claude",
        label: "Claude · vibecode",
        href: "/integrations/claude",
      },
    ],
  },
];
