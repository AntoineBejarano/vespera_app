"use client";

import { signOut } from "next-auth/react";
import { useEffect, useState } from "react";
import { ALLOWED_MODELS, MODEL_LABELS } from "@/lib/ai/models";

export default function SettingsClient() {
  const [model, setModel] = useState("");
  const [usage, setUsage] = useState<{ used: number; remaining: number; limit: number } | null>(null);
  const [plan, setPlan] = useState("free");
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      const res = await fetch("/api/user/settings");
      const data = await res.json();
      if (res.ok) {
        setModel(data.preferredModel);
        setUsage(data.usage);
        setPlan(data.plan);
      }
    })();
  }, []);

  async function saveModel() {
    const res = await fetch("/api/user/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ preferredModel: model }),
    });
    const data = await res.json();
    setMessage(res.ok ? "Modelo guardado" : data.error);
  }

  async function exportData() {
    const res = await fetch("/api/user/export");
    const data = await res.json();
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `vespera-export-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function deleteAccount() {
    if (!confirm("¿Borrar permanentemente tu cuenta y todos los datos?")) return;
    const res = await fetch("/api/user/delete", { method: "DELETE" });
    if (res.ok) {
      await signOut({ callbackUrl: "/" });
    }
  }

  return (
    <div className="mx-auto max-w-xl space-y-8 px-4 py-10">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-3xl">Ajustes</h1>
        <p className="mt-2 text-[var(--muted)]">
          Plan: {plan}.{" "}
          {usage
            ? `Mensajes hoy: ${usage.used}/${usage.limit} (quedan ${usage.remaining}).`
            : null}
        </p>
      </div>

      <section className="space-y-3 border border-[var(--line)] bg-[var(--bg-elevated)] p-4">
        <h2 className="text-sm uppercase tracking-wider text-[var(--muted)]">
          Modelo OpenRouter
        </h2>
        <select
          className="w-full border border-[var(--line)] bg-[var(--bg)] px-3 py-2"
          value={model}
          onChange={(e) => setModel(e.target.value)}
        >
          {(ALLOWED_MODELS.length ? ALLOWED_MODELS : Object.keys(MODEL_LABELS)).map(
            (id) => (
              <option key={id} value={id}>
                {MODEL_LABELS[id] ?? id}
              </option>
            ),
          )}
        </select>
        <button
          type="button"
          onClick={saveModel}
          className="bg-[var(--accent)] px-4 py-2 text-[var(--bg)]"
        >
          Guardar modelo
        </button>
      </section>

      <section className="space-y-3 border border-[var(--line)] bg-[var(--bg-elevated)] p-4">
        <h2 className="text-sm uppercase tracking-wider text-[var(--muted)]">
          Privacidad
        </h2>
        <button
          type="button"
          onClick={exportData}
          className="mr-3 border border-[var(--line)] px-4 py-2"
        >
          Exportar datos
        </button>
        <button
          type="button"
          onClick={deleteAccount}
          className="border border-red-500/40 px-4 py-2 text-red-400"
        >
          Borrar cuenta
        </button>
      </section>

      <section className="space-y-2 border border-[var(--line)] bg-[var(--bg-elevated)] p-4 text-sm text-[var(--muted)]">
        <h2 className="text-sm uppercase tracking-wider text-[var(--muted)]">
          Premium (próximamente)
        </h2>
        <p>
          Stripe no es viable para contenido adulto. La monetización irá por
          Telegram Stars o un procesador adult-friendly. Mientras tanto: free con
          límite diario.
        </p>
      </section>

      {message ? <p className="text-sm text-[var(--accent)]">{message}</p> : null}

      <button
        type="button"
        className="text-sm text-[var(--muted)] underline"
        onClick={() => signOut({ callbackUrl: "/" })}
      >
        Cerrar sesión
      </button>
    </div>
  );
}
