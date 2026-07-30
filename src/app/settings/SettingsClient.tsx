"use client";

import { signOut } from "next-auth/react";
import { useEffect, useState } from "react";
import { ALLOWED_MODELS, MODEL_LABELS } from "@/lib/ai/models";

export default function SettingsClient() {
  const [model, setModel] = useState("");
  const [howToAddress, setHowToAddress] = useState("");
  const [usage, setUsage] = useState<{
    used: number;
    remaining: number;
    limit: number;
  } | null>(null);
  const [plan, setPlan] = useState("free");
  const [message, setMessage] = useState<string | null>(null);
  const [tgLinked, setTgLinked] = useState(false);
  const [tgLinkInfo, setTgLinkInfo] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      const res = await fetch("/api/user/settings");
      const data = await res.json();
      if (res.ok) {
        setModel(data.preferredModel);
        setUsage(data.usage);
        setPlan(data.plan);
        setHowToAddress(data.howToAddress ?? "");
      }
      const tg = await fetch("/api/telegram/link");
      const tgData = await tg.json();
      if (tg.ok) setTgLinked(Boolean(tgData.linked));
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

  async function saveName() {
    const res = await fetch("/api/telegram/link", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ howToAddress }),
    });
    setMessage(res.ok ? "Nombre guardado — el personaje te llamará así" : "Error");
  }

  async function linkTelegram() {
    const res = await fetch("/api/telegram/link", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ createLink: true }),
    });
    const data = await res.json();
    if (!res.ok) {
      setMessage(data.error ?? "Error");
      return;
    }
    setTgLinkInfo(data.deepLink || data.instruction);
    setMessage("Enlace generado (válido 15 min)");
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
        <h1 className="font-[family-name:var(--font-display)] text-3xl">
          Ajustes
        </h1>
        <p className="mt-2 text-[var(--muted)]">
          Plan: {plan}.{" "}
          {usage
            ? `Mensajes hoy: ${usage.used}/${usage.limit} (quedan ${usage.remaining}).`
            : null}
        </p>
      </div>

      <section className="space-y-3 border border-[var(--line)] bg-[var(--bg-elevated)] p-4">
        <h2 className="text-sm uppercase tracking-wider text-[var(--muted)]">
          Cómo te llama el personaje
        </h2>
        <input
          className="w-full border border-[var(--line)] bg-[var(--bg)] px-3 py-2"
          value={howToAddress}
          onChange={(e) => setHowToAddress(e.target.value)}
          placeholder="Antoine, mi vida…"
        />
        <button
          type="button"
          onClick={saveName}
          className="bg-[var(--accent)] px-4 py-2 text-[var(--bg)]"
        >
          Guardar nombre
        </button>
      </section>

      <section className="space-y-3 border border-[var(--line)] bg-[var(--bg-elevated)] p-4">
        <h2 className="text-sm uppercase tracking-wider text-[var(--muted)]">
          Telegram
        </h2>
        <p className="text-sm text-[var(--muted)]">
          {tgLinked
            ? "Cuenta vinculada. Misma memoria y personaje que en la web."
            : "Vincula Telegram para chatear con el mismo personaje fuera de la web."}
        </p>
        <button
          type="button"
          onClick={linkTelegram}
          className="border border-[var(--line)] px-4 py-2"
        >
          {tgLinked ? "Generar nuevo enlace" : "Vincular Telegram"}
        </button>
        {tgLinkInfo ? (
          <p className="break-all text-sm text-[var(--accent)]">{tgLinkInfo}</p>
        ) : null}
      </section>

      <section className="space-y-3 border border-[var(--line)] bg-[var(--bg-elevated)] p-4">
        <h2 className="text-sm uppercase tracking-wider text-[var(--muted)]">
          Modelo OpenRouter
        </h2>
        <select
          className="w-full border border-[var(--line)] bg-[var(--bg)] px-3 py-2"
          value={model}
          onChange={(e) => setModel(e.target.value)}
        >
          {(ALLOWED_MODELS.length
            ? ALLOWED_MODELS
            : Object.keys(MODEL_LABELS)
          ).map((id) => (
            <option key={id} value={id}>
              {MODEL_LABELS[id] ?? id}
            </option>
          ))}
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
