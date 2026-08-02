export type Crumb = { label: string; href?: string };

const SEGMENT_LABELS: Record<string, string> = {
  personas: "Personas",
  knowledge: "Sources",
  chat: "Chat",
  settings: "Settings",
  workspaces: "Workspaces",
  invites: "Invite",
  memory: "Memory",
  new: "New",
  docs: "Docs",
  help: "Help",
};

export function getAppBreadcrumbs(pathname: string): Crumb[] {
  const parts = pathname.split("/").filter(Boolean);
  if (parts.length === 0) {
    return [{ label: "Personas", href: "/personas" }];
  }

  const crumbs: Crumb[] = [];
  let acc = "";

  for (let i = 0; i < parts.length; i++) {
    const seg = parts[i]!;
    acc += `/${seg}`;
    const isLast = i === parts.length - 1;
    const prev = parts[i - 1];

    let label = SEGMENT_LABELS[seg];
    if (!label) {
      if (prev === "personas" && seg !== "new") {
        label = "Persona";
      } else if (prev === "invites") {
        label = "Accept";
      } else {
        label = seg.charAt(0).toUpperCase() + seg.slice(1);
      }
    }

    crumbs.push(isLast ? { label } : { label, href: acc });
  }

  return crumbs;
}
