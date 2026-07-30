"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function AgeGatePage() {
  const router = useRouter();
  const [checked, setChecked] = useState(false);

  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col justify-center px-6">
      <h1 className="font-[family-name:var(--font-display)] text-4xl text-[var(--ink)]">
        Solo adultos
      </h1>
      <p className="mt-4 leading-relaxed text-[var(--muted)]">
        Vespera es una plataforma privada de relaciones ficticias para personas
        de 18 años o más. El contenido puede ser romántico y erótico entre
        adultos consentidos. Está estrictamente prohibido cualquier contenido
        sexual con menores.
      </p>
      <label className="mt-8 flex items-start gap-3 text-[var(--ink)]">
        <input
          type="checkbox"
          className="mt-1"
          checked={checked}
          onChange={(e) => setChecked(e.target.checked)}
        />
        <span>Confirmo que tengo 18 años o más y acepto continuar.</span>
      </label>
      <button
        type="button"
        disabled={!checked}
        className="mt-8 bg-[var(--accent)] px-6 py-3 text-[var(--bg)] disabled:opacity-40"
        onClick={() => {
          sessionStorage.setItem("vespera_age_ok", "1");
          router.push("/register");
        }}
      >
        Continuar
      </button>
    </main>
  );
}
