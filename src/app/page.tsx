import Link from "next/link";

export default function HomePage() {
  return (
    <main className="relative min-h-screen overflow-hidden">
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 30%, rgba(196,165,116,0.12), transparent 35%), radial-gradient(circle at 80% 70%, rgba(80,120,160,0.1), transparent 40%)",
        }}
      />
      <div className="relative mx-auto flex min-h-screen max-w-4xl flex-col justify-center px-6 py-16">
        <p className="text-sm uppercase tracking-[0.35em] text-[var(--accent)]">
          18+ · privado
        </p>
        <h1 className="mt-4 font-[family-name:var(--font-display)] text-6xl leading-none text-[var(--ink)] sm:text-7xl">
          Vespera
        </h1>
        <p className="mt-6 max-w-xl text-lg leading-relaxed text-[var(--muted)]">
          Relaciones ficticias adultas que recuerdan, evolucionan y se sienten
          coherentes — sin economía de tokens, sin filtro que rompe la escena.
        </p>
        <div className="mt-10 flex flex-wrap gap-4">
          <Link
            href="/age-gate"
            className="bg-[var(--accent)] px-6 py-3 text-[var(--bg)] transition hover:opacity-90"
          >
            Entrar
          </Link>
          <Link
            href="/login"
            className="border border-[var(--line)] px-6 py-3 text-[var(--ink)]"
          >
            Ya tengo cuenta
          </Link>
        </div>
      </div>
    </main>
  );
}
