"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { PersonaProfileShell } from "@/components/persona/PersonaProfileShell";
import { PersonaOverviewTab } from "@/components/persona/PersonaOverviewTab";
import { PersonaConnectionsTab } from "@/components/persona/PersonaConnectionsTab";
import { PersonaPhotosTab } from "@/components/persona/PersonaPhotosTab";
import { PersonaPublishTab } from "@/components/persona/PersonaPublishTab";
import { PersonaMindGraph } from "@/components/persona/PersonaMindGraph";
import type {
  DocKey,
  PersonaProfile,
  PersonaTab,
} from "@/components/persona/types";

export function PersonaDetail({
  persona,
  appUrl,
  operatorAttested: operatorAttestedInitial = false,
}: {
  persona: PersonaProfile;
  appUrl: string;
  operatorAttested?: boolean;
}) {
  const router = useRouter();
  const [tab, setTab] = useState<PersonaTab>("overview");
  const [message, setMessage] = useState<string | null>(null);
  const [operatorAttested, setOperatorAttested] = useState(
    operatorAttestedInitial,
  );
  const [operatorAck, setOperatorAck] = useState(false);
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [intensity, setIntensity] = useState(persona.intensity);
  const [name, setName] = useState(persona.name);
  const [docs, setDocs] = useState({
    soulMd: persona.soulMd,
    styleMd: persona.styleMd,
    rulesMd: persona.rulesMd,
    contextMd: persona.contextMd,
  });
  const [editingDocs, setEditingDocs] = useState(false);
  const [savingDocs, setSavingDocs] = useState(false);
  const [openDoc, setOpenDoc] = useState<DocKey | null>("soulMd");

  const [botToken, setBotToken] = useState("");
  const [botUsername, setBotUsername] = useState("");
  const [botLabel, setBotLabel] = useState("");

  const [photoUrl, setPhotoUrl] = useState("");
  const [photoCaption, setPhotoCaption] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>(["selfie"]);
  const [photos, setPhotos] = useState(persona.photos);
  const [bots, setBots] = useState(persona.bots);
  const [isPublic, setIsPublic] = useState(persona.isPublic);
  const [slug, setSlug] = useState(persona.slug ?? "");
  const [tagline, setTagline] = useState(persona.tagline ?? "");
  const [openingLine, setOpeningLine] = useState(persona.openingLine ?? "");
  const [categories, setCategories] = useState(persona.categories.join(", "));
  const [allowFork, setAllowFork] = useState(persona.allowFork);
  const [isAdult, setIsAdult] = useState(persona.isAdult);
  const [savingPublic, setSavingPublic] = useState(false);

  const telegramPeerCount = bots.reduce((n, b) => n + b.peerCount, 0);
  const showOperatorAck = !operatorAttested;

  useEffect(() => {
    function onMsg(e: Event) {
      const detail = (e as CustomEvent<string>).detail;
      if (typeof detail === "string") setMessage(detail);
    }
    window.addEventListener("persona-message", onMsg);
    return () => window.removeEventListener("persona-message", onMsg);
  }, []);

  function operatorPayload() {
    return operatorAttested || operatorAck
      ? { platformOperatorAccepted: true as const }
      : {};
  }

  function requireOperatorAck(action: string): boolean {
    if (operatorAttested || operatorAck) return true;
    setMessage(`Accept Platform Operator Responsibilities to ${action}.`);
    return false;
  }

  async function revealOrCreateKey() {
    const creating = !persona.hasApiKey && !apiKey;
    if (creating && !requireOperatorAck("create an API key")) return;

    const method = persona.hasApiKey || apiKey ? "GET" : "POST";
    const res = await fetch(`/api/characters/${persona.id}/apikey`, {
      method,
      ...(method === "POST"
        ? {
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(operatorPayload()),
          }
        : {}),
    });
    const data = await res.json();
    if (!res.ok) {
      setMessage(data.error ?? "API key error");
      return;
    }
    if (!data.apiKey && method === "GET") {
      if (!requireOperatorAck("create an API key")) return;
      const created = await fetch(`/api/characters/${persona.id}/apikey`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(operatorPayload()),
      });
      const d = await created.json();
      if (!created.ok) {
        setMessage(d.error ?? "Could not create key");
        return;
      }
      setApiKey(d.apiKey);
      setOperatorAttested(true);
      setMessage("API key created — copy it now");
      return;
    }
    setApiKey(data.apiKey);
    setMessage("API key loaded");
  }

  async function rotateKey() {
    if (!confirm("Rotate API key? Old key stops working.")) return;
    if (!requireOperatorAck("rotate the API key")) return;
    const res = await fetch(`/api/characters/${persona.id}/apikey`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(operatorPayload()),
    });
    const data = await res.json();
    if (!res.ok) {
      setMessage(data.error ?? "Error");
      return;
    }
    setApiKey(data.apiKey);
    setOperatorAttested(true);
    setMessage("New API key — copy it now");
  }

  async function saveIntensity(value: number) {
    setIntensity(value);
    await fetch(`/api/characters/${persona.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ intensity: value }),
    });
  }

  async function saveDefinition() {
    setSavingDocs(true);
    setMessage(null);
    const res = await fetch(`/api/characters/${persona.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: name.trim() || persona.name,
        soulMd: docs.soulMd,
        styleMd: docs.styleMd,
        rulesMd: docs.rulesMd,
        contextMd: docs.contextMd,
      }),
    });
    const data = await res.json();
    setSavingDocs(false);
    if (!res.ok) {
      setMessage(data.error ?? "Could not save definition");
      return;
    }
    setEditingDocs(false);
    setMessage("Persona definition saved");
    router.refresh();
  }

  function cancelEditDocs() {
    setName(persona.name);
    setDocs({
      soulMd: persona.soulMd,
      styleMd: persona.styleMd,
      rulesMd: persona.rulesMd,
      contextMd: persona.contextMd,
    });
    setEditingDocs(false);
  }

  async function addBot() {
    if (!botToken.trim() || !botUsername.trim()) {
      setMessage("Token and username required");
      return;
    }
    if (!requireOperatorAck("connect a Telegram bot")) return;
    const res = await fetch("/api/bots", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token: botToken.trim(),
        username: botUsername.trim(),
        characterId: persona.id,
        label: botLabel.trim() || undefined,
        setWebhook: true,
        ...operatorPayload(),
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setMessage(data.error ?? "Bot error");
      return;
    }
    setOperatorAttested(true);
    setBotToken("");
    setBotUsername("");
    setBotLabel("");
    setMessage(
      data.warning ?? `Bot @${data.bot.username} linked + webhook set`,
    );
    router.refresh();
    setBots((b) => [
      {
        id: data.bot.id,
        username: data.bot.username,
        active: true,
        label: botLabel || null,
        peerCount: 0,
        tokenMasked: "…",
      },
      ...b,
    ]);
  }

  async function removeBot(botId: string) {
    if (!confirm("Remove this bot?")) return;
    const res = await fetch(`/api/bots?botId=${botId}`, { method: "DELETE" });
    if (res.ok) {
      setBots((b) => b.filter((x) => x.id !== botId));
      setMessage("Bot removed");
    }
  }

  function toggleTag(id: string) {
    setSelectedTags((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id],
    );
  }

  async function addPhoto() {
    if (!photoUrl.trim() || !selectedTags.length) {
      setMessage("URL and at least one tag required");
      return;
    }
    const res = await fetch(`/api/characters/${persona.id}/photos`, {
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
      setMessage(data.error ?? "Photo error");
      return;
    }
    setPhotos((p) => [data.photo, ...p]);
    setPhotoUrl("");
    setPhotoCaption("");
    setSelectedTags(["selfie"]);
    setMessage("Photo added");
  }

  async function removePhoto(photoId: string) {
    const res = await fetch(
      `/api/characters/${persona.id}/photos?photoId=${photoId}`,
      { method: "DELETE" },
    );
    if (res.ok) {
      setPhotos((p) => p.filter((x) => x.id !== photoId));
      setMessage("Photo removed");
    }
  }

  async function deletePersona() {
    if (!confirm(`Delete ${persona.name}? This cannot be undone.`)) return;
    const res = await fetch(`/api/characters/${persona.id}`, {
      method: "DELETE",
    });
    if (res.ok) router.push("/personas");
  }

  async function savePublicProfile(nextPublic?: boolean) {
    const publishing = (nextPublic ?? isPublic) && !persona.isPublic;
    if (publishing && !requireOperatorAck("publish a public page")) return;

    setSavingPublic(true);
    setMessage(null);
    const res = await fetch(`/api/characters/${persona.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        isPublic: nextPublic ?? isPublic,
        slug: slug.trim() || undefined,
        tagline: tagline.trim() || null,
        openingLine: openingLine.trim() || null,
        categories: categories
          .split(",")
          .map((c) => c.trim())
          .filter(Boolean)
          .slice(0, 8),
        allowFork,
        isAdult,
        ...(publishing ? operatorPayload() : {}),
      }),
    });
    const data = await res.json();
    setSavingPublic(false);
    if (!res.ok) {
      setMessage(data.error ?? "Could not update public profile");
      return;
    }
    if (publishing) setOperatorAttested(true);
    setIsPublic(Boolean(data.character.isPublic));
    setSlug(data.character.slug ?? "");
    setMessage(
      data.character.isPublic
        ? `Published at /c/${data.character.slug}`
        : "Public page unpublished",
    );
    router.refresh();
  }

  const shellPersona: PersonaProfile = {
    ...persona,
    photos,
    bots,
    isPublic,
    slug: slug || persona.slug,
    tagline: tagline || persona.tagline,
    isAdult,
    coverUrl: photos[0]?.url ?? persona.coverUrl,
  };

  return (
    <PersonaProfileShell
      persona={shellPersona}
      displayName={name}
      tab={tab}
      onTabChange={setTab}
      message={message}
      telegramPeerCount={telegramPeerCount}
    >
      {tab === "overview" ? (
        <PersonaOverviewTab
          intensity={intensity}
          onIntensityChange={(v) => void saveIntensity(v)}
          name={name}
          onNameChange={setName}
          docs={docs}
          onDocChange={(key, value) =>
            setDocs((prev) => ({ ...prev, [key]: value }))
          }
          editingDocs={editingDocs}
          onEditingDocsChange={setEditingDocs}
          savingDocs={savingDocs}
          openDoc={openDoc}
          onOpenDocChange={setOpenDoc}
          onSave={() => void saveDefinition()}
          onCancel={cancelEditDocs}
          onDelete={() => void deletePersona()}
        />
      ) : null}

      {tab === "mind" ? <PersonaMindGraph personaId={persona.id} /> : null}

      {tab === "connections" ? (
        <PersonaConnectionsTab
          personaId={persona.id}
          personaName={name}
          appUrl={appUrl}
          bots={bots}
          botToken={botToken}
          botUsername={botUsername}
          botLabel={botLabel}
          onBotTokenChange={setBotToken}
          onBotUsernameChange={setBotUsername}
          onBotLabelChange={setBotLabel}
          onAddBot={() => void addBot()}
          onRemoveBot={(id) => void removeBot(id)}
          hasApiKey={persona.hasApiKey}
          apiKey={apiKey}
          showOperatorAck={showOperatorAck}
          operatorAck={operatorAck}
          onOperatorAckChange={setOperatorAck}
          onRevealOrCreateKey={() => void revealOrCreateKey()}
          onRotateKey={() => void rotateKey()}
        />
      ) : null}

      {tab === "photos" ? (
        <PersonaPhotosTab
          photos={photos}
          photoUrl={photoUrl}
          photoCaption={photoCaption}
          selectedTags={selectedTags}
          onPhotoUrlChange={setPhotoUrl}
          onPhotoCaptionChange={setPhotoCaption}
          onToggleTag={toggleTag}
          onAdd={() => void addPhoto()}
          onRemove={(id) => void removePhoto(id)}
        />
      ) : null}

      {tab === "publish" ? (
        <PersonaPublishTab
          slug={slug}
          tagline={tagline}
          openingLine={openingLine}
          categories={categories}
          allowFork={allowFork}
          isAdult={isAdult}
          isPublic={isPublic}
          savingPublic={savingPublic}
          showOperatorAck={showOperatorAck}
          operatorAck={operatorAck}
          onSlugChange={setSlug}
          onTaglineChange={setTagline}
          onOpeningLineChange={setOpeningLine}
          onCategoriesChange={setCategories}
          onAllowForkChange={setAllowFork}
          onIsAdultChange={setIsAdult}
          onOperatorAckChange={setOperatorAck}
          onSave={(next) => void savePublicProfile(next)}
        />
      ) : null}
    </PersonaProfileShell>
  );
}
