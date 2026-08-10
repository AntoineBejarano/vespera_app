"use client";

import Link from "next/link";
import {
  Archive,
  BrainCircuit,
  Check,
  ChevronRight,
  CircleHelp,
  Database,
  FileCheck2,
  Headphones,
  History,
  Menu,
  MessageCircle,
  Mic,
  MicOff,
  MoreHorizontal,
  Play,
  Plus,
  RotateCcw,
  Send,
  Settings2,
  ShieldCheck,
  Sparkles,
  Square,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { LivingMindSnapshot } from "@/lib/chat/living-mind";
import "@/styles/product-chat.css";

type Channel = "Voz" | "Web" | "Telegram";
type Message = {
  id: string;
  role: "sofia" | "user" | "system";
  text: string;
  channel: Channel;
  time: string;
};

export type VespererProductCharacter = {
  id: string;
  name: string;
  tagline: string | null;
  openingLine: string | null;
  coverUrl: string | null;
};

type RecognitionResultLike = {
  isFinal: boolean;
  0: { transcript: string };
};

type RecognitionEventLike = {
  resultIndex: number;
  results: ArrayLike<RecognitionResultLike>;
};

type RecognitionErrorLike = { error: string };

type RecognitionInstance = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onstart: (() => void) | null;
  onresult: ((event: RecognitionEventLike) => void) | null;
  onerror: ((event: RecognitionErrorLike) => void) | null;
  onend: (() => void) | null;
};

type RecognitionConstructor = new () => RecognitionInstance;

declare global {
  interface Window {
    SpeechRecognition?: RecognitionConstructor;
    webkitSpeechRecognition?: RecognitionConstructor;
    __vespererVoiceTest?: {
      spoken: string[];
      recognitionStarts: number;
    };
  }
}

function nowTime() {
  return new Intl.DateTimeFormat("es-ES", { hour: "2-digit", minute: "2-digit" }).format(new Date());
}

function initialThread(
  character: VespererProductCharacter,
  mind: LivingMindSnapshot,
): Message[] {
  const history: Message[] = mind.evidence.map((message) => ({
    id: message.id,
    role: message.role === "assistant" ? "sofia" as const : "user" as const,
    text: message.content,
    channel: "Web" as const,
    time: new Intl.DateTimeFormat("es-ES", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(message.createdAt)),
  }));

  if (!history.length && character.openingLine) {
    history.push({
      id: "opening-line",
      role: "sofia",
      text: character.openingLine,
      channel: "Web",
      time: "Ahora",
    });
  }

  if (mind.summary || mind.memories.length) {
    history.unshift({
      id: "memory-bridge",
      role: "system",
      text: mind.summary || `${mind.memories.length} recuerdos recuperados para esta sesion`,
      channel: mind.agency.channels.includes("telegram") ? "Telegram" : "Web",
      time: "Ahora",
    });
  }

  return history;
}

