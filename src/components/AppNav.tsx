import Link from "next/link";

export function AppNav({
  email,
}: {
  email?: string | null;
}) {
  return (
    <header className="border-b border-[var(--line)] bg-[var(--bg-elevated)]/80 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
        <Link
          href="/personas"
          className="font-[family-name:var(--font-display)] text-xl tracking-wide text-[var(--ink)]"
        >
          Vespera{" "}
          <span className="text-xs font-sans tracking-wider text-[var(--muted)]">
            admin
          </span>
        </Link>
        <nav className="flex items-center gap-4 text-sm text-[var(--muted)]">
          <Link href="/personas" className="hover:text-[var(--ink)]">
            Personas
          </Link>
          <Link href="/personas/new" className="hover:text-[var(--ink)]">
            New
          </Link>
          <Link href="/chat" className="hover:text-[var(--ink)]">
            Test chat
          </Link>
          <Link href="/memory" className="hover:text-[var(--ink)]">
            Memory
          </Link>
          <Link href="/settings" className="hover:text-[var(--ink)]">
            Settings
          </Link>
          {email ? (
            <span className="hidden text-xs sm:inline">{email}</span>
          ) : null}
        </nav>
      </div>
    </header>
  );
}
