"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  Bot,
  HelpCircle,
  KeyRound,
  MessageSquare,
  Settings2,
  Sparkles,
  Users,
  Workflow,
} from "lucide-react";
import { WorkspaceSwitcher } from "@/components/WorkspaceSwitcher";
import { DebugRoleSwitcher } from "@/components/DebugRoleSwitcher";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { APP_NAV_GROUPS, type NavItem } from "./nav-items";

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  personas: Users,
  sources: BookOpen,
  chat: MessageSquare,
  telegram: Bot,
  discord: Workflow,
  whatsapp: MessageSquare,
  settings: Settings2,
  "api-keys": KeyRound,
  workspace: Users,
  help: HelpCircle,
  docs: BookOpen,
  claude: Sparkles,
};

export function AppSidebar({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname() || "/personas";

  return (
    <TooltipProvider delayDuration={300}>
      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/55 backdrop-blur-sm transition lg:hidden",
          open ? "opacity-100" : "pointer-events-none opacity-0",
        )}
        onClick={onClose}
        aria-hidden={!open}
      />

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-[17rem] flex-col border-r border-white/[0.06] bg-[var(--sidebar)]/95 backdrop-blur-xl transition-transform lg:static lg:z-0 lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="relative overflow-hidden border-b border-white/[0.06] px-4 py-4">
          <div className="pointer-events-none absolute -right-8 -top-10 h-28 w-28 rounded-full bg-[var(--accent)]/15 blur-3xl" />
          <div className="relative flex items-center justify-between gap-2">
            <Link
              href="/personas"
              onClick={onClose}
              className="min-w-0"
              aria-label="Vesperer"
            >
              <span className="font-[family-name:var(--font-display)] text-[1.15rem] font-semibold tracking-[-0.03em] text-[var(--ink)]">
                Vesper<span className="text-[var(--accent)]">er</span>
              </span>
              <span className="mt-0.5 block text-[10px] uppercase tracking-[0.22em] text-[var(--muted)]">
                Studio
              </span>
            </Link>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="lg:hidden"
              onClick={onClose}
              aria-label="Close menu"
            >
              ✕
            </Button>
          </div>
        </div>

        <div className="px-3 py-3">
          <WorkspaceSwitcher />
        </div>

        <ScrollArea className="flex-1 px-3">
          <nav className="pb-4">
            {APP_NAV_GROUPS.map((group, gi) => (
              <div key={group.id} className={cn(gi > 0 && "mt-5")}>
                <p className="mb-1.5 px-2 text-[10px] font-medium uppercase tracking-[0.18em] text-[var(--muted)]/70">
                  {group.label}
                </p>
                <ul className="space-y-0.5">
                  {group.items.map((item) => (
                    <SidebarItem
                      key={item.id}
                      item={item}
                      active={item.match?.(pathname) ?? false}
                      onNavigate={onClose}
                    />
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </ScrollArea>

        <div className="space-y-3 border-t border-white/[0.06] p-3">
          <Button asChild className="w-full" size="lg">
            <Link href="/personas/new" onClick={onClose}>
              <Sparkles className="size-4" />
              New persona
            </Link>
          </Button>
          <DebugRoleSwitcher />
        </div>
      </aside>
    </TooltipProvider>
  );
}

function SidebarItem({
  item,
  active,
  onNavigate,
}: {
  item: NavItem;
  active: boolean;
  onNavigate: () => void;
}) {
  const Icon = ICONS[item.id] ?? Sparkles;

  if (item.soon || !item.href) {
    return (
      <li>
        <Tooltip>
          <TooltipTrigger className="flex w-full cursor-not-allowed items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] text-[var(--muted)]/45">
            <Icon className="size-4 shrink-0 opacity-60" />
            <span className="flex-1 text-left">{item.label}</span>
            <Badge
              variant="outline"
              className="h-5 px-1.5 text-[9px] uppercase"
            >
              Soon
            </Badge>
          </TooltipTrigger>
          <TooltipContent side="right">Coming soon</TooltipContent>
        </Tooltip>
      </li>
    );
  }

  return (
    <li>
      <Link
        href={item.href}
        onClick={onNavigate}
        className={cn(
          "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] transition",
          active
            ? "bg-[var(--sidebar-accent)] font-medium text-[var(--ink)] shadow-[inset_0_0_0_1px_rgba(91,173,238,0.18)]"
            : "text-[var(--muted)] hover:bg-white/[0.03] hover:text-[var(--ink)]",
        )}
      >
        <Icon
          className={cn(
            "size-4 shrink-0",
            active ? "text-[var(--accent)]" : "opacity-70",
          )}
        />
        <span className="flex-1">{item.label}</span>
      </Link>
    </li>
  );
}
