"use client";

import { signOut } from "next-auth/react";
import { useEffect, useState } from "react";
import { ALLOWED_MODELS, MODEL_LABELS } from "@/lib/ai/models";
import { PHOTO_TAG_OPTIONS } from "@/lib/chat/photos";

type Photo = {
  id: string;
  url: string;
  caption: string | null;
  kind: string;
  tags: string[];
};

type CharacterOpt = { id: string; name: string; active: boolean };

type BotRow = {
  id: string;
  username: string;
  label: string | null;
  active: boolean;
  characterId: string;
  characterName: string;
  peerCount: number;
  tokenMasked: string;
};

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
  const [tgName, setTgName] = useState<string | null>(null);
  const [tgLinkInfo, setTgLinkInfo] = useState<string | null>(null);
  const [characters, setCharacters] = useState<CharacterOpt[]>([]);
  const [photoCharacterId, setPhotoCharacterId] = useState("");
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [photoUrl, setPhotoUrl] = useState("");
  const [photoCaption, setPhotoCaption] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>(["selfie"]);
  const [bots, setBots] = useState<BotRow[]>([]);
  const [botToken, setBotToken] = useState("");
  const [botUsername, setBotUsername] = useState("");
  const [botCharacterId, setBotCharacterId] = useState("");
  const [botLabel, setBotLabel] = useState("");

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
      if (tg.ok) {
        setTgLinked(Boolean(tgData.linked));
        setTgName(
          tgData.telegramFirstName
            ? `${tgData.telegramFirstName}${tgData.telegramUsername ? ` (@${tgData.telegramUsername})` : ""}`
            : null,
        );
      }

      const chars = await fetch("/api/characters");
      if (chars.ok) {
        const data = await chars.json();
        const list = (data.characters ?? []) as CharacterOpt[];
        setCharacters(list);
        const active = list.find((c) => c.active) ?? list[0];
        if (active) {
          setPhotoCharacterId(active.id);
          setBotCharacterId(active.id);
        }
      }

      const botsRes = await fetch("/api/bots");
      if (botsRes.ok) {
        const data = await botsRes.json();
        setBots(data.bots ?? []);
      }
    })();
  }, []);

  useEffect(() => {
    if (!photoCharacterId) return;
    void (async () => {
      const res = await fetch(`/api/characters/${photoCharacterId}/photos`);
      if (!res.ok) return;
      const data = await res.json();
      setPhotos(
        (data.photos ?? []).map((p: Photo) => ({
          ...p,
          tags: p.tags ?? [p.kind],
        })),
      );
    })();
  }, [photoCharacterId]);

  function toggleTag(id: string) {
    setSelectedTags((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id],
    );
  }

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
    setMessage(res.ok ? "Nickname web guardado" : "Error");
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
    if (!selectedTags.length) {
      setMessage("Elige al menos un tag");
      return;
    }
    const res = await fetch(`/api/characters/${photoCharacterId}/photos`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        url: photoUrl.trim(),
        caption: photoCaption.trim() || null,
        kind: selectedTags[0],
        tags: selectedTags,
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
    setSelectedTags(["selfie"]);
    setMessage("Foto añadida con tags");
  }

  async function updatePhotoTags(photoId: string, tags: string[]) {
    const res = await fetch(`/api/characters/${photoCharacterId}/photos`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        photoId,
        tags,
        kind: tags[0] ?? "selfie",
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setMessage(data.error ?? "Error tags");
      return;
    }
    setPhotos((list) =>
      list.map((p) => (p.id === photoId ? { ...p, ...data.photo } : p)),
    );
    setMessage("Tags actualizados");
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

  async function addBot() {
    if (!botToken.trim() || !botUsername.trim() || !botCharacterId) {
      setMessage("Token, username y personaje requeridos");
      return;
    }
    const res = await fetch("/api/bots", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token: botToken.trim(),
        username: botUsername.trim(),
        characterId: botCharacterId,
        label: botLabel.trim() || undefined,
        setWebhook: true,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setMessage(data.error ?? "Error bot");
      return;
    }
    setBotToken("");
    setBotUsername("");
    setBotLabel("");
    setMessage(
      data.warning
        ? data.warning
        : `Bot @${data.bot.username} listo (${data.bot.characterName})`,
    );
    const botsRes = await fetch("/api/bots");
    if (botsRes.ok) {
      const d = await botsRes.json();
      setBots(d.bots ?? []);
    }
  }

  async function removeBot(botId: string) {
    if (!confirm("¿Eliminar este bot?")) return;
    const res = await fetch(`/api/bots?botId=${botId}`, { method: "DELETE" });
    if (res.ok) {
      setBots((b) => b.filter((x) => x.id !== botId));
      setMessage("Bot eliminado");
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
          La web es test/admin. El producto es Telegram. Plan: {plan}.{" "}
          {usage
            ? `Hoy: ${usage.used}/${usage.limit} (quedan ${usage.remaining}).`
            : null}
        </p>
      </div>

      <section className="space-y-3 border border-[var(--line)] bg-[var(--bg-elevated)] p-4">
        <h2 className="text-sm uppercase tracking-wider text-[var(--muted)]">
          Nickname (solo admin/web)
        </h2>
        <p className="text-sm text-[var(--muted)]">
          En Telegram usa el nombre real del perfil
          {tgName ? ` (${tgName})` : ""}. Este campo solo afecta el chat web.
        </p>
        <input
          className="w-full border border-[var(--line)] bg-[var(--bg)] px-3 py-2"
          value={howToAddress}
          onChange={(e) => setHowToAddress(e.target.value)}
          placeholder="Solo para test web…"
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
            ? `Vinculado${tgName ? ` como ${tgName}` : ""}.`
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
          <div className="space-y-2 text-sm">
            <a
              href={tgLinkInfo.startsWith("http") ? tgLinkInfo : undefined}
              className="block break-all text-[var(--accent)] underline"
              target="_blank"
              rel="noreferrer"
            >
              {tgLinkInfo}
            </a>
            <p className="text-[var(--muted)]">
              Si el enlace no abre: @Tatiana_Kulenko_bot → /start + token.
            </p>
          </div>
        ) : null}
      </section>

      <section className="space-y-3 border border-[var(--line)] bg-[var(--bg-elevated)] p-4">
        <h2 className="text-sm uppercase tracking-wider text-[var(--muted)]">
          Bots multi-tenant
        </h2>
        <p className="text-sm text-[var(--muted)]">
          Misma chica → N bots de Telegram → N personas en paralelo (memoria y
          relación aisladas por persona). Crea el bot en BotFather y pega el
          token aquí.
        </p>
        <select
          className="w-full border border-[var(--line)] bg-[var(--bg)] px-3 py-2"
          value={botCharacterId}
          onChange={(e) => setBotCharacterId(e.target.value)}
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
          value={botToken}
          onChange={(e) => setBotToken(e.target.value)}
          placeholder="123456:AAH…"
        />
        <input
          className="w-full border border-[var(--line)] bg-[var(--bg)] px-3 py-2"
          value={botUsername}
          onChange={(e) => setBotUsername(e.target.value)}
          placeholder="Tatiana_Kulenko_bot"
        />
        <input
          className="w-full border border-[var(--line)] bg-[var(--bg)] px-3 py-2"
          value={botLabel}
          onChange={(e) => setBotLabel(e.target.value)}
          placeholder="Label opcional (campaign A…)"
        />
        <button
          type="button"
          onClick={addBot}
          className="bg-[var(--accent)] px-4 py-2 text-[var(--bg)]"
        >
          Añadir bot + webhook
        </button>
        <ul className="space-y-2 text-sm">
          {bots.map((b) => (
            <li
              key={b.id}
              className="flex flex-wrap items-center gap-2 border border-[var(--line)] p-2"
            >
              <span className="text-[var(--ink)]">
                @{b.username}
                {b.label ? ` · ${b.label}` : ""}
              </span>
              <span className="text-[var(--muted)]">
                → {b.characterName} · {b.peerCount} peers
                {!b.active ? " · OFF" : ""}
              </span>
              <button
                type="button"
                className="ml-auto text-xs text-red-400"
                onClick={() => removeBot(b.id)}
              >
                Quitar
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-3 border border-[var(--line)] bg-[var(--bg-elevated)] p-4">
        <h2 className="text-sm uppercase tracking-wider text-[var(--muted)]">
          Fotos + tags
        </h2>
        <p className="text-sm text-[var(--muted)]">
          Taggea cada foto. Si pide “face / cara”, “ass / culo”, “tits / pecho”,
          el bot elige la que coincida.
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
          placeholder="Caption opcional (Telegram)"
        />
        <div className="flex flex-wrap gap-2">
          {PHOTO_TAG_OPTIONS.map((t) => {
            const on = selectedTags.includes(t.id);
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => toggleTag(t.id)}
                className={
                  on
                    ? "border border-[var(--accent)] bg-[var(--accent-soft)] px-2 py-1 text-xs text-[var(--ink)]"
                    : "border border-[var(--line)] px-2 py-1 text-xs text-[var(--muted)]"
                }
              >
                {t.label}
              </button>
            );
          })}
        </div>
        <button
          type="button"
          onClick={addPhoto}
          className="bg-[var(--accent)] px-4 py-2 text-[var(--bg)]"
        >
          Añadir foto
        </button>
        <ul className="space-y-3">
          {photos.map((p) => (
            <li
              key={p.id}
              className="space-y-2 border border-[var(--line)] p-2"
            >
              <div className="flex items-center gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={p.url}
                  alt=""
                  className="h-14 w-14 object-cover"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs text-[var(--muted)]">{p.url}</p>
                  <p className="text-xs text-[var(--ink)]">
                    {(p.tags?.length ? p.tags : [p.kind]).join(", ")}
                  </p>
                </div>
                <button
                  type="button"
                  className="text-xs text-red-400"
                  onClick={() => removePhoto(p.id)}
                >
                  Quitar
                </button>
              </div>
              <div className="flex flex-wrap gap-1">
                {PHOTO_TAG_OPTIONS.map((t) => {
                  const current = p.tags?.length ? p.tags : [p.kind];
                  const on = current.includes(t.id);
                  return (
                    <button
                      key={t.id}
                      type="button"
                      className={
                        on
                          ? "border border-[var(--accent)] px-1.5 py-0.5 text-[10px]"
                          : "border border-[var(--line)] px-1.5 py-0.5 text-[10px] text-[var(--muted)]"
                      }
                      onClick={() => {
                        const next = on
                          ? current.filter((x) => x !== t.id)
                          : [...current, t.id];
                        if (!next.length) return;
                        void updatePhotoTags(p.id, next);
                      }}
                    >
                      {t.id}
                    </button>
                  );
                })}
              </div>
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