export function VespererProductWorkspace({
  character,
  initialMind,
}: {
  character: VespererProductCharacter;
  initialMind: LivingMindSnapshot;
}) {
  const startingMessages = useMemo(
    () => initialThread(character, initialMind),
    [character, initialMind],
  );
  const [messages, setMessages] = useState<Message[]>(startingMessages);
  const [mind, setMind] = useState(initialMind);
  const [draft, setDraft] = useState("");
  const [channel, setChannel] = useState<Channel>("Web");
  const [language, setLanguage] = useState<"es-ES" | "en-US">("es-ES");
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [voiceURI, setVoiceURI] = useState("");
  const [autoSpeak, setAutoSpeak] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [voiceNotice, setVoiceNotice] = useState("Preparando voces del sistema...");
  const [diagnosticsOpen, setDiagnosticsOpen] = useState(false);
  const [mindOpen, setMindOpen] = useState(false);
  const [mindTab, setMindTab] = useState<"self" | "memory" | "evidence">("self");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<RecognitionInstance | null>(null);
  const messageSequenceRef = useRef(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioUrlRef = useRef<string | null>(null);
  const conversationRef = useRef<HTMLDivElement | null>(null);

  const recognitionSupported =
    typeof window !== "undefined" && Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);
  const speechSupported = typeof window !== "undefined" && "speechSynthesis" in window;

  const localeVoices = useMemo(() => {
    const languageRoot = language.split("-")[0].toLowerCase();
    const matching = voices.filter((voice) => voice.lang.toLowerCase().startsWith(languageRoot));
    return matching.length ? matching : voices;
  }, [language, voices]);

  const selectedVoice = useMemo(
    () => {
      const languageRoot = language.split("-")[0].toLowerCase();
      const explicit = voices.find((voice) => voice.voiceURI === voiceURI);
      return explicit?.lang.toLowerCase().startsWith(languageRoot) ? explicit : localeVoices[0];
    },
    [language, localeVoices, voiceURI, voices],
  );

  const changeLanguage = (nextLanguage: "es-ES" | "en-US") => {
    const languageRoot = nextLanguage.split("-")[0].toLowerCase();
    const matchingVoice = voices.find((voice) => voice.lang.toLowerCase().startsWith(languageRoot));
    setLanguage(nextLanguage);
    if (matchingVoice) setVoiceURI(matchingVoice.voiceURI);
  };

  useEffect(() => {
    if (!speechSupported) {
      const timer = window.setTimeout(
        () => setVoiceNotice("Este navegador no ofrece sintesis de voz."),
        0,
      );
      return () => window.clearTimeout(timer);
    }

    const loadVoices = () => {
      const available = window.speechSynthesis.getVoices();
      setVoices(available);
      setVoiceNotice(
        available.length
          ? `${available.length} voces disponibles en este dispositivo`
          : "Esperando las voces instaladas del sistema...",
      );
      if (available.length) {
        const stored = window.localStorage.getItem("vesperer.voiceURI");
        const preferred = available.find((voice) => voice.voiceURI === stored);
        const spanish = available.find((voice) => voice.lang.toLowerCase().startsWith("es"));
        setVoiceURI((current) => current || preferred?.voiceURI || spanish?.voiceURI || available[0].voiceURI);
      }
    };

    loadVoices();
    window.speechSynthesis.addEventListener("voiceschanged", loadVoices);
    return () => window.speechSynthesis.removeEventListener("voiceschanged", loadVoices);
  }, [speechSupported]);

  useEffect(() => {
    if (voiceURI) window.localStorage.setItem("vesperer.voiceURI", voiceURI);
  }, [voiceURI]);

  useEffect(() => {
    conversationRef.current?.scrollTo({ top: conversationRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const browserSpeak = useCallback(
    (text: string) => {
      if (!speechSupported) {
        setVoiceNotice("La sintesis de voz no esta disponible en este navegador.");
        return;
      }

      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = selectedVoice?.lang || language;
      utterance.rate = 0.96;
      utterance.pitch = 1.02;
      if (selectedVoice) utterance.voice = selectedVoice;
      utterance.onstart = () => {
        setIsSpeaking(true);
        setVoiceNotice(`Hablando con ${selectedVoice?.name || "la voz del sistema"}`);
      };
      utterance.onend = () => {
        setIsSpeaking(false);
        setVoiceNotice(`${voices.length} voces disponibles en este dispositivo`);
      };
      utterance.onerror = () => {
        setIsSpeaking(false);
        setVoiceNotice("No se pudo reproducir la voz. Prueba otra en el selector.");
      };
      window.speechSynthesis.speak(utterance);
      window.__vespererVoiceTest?.spoken.push(text);
    },
    [language, selectedVoice, speechSupported, voices.length],
  );

  const stopSpeaking = () => {
    audioRef.current?.pause();
    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current);
      audioUrlRef.current = null;
    }
    if (speechSupported) window.speechSynthesis.cancel();
    setIsSpeaking(false);
    setVoiceNotice("Reproduccion detenida");
  };

  const speak = async (text: string) => {
    stopSpeaking();
    if (mind.agency.voice === "browser") {
      browserSpeak(text);
      return;
    }

    setVoiceNotice("Preparando la voz del personaje...");
    try {
      const response = await fetch("/api/voice/character", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, characterId: character.id }),
      });
      if (
        !response.ok ||
        response.headers.get("X-Vesperer-Voice-Fallback") === "browser"
      ) {
        browserSpeak(text);
        return;
      }

      const audioUrl = URL.createObjectURL(await response.blob());
      audioUrlRef.current = audioUrl;
      const audio = new Audio(audioUrl);
      audioRef.current = audio;
      audio.onplay = () => {
        setIsSpeaking(true);
        setVoiceNotice(
          `Hablando con ${response.headers.get("X-Vesperer-Voice") || character.name}`,
        );
      };
      audio.onended = () => {
        setIsSpeaking(false);
        setVoiceNotice("Voz del personaje lista");
      };
      audio.onerror = () => browserSpeak(text);
      await audio.play();
    } catch {
      browserSpeak(text);
    }
  };

  useEffect(
    () => () => {
      recognitionRef.current?.abort();
      audioRef.current?.pause();
      if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current);
      if (speechSupported) window.speechSynthesis.cancel();
    },
    [speechSupported],
  );

  const toggleListening = () => {
    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      return;
    }

    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Recognition) {
      setVoiceNotice("El dictado no esta disponible. Usa Chrome o Edge y permite el microfono.");
      setDiagnosticsOpen(true);
      return;
    }

    const recognition = new Recognition();
    recognition.lang = language;
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.onstart = () => {
      setIsListening(true);
      setVoiceNotice("Escuchando... habla cuando quieras");
    };
    recognition.onresult = (event) => {
      let transcript = "";
      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        transcript += event.results[index][0].transcript;
      }
      setDraft(transcript.trimStart());
    };
    recognition.onerror = (event) => {
      const denied = event.error === "not-allowed" || event.error === "service-not-allowed";
      setVoiceNotice(
        denied
          ? "Permiso de microfono bloqueado. Habilitalo en la barra del navegador."
          : `No pude escuchar (${event.error}). Intentalo de nuevo.`,
      );
      setIsListening(false);
    };
    recognition.onend = () => {
      setIsListening(false);
      setVoiceNotice("Dictado listo para enviar");
    };
    recognitionRef.current = recognition;
    if (window.__vespererVoiceTest) window.__vespererVoiceTest.recognitionStarts += 1;
    recognition.start();
  };

  const refreshMind = async (delay = 0) => {
    if (delay) await new Promise((resolve) => window.setTimeout(resolve, delay));
    const response = await fetch(
      `/api/chat/mind?characterId=${encodeURIComponent(character.id)}`,
      { cache: "no-store" },
    );
    if (!response.ok) return;
    const data = (await response.json()) as { mind?: LivingMindSnapshot };
    if (data.mind) setMind(data.mind);
  };

  const sendMessage = async (event: FormEvent) => {
    event.preventDefault();
    const text = draft.trim();
    if (!text || busy || !mind.agency.canChat) return;

    const userMessage: Message = {
      id: `user-${messageSequenceRef.current += 1}`,
      role: "user",
      text,
      channel,
      time: nowTime(),
    };
    setMessages((current) => [...current, userMessage]);
    setDraft("");
    setBusy(true);
    setError(null);

    try {
      const response = await fetch("/api/chat/reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, characterId: character.id }),
      });
      const data = (await response.json()) as { error?: string; text?: string };
      if (!response.ok) throw new Error(data.error || "No se pudo responder");
      const reply = data.text?.trim();
      if (!reply) throw new Error("La respuesta llego vacia");
      const assistantMessage: Message = {
        id: `assistant-${messageSequenceRef.current += 1}`,
        role: "sofia",
        text: reply,
        channel,
        time: nowTime(),
      };
      setMessages((current) => [...current, assistantMessage]);
      if (autoSpeak || channel === "Voz") void speak(reply);
      void refreshMind(250);
      void refreshMind(1_800);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudo responder");
    } finally {
      setBusy(false);
    }
  };

  const resetSession = () => {
    stopSpeaking();
    setMessages(startingMessages);
    setDraft("");
  };

  const availableChannels = new Set(
    mind.agency.channels.map((item) => item.toLocaleLowerCase("es")),
  );
  availableChannels.add("web");
  availableChannels.add("voz");
  const confidence = Math.round(
    ((mind.relationship.trust +
      mind.relationship.familiarity +
      mind.relationship.openness) /
      3) *
      100,
  );

  return (
    <div className="vesperer-product">
    <main className="app-shell">
      <aside className="sidebar" aria-label="Navegacion principal">
        <div className="brand-row">
          <Link href="/professionals" className="professional-brand-link" aria-label="Vesperer Professionals home">
            <div className="brand-mark" aria-hidden="true">V</div>
            <div className="brand-copy">
              <strong>VESPERER</strong>
              <span>Professionals</span>
            </div>
          </Link>
          <button className="icon-button mobile-only" title="Abrir menu" aria-label="Abrir menu">
            <Menu size={18} />
          </button>
        </div>

        <Link className="new-session-button" href="/professionals/workspace">
          <Plus size={17} />
          <span>Elegir profesional</span>
        </Link>

        <nav className="session-nav" aria-label="Sesiones">
          <p className="nav-label">Hoy</p>
          <button className="session-item active" type="button">
            <MessageCircle size={17} />
            <span>
              <strong>{character.name} · sesion activa</strong>
              <small>Hace 2 min</small>
            </span>
            <ChevronRight size={15} />
          </button>
          <button className="session-item" type="button">
            <History size={17} />
            <span>
              <strong>Continuidad anterior</strong>
              <small>{mind.memories.length} recuerdos</small>
            </span>
          </button>
          <p className="nav-label">Archivo</p>
          <button className="session-item" type="button">
            <Archive size={17} />
            <span>
              <strong>Historial autobiografico</strong>
              <small>{mind.evidence.length} evidencias</small>
            </span>
          </button>
        </nav>

        <div className="sidebar-footer">
          <div className="privacy-note">
            <ShieldCheck size={17} />
            <span><strong>Local y privado</strong><small>Memoria editable</small></span>
          </div>
          <Link
            className="icon-button"
            href="/personas"
            title="Volver a Vesperer Studio"
            aria-label="Volver a Vesperer Studio"
          >
            <Settings2 size={18} />
          </Link>
        </div>
      </aside>

      <section className="workspace" aria-label={`Sesion con ${character.name}`}>
        <header className="workspace-header">
          <div className="coach-title">
            <span className="presence-dot" aria-hidden="true" />
            <div>
              <h1>{character.name}</h1>
              <p>{character.tagline || "Mente autobiografica"} · sesion continua</p>
            </div>
          </div>

          <div className="header-actions">
            <div className="channel-switch" aria-label="Canal activo">
              {(["Web", "Voz", "Telegram"] as Channel[]).map((item) => (
                <button
                  key={item}
                  type="button"
                  className={channel === item ? "active" : ""}
                  disabled={!availableChannels.has(item.toLocaleLowerCase("es"))}
                  onClick={() => setChannel(item)}
                  aria-pressed={channel === item}
                >
                  {item}
                </button>
              ))}
            </div>
            <button
              className="icon-button"
              title="Diagnostico de voz"
              aria-label="Abrir diagnostico de voz"
              onClick={() => setDiagnosticsOpen(true)}
              data-testid="voice-diagnostics-button"
            >
              <Headphones size={19} />
            </button>
            <button
              className="icon-button mind-toggle"
              title="Abrir mente activa"
              aria-label="Abrir mente activa"
              onClick={() => setMindOpen(true)}
            >
              <BrainCircuit size={19} />
            </button>
            <button className="icon-button" title="Mas opciones" aria-label="Mas opciones">
              <MoreHorizontal size={19} />
            </button>
          </div>
        </header>

        <section className="coach-context" aria-label="Objetivo de la sesion">
          <div className="context-copy">
            <span className="eyebrow"><Sparkles size={14} /> Objetivo activo</span>
            <h2>{character.tagline || `Continua tu relacion con ${character.name}.`}</h2>
            <div className="context-meta">
              <span>{mind.relationship.tone}</span>
              <span>{mind.memories.length} recuerdos</span>
              <span>{mind.intentions.length} intenciones abiertas</span>
            </div>
          </div>
          <div
            className="sofia-portrait"
            role="img"
            aria-label={`Retrato de ${character.name}`}
            style={
              character.coverUrl
                ? {
                    backgroundImage: `linear-gradient(90deg, #f0f5f1 0%, rgba(240, 245, 241, 0.08) 24%), url("${character.coverUrl}")`,
                  }
                : undefined
            }
          />
        </section>

        <div className="conversation" ref={conversationRef} aria-live="polite">
          <div className="date-divider"><span>Hoy · continuidad entre canales</span></div>
          {messages.map((message) => (
            message.role === "system" ? (
              <div className="memory-bridge" key={message.id}>
                <Database size={15} />
                <span>{message.text}</span>
                <small>{message.channel}</small>
              </div>
            ) : (
              <article className={`message ${message.role}`} key={message.id}>
                <div className="message-avatar" aria-hidden="true">
                  {message.role === "sofia"
                    ? character.name.slice(0, 1).toUpperCase()
                    : "TU"}
                </div>
                <div className="message-body">
                  <div className="message-meta">
                    <strong>{message.role === "sofia" ? character.name : "Tu"}</strong>
                    <span>{message.channel} · {message.time}</span>
                    {message.role === "sofia" && (
                      <button
                        className="message-audio"
                        type="button"
                        title="Escuchar respuesta"
                        aria-label="Escuchar esta respuesta"
                        onClick={() => speak(message.text)}
                      >
                        <Volume2 size={15} />
                      </button>
                    )}
                  </div>
                  <p>{message.text}</p>
                </div>
              </article>
            )
          ))}
          {busy ? (
            <div className="memory-bridge">
              <Sparkles size={15} />
              <span>{character.name} esta pensando...</span>
              <small>Vesperer</small>
            </div>
          ) : null}
        </div>

        <footer className="composer-zone">
          <div className={`voice-status ${isListening ? "listening" : ""}`} data-testid="voice-status">
            <span className="status-bars" aria-hidden="true"><i /><i /><i /><i /></span>
            <span>{voiceNotice}</span>
            <button type="button" onClick={() => setDiagnosticsOpen(true)}>Comprobar</button>
          </div>

          <form className="composer" onSubmit={sendMessage}>
            <textarea
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              disabled={!mind.agency.canChat}
              placeholder={
                !mind.agency.canChat
                  ? "Acceso de solo lectura"
                  : isListening
                    ? "Escuchando..."
                    : `Responde a ${character.name} o usa el microfono...`
              }
              aria-label={`Mensaje para ${character.name}`}
              rows={2}
              data-testid="composer-input"
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  event.currentTarget.form?.requestSubmit();
                }
              }}
            />
            <div className="composer-controls">
              <div className="language-switch" aria-label="Idioma de voz">
                <button type="button" className={language === "es-ES" ? "active" : ""} onClick={() => changeLanguage("es-ES")}>ES</button>
                <button type="button" className={language === "en-US" ? "active" : ""} onClick={() => changeLanguage("en-US")}>EN</button>
              </div>
              <button
                type="button"
                className={`mic-button ${isListening ? "active" : ""}`}
                onClick={toggleListening}
                disabled={!mind.agency.canChat}
                title={isListening ? "Detener dictado" : "Dictar con microfono"}
                aria-label={isListening ? "Detener dictado" : "Dictar con microfono"}
                data-testid="mic-button"
              >
                {isListening ? <Square size={17} fill="currentColor" /> : <Mic size={19} />}
              </button>
              <button className="send-button" type="submit" disabled={!draft.trim() || busy || !mind.agency.canChat} title="Enviar" aria-label="Enviar mensaje">
                <Send size={18} />
              </button>
            </div>
          </form>
          <div className="composer-footer">
            <label className="speak-toggle">
              <input type="checkbox" checked={autoSpeak} onChange={(event) => setAutoSpeak(event.target.checked)} />
              <span aria-hidden="true" />
              Leer respuestas de {character.name}
            </label>
            <button type="button" className="text-button" onClick={resetSession}><RotateCcw size={14} /> Reiniciar demo</button>
          </div>
          {error ? <p className="product-chat-error">{error}</p> : null}
        </footer>
      </section>

      <aside className={`mind-panel ${mindOpen ? "open" : ""}`} aria-label="Mente autobiografica activa">
        <div className="mind-header">
          <div>
            <span className="eyebrow">Vesperer engine</span>
            <h2>Mente activa</h2>
          </div>
          <span className="confidence">{confidence}% coherente</span>
          <button className="icon-button mind-close" onClick={() => setMindOpen(false)} aria-label="Cerrar mente activa" title="Cerrar">
            <X size={18} />
          </button>
        </div>

        <div className="mind-tabs" role="tablist">
          <button role="tab" aria-selected={mindTab === "self"} className={mindTab === "self" ? "active" : ""} onClick={() => setMindTab("self")}>Self</button>
          <button role="tab" aria-selected={mindTab === "memory"} className={mindTab === "memory" ? "active" : ""} onClick={() => setMindTab("memory")}>Memoria</button>
          <button role="tab" aria-selected={mindTab === "evidence"} className={mindTab === "evidence" ? "active" : ""} onClick={() => setMindTab("evidence")}>Evidencia</button>
        </div>

        <div className="mind-content">
          {mindTab === "self" && (
            <>
              <section className="mind-section">
                <div className="section-heading"><BrainCircuit size={16} /><h3>Estado autobiografico</h3></div>
                <dl className="state-list">
                  <div><dt>Identidad</dt><dd>{character.name}</dd></div>
                  <div><dt>Estado</dt><dd>{mind.relationship.mood}</dd></div>
                  <div><dt>Meta</dt><dd>{mind.intentions[0]?.content || "Comprender mejor a la persona"}</dd></div>
                  <div><dt>Relacion</dt><dd>{mind.relationship.tone} · confianza {mind.relationship.trust.toFixed(2)}</dd></div>
                </dl>
              </section>
              <section className="mind-section">
                <div className="section-heading"><Sparkles size={16} /><h3>Hipotesis de {character.name}</h3></div>
                <p className="hypothesis">{mind.relationship.summary || mind.summary || "La relacion sigue formandose con cada evidencia nueva."}</p>
                <div className="meter-row"><span>Confianza</span><div className="meter"><i style={{ width: `${Math.round(mind.relationship.trust * 100)}%` }} /></div><strong>{mind.relationship.trust.toFixed(2)}</strong></div>
              </section>
              <section className="mind-section governor">
                <div className="section-heading"><ShieldCheck size={16} /><h3>Governor</h3><span>Activo</span></div>
                <p>Identidad, permisos del workspace y politica de contenido se aplican antes de cada turno.</p>
              </section>
            </>
          )}

          {mindTab === "memory" && (
            <section className="mind-section timeline-section">
              <div className="section-heading"><History size={16} /><h3>Linea autobiografica</h3></div>
              {mind.memories.length ? mind.memories.map((memory, index) => (
                <div className={`timeline-item ${index === 0 ? "current" : ""}`} key={memory.id}>
                  <i />
                  <div>
                    <span>{new Intl.DateTimeFormat("es-ES", { day: "2-digit", month: "short" }).format(new Date(memory.updatedAt))}</span>
                    <strong>{memory.type}</strong>
                    <p>{memory.content}</p>
                  </div>
                </div>
              )) : <p className="hypothesis">La linea autobiografica aparecera despues de las primeras conversaciones.</p>}
            </section>
          )}

          {mindTab === "evidence" && (
            <>
              <section className="mind-section">
                <div className="section-heading"><FileCheck2 size={16} /><h3>Evidencia recuperada</h3></div>
                {mind.evidence.length ? (
                  <>
                    <blockquote>“{mind.evidence.at(-1)?.content}”</blockquote>
                    <div className="evidence-meta"><span>Conversacion</span><span>Ultima evidencia</span></div>
                  </>
                ) : <p className="hypothesis">Todavia no hay evidencia conversacional.</p>}
              </section>
              <section className="mind-section revision">
                <div className="section-heading"><Check size={16} /><h3>Intenciones abiertas</h3><span>{mind.intentions.length}</span></div>
                {mind.intentions.length ? mind.intentions.map((intention) => (
                  <p key={intention.id}><strong>{intention.content}</strong> · {Math.round(intention.confidence * 100)}%</p>
                )) : <p>No hay compromisos pendientes.</p>}
              </section>
            </>
          )}
        </div>
      </aside>

      {mindOpen && <button className="panel-scrim" aria-label="Cerrar panel" onClick={() => setMindOpen(false)} />}

      {diagnosticsOpen && (
        <div className="dialog-layer" role="presentation">
          <section className="voice-dialog" role="dialog" aria-modal="true" aria-labelledby="voice-dialog-title">
            <header>
              <div>
                <span className="eyebrow">Comprobacion local</span>
                <h2 id="voice-dialog-title">Voz de {character.name}</h2>
              </div>
              <button className="icon-button" onClick={() => setDiagnosticsOpen(false)} aria-label="Cerrar diagnostico" title="Cerrar"><X size={18} /></button>
            </header>

            <div className="diagnostic-grid">
              <div className={speechSupported ? "ok" : "error"}>
                {speechSupported ? <Check size={17} /> : <VolumeX size={17} />}
                <span><strong>Sintesis</strong><small>{speechSupported ? "Disponible" : "No compatible"}</small></span>
              </div>
              <div className={voices.length ? "ok" : "warning"}>
                {voices.length ? <Check size={17} /> : <CircleHelp size={17} />}
                <span><strong>Voces</strong><small>{voices.length ? `${voices.length} encontradas` : "Cargando"}</small></span>
              </div>
              <div className={recognitionSupported ? "ok" : "warning"}>
                {recognitionSupported ? <Check size={17} /> : <MicOff size={17} />}
                <span><strong>Dictado</strong><small>{recognitionSupported ? "Disponible" : "Usa Chrome o Edge"}</small></span>
              </div>
            </div>

            <label className="voice-select-label" htmlFor="voice-select">Voz instalada</label>
            <select
              id="voice-select"
              value={selectedVoice?.voiceURI || ""}
              onChange={(event) => setVoiceURI(event.target.value)}
              disabled={!voices.length}
              data-testid="voice-select"
            >
              {!voices.length && <option>Esperando voces del sistema...</option>}
              {localeVoices.map((voice) => (
                <option key={voice.voiceURI} value={voice.voiceURI}>{voice.name} · {voice.lang}</option>
              ))}
            </select>

            <div className="voice-dialog-actions">
              <button
                type="button"
                className="secondary-button"
                onClick={isSpeaking ? stopSpeaking : () => void speak(language === "es-ES" ? `Hola, soy ${character.name}. Tu historia ya esta aqui.` : `Hi, I am ${character.name}. Your story is already here.`)}
                disabled={!speechSupported && mind.agency.voice === "browser"}
                data-testid="test-voice-button"
              >
                {isSpeaking ? <Square size={16} fill="currentColor" /> : <Play size={17} fill="currentColor" />}
                {isSpeaking ? "Detener" : "Probar esta voz"}
              </button>
              <button type="button" className="primary-button" onClick={() => { setDiagnosticsOpen(false); toggleListening(); }} disabled={!recognitionSupported}>
                <Mic size={17} /> Probar microfono
              </button>
            </div>
            <p className="dialog-help">Las voces asignadas usan ElevenLabs y el dispositivo actua como respaldo. El navegador pedira permiso la primera vez que uses el microfono.</p>
          </section>
        </div>
      )}
    </main>
    </div>
  );
}
