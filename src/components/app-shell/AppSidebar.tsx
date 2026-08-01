"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  Bot,
  HelpCircle,
  MessageSquare,
  Settings2,
  Sparkles,
  Users,
  Workflow,
  X,
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
import {
  APP_NAV_GROUPS,
  APP_RESOURCE_LINKS,
  type NavItem,
} from "./nav-items";

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  personas: Users,
  sources: BookOpen,
  chat: MessageSquare,
  telegram: Bot,
  discord: Workflow,
  whatsapp: MessageSquare,
  settings: Settings2,
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
          "fixed inset-y-0 left-0 z-50 flex w-[17rem] flex-col border-r border-border bg-sidebar/95 backdrop-blur-xl transition-transform lg:static lg:z-0 lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="border-b border-border px-4 py-4">
          <div className="flex items-center justify-between gap-2">
            <Link
              href="/personas"
              onClick={onClose}
              className="min-w-0"
              aria-label="Vesperer"
            >
              <span className="font-[family-name:var(--font-display)] text-[1.15rem] font-semibold tracking-[-0.03em] text-[var(--ink)]">
                Vesper<span className="text-[var(--accent)]">er</span>
              </span>
              <span className="mt-0.5 block text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
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
              <X className="size-4" />
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
                <p className="mb-1.5 px-2 text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground/70">
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

        <div className="space-y-3 border-t border-border p-3">
          <ul className="space-y-0.5">
            {APP_RESOURCE_LINKS.map((item) => (
              <li key={item.id}>
                <Link
                  href={item.href!}
                  onClick={onClose}
                  className="flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-[12px] text-muted-foreground transition hover:bg-white/[0.03] hover:text-foreground"
                >
                  {(() => {
                    const Icon = ICONS[item.id] ?? HelpCircle;
                    return <Icon className="size-3.5 shrink-0 opacity-70" />;
                  })()}
                  <span>{item.label}</span>
                </Link>
              </li>
            ))}
          </ul>
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
          <TooltipTrigger className="flex w-full cursor-not-allowed items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] text-muted-foreground/45">
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
            ? "bg-sidebar-accent font-medium text-foreground"
            : "text-muted-foreground hover:bg-white/[0.03] hover:text-foreground",
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
