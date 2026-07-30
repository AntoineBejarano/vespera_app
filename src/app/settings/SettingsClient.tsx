"use client";

import { signOut } from "next-auth/react";
import { useEffect, useState } from "react";
import { ALLOWED_MODELS, MODEL_LABELS } from "@/lib/ai/models";

type Photo = {
  id: string;
  url: string;
  caption: string | null;
  kind: string;
};

type CharacterOpt = { id: string; name: string; active: boolean };

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
  const [characters, setCharacters] = useState<CharacterOpt[]>([]);
  const [photoCharacterId, setPhotoCharacterId] = useState("");
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [photoUrl, setPhotoUrl] = useState("");
  const [photoCaption, setPhotoCaption] = useState("");

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

      const chars = await fetch("/api/characters");
      if (chars.ok) {
        const data = await chars.json();
        const list = (data.characters ?? []) as CharacterOpt[];
        setCharacters(list);
        const active = list.find((c) => c.active) ?? list[0];
        if (active) setPhotoCharacterId(active.id);
      }
    })();
  }, []);

  useEffect(() => {
    if (!photoCharacterId) return;
    void (async () => {
      const res = await fetch(`/api/characters/${photoCharacterId}/photos`);
      if (!res.ok) return;
      const data = await res.json();
      setPhotos(data.photos ?? []);
    })();
  }, [photoCharacterId]);

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
    setMessage(res.ok ? "Nombre guardado" : "Error");
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
    setMessage("Enlace generado (15 min)");
  }

  async function addPhoto() {
    if (!photoCharacterId || !photoUrl.trim()) return;
    const res = await fetch(`/api/characters/${photoCharacterId}/photos`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        url: photoUrl.trim(),
        caption: photoCaption.trim() || null,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setMessage(data.error ?? "Error foto");
      return;
    }
    setPhotos((p) => [data.photo, ...p]);
    setPhotoUrl("");
    setPhotoCaption("");
    setMessage("Foto añadida");
  }

  async function removePhoto(photoId: string) {
    const res = await fetch(
      `/api/characters/${photoCharacterId}/photos?photoId=${photoId}`,
      { method: "DELETE" },
    );
    if (res.ok) {
      setPhotos((p) => p.filter((x) => x.id !== photoId));
      setMessage("Foto eliminada");
    }
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
        <p className="text-xs uppercase tracking-[0.3em] text-[var(--accent)]">
          Admin
        </p>
        <h1 className="mt-2 font-[family-name:var(--font-display)] text-3xl">
          Panel
        </h1>
        <p className="mt-2 text-[var(--muted)]">
          La web es test/admin. El producto es Telegram — el bot no revela que
          es ficticio. Plan: {plan}.{" "}
          {usage
            ? `Hoy: ${usage.used}/${usage.limit} (quedan ${usage.remaining}).`
            : null}
        </p>
      </div>

      <section className="space-y-3 border border-[var(--line)] bg-[var(--bg-elevated)] p-4">
        <h2 className="text-sm uppercase tracking-wider text-[var(--muted)]">
          Cómo te llama
        </h2>
        <input
          className="w-full border border-[var(--line)] bg-[var(--bg)] px-3 py-2"
          value={howToAddress}
          onChange={(e) => setHowToAddress(e.target.value)}
          placeholder="Antoine…"
        />
        <button
          type="button"
          onClick={saveName}
          className="bg-[var(--accent)] px-4 py-2 text-[var(--bg)]"
        >
          Guardar
        </button>
      </section>

      <section className="space-y-3 border border-[var(--line)] bg-[var(--bg-elevated)] p-4">
        <h2 className="text-sm uppercase tracking-wider text-[var(--muted)]">
          Telegram (producto)
        </h2>
        <p className="text-sm text-[var(--muted)]">
          {tgLinked
            ? "Vinculado. Chatea ahí — multi-mensaje, delays, fotos."
            : "Vincula el bot. Ahí es donde vive la relación."}
        </p>
        <button
          type="button"
          onClick={linkTelegram}
          className="border border-[var(--line)] px-4 py-2"
        >
          {tgLinked ? "Nuevo enlace" : "Vincular Telegram"}
        </button>
        {tgLinkInfo ? (
          <p className="break-all text-sm text-[var(--accent)]">{tgLinkInfo}</p>
        ) : null}
      </section>

      <section className="space-y-3 border border-[var(--line)] bg-[var(--bg-elevated)] p-4">
        <h2 className="text-sm uppercase tracking-wider text-[var(--muted)]">
          Fotos del personaje
        </h2>
        <p className="text-sm text-[var(--muted)]">
          URLs públicas (jpg/png). Si pide foto / pic / selfie, el bot envía una
          al azar.
        </p>
        <select
          className="w-full border border-[var(--line)] bg-[var(--bg)] px-3 py-2"
          value={photoCharacterId}
          onChange={(e) => setPhotoCharacterId(e.target.value)}
        >
          {characters.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
              {c.active ? " (activo)" : ""}
            </option>
          ))}
        </select>
        <input
          className="w-full border border-[var(--line)] bg-[var(--bg)] px-3 py-2"
          value={photoUrl}
          onChange={(e) => setPhotoUrl(e.target.value)}
          placeholder="https://…/photo.jpg"
        />
        <input
          className="w-full border border-[var(--line)] bg-[var(--bg)] px-3 py-2"
          value={photoCaption}
          onChange={(e) => setPhotoCaption(e.target.value)}
          placeholder="Caption opcional"
        />
        <button
          type="button"
          onClick={addPhoto}
          className="bg-[var(--accent)] px-4 py-2 text-[var(--bg)]"
        >
          Añadir foto
        </button>
        <ul className="space-y-2">
          {photos.map((p) => (
            <li
              key={p.id}
              className="flex items-center gap-3 border border-[var(--line)] p-2"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={p.url}
                alt=""
                className="h-12 w-12 object-cover"
              />
              <span className="flex-1 truncate text-xs text-[var(--muted)]">
                {p.url}
              </span>
              <button
                type="button"
                className="text-xs text-red-400"
                onClick={() => removePhoto(p.id)}
              >
                Quitar
              </button>
            </li>
          ))}
        </ul>
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
          Exportar
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
