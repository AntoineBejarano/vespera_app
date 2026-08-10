export type PersonaPickerTarget = {
  /** Opens persona detail on this tab after pick. */
  tab: "agency" | "photos" | "self" | "publish" | "mind";
};

export type NavItem = {
  id: string;
  label: string;
  href?: string;
  soon?: boolean;
  external?: boolean;
  /** Click opens a persona picker, then navigates to that persona + tab. */
  pickPersona?: PersonaPickerTarget;
  match?: (pathname: string, searchParams?: URLSearchParams) => boolean;
};

export type NavGroup = {
  id: string;
  label: string;
  items: NavItem[];
};

export const APP_NAV_GROUPS: NavGroup[] = [
  {
    id: "experiences",
    label: "Experiences",
    items: [
      {
        id: "professionals",
        label: "Professionals",
        href: "/professionals/workspace",
        match: (p) => p.startsWith("/professionals"),
      },
    ],
  },
  {
    id: "build",
    label: "Build",
    items: [
      {
        id: "personas",
        label: "Personas",
        href: "/personas",
        match: (p, sp) => {
          if (p === "/personas") return true;
          if (!p.startsWith("/personas/")) return false;
          // Channel deep-links own the highlight
          return sp?.get("tab") !== "agency";
        },
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
        pickPersona: { tab: "agency" },
        match: (p, sp) =>
          p.startsWith("/personas/") && sp?.get("tab") === "agency",
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
        id: "workspaces",
        label: "Workspaces",
        href: "/workspaces",
        match: (p) => p === "/workspaces" || p.startsWith("/workspaces/"),
      },
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
  {
    id: "help",
    label: "Help",
    href: "/help",
    match: (p) => p === "/help" || p.startsWith("/help/"),
  },
  {
    id: "docs",
    label: "Docs",
    href: "/docs",
    match: (p) => p === "/docs" || p.startsWith("/docs/"),
  },
  {
    id: "claude",
    label: "Claude · vibecode",
    href: "/integrations/claude",
    external: true,
  },
];
