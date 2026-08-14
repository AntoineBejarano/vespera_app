#!/usr/bin/env node
/**
 * Vesperer CLI — manage personas & knowledge with an account API key (vsk_…).
 *
 * Usage:
 *   npm run vesperer -- login --key vsk_…
 *   npm run vesperer -- personas create --from persona.json
 *   npm run vesperer -- personas list
 *   npm run vesperer -- personas get <id>
 *   npm run vesperer -- personas update <id> --from patch.json
 *   npm run vesperer -- personas delete <id>
 *   npm run vesperer -- personas chat-key <id>
 *   npm run vesperer -- chat --key vesp_… --message "Hi" --peer demo
 *   npm run vesperer -- knowledge packs list
 *   npm run vesperer -- knowledge packs create --name "…"
 *   npm run vesperer -- knowledge packs link <packId> --character <personaId>
 *
 * Env:
 *   VESPERER_API_KEY   account key (vsk_…)
 *   VESPERER_API_URL   default https://vesperer.com
 */

import { mkdirSync, readFileSync, writeFileSync, existsSync } from "fs";
import { homedir } from "os";
import { join } from "path";
import { stdin as input } from "process";

type Config = { apiKey?: string; apiUrl?: string };

const CONFIG_DIR = join(homedir(), ".vesperer");
const CONFIG_PATH = join(CONFIG_DIR, "config.json");

function loadConfig(): Config {
  if (!existsSync(CONFIG_PATH)) return {};
  try {
    return JSON.parse(readFileSync(CONFIG_PATH, "utf8")) as Config;
  } catch {
    return {};
  }
}

function saveConfig(cfg: Config) {
  mkdirSync(CONFIG_DIR, { recursive: true });
  writeFileSync(CONFIG_PATH, JSON.stringify(cfg, null, 2) + "\n", {
    mode: 0o600,
  });
}

function getApiUrl(cfg: Config) {
  return (
    process.env.VESPERER_API_URL?.replace(/\/$/, "") ||
    cfg.apiUrl?.replace(/\/$/, "") ||
    "https://vesperer.com"
  );
}

function getApiKey(cfg: Config) {
  return process.env.VESPERER_API_KEY || cfg.apiKey || "";
}

function usage() {
  console.log(`vesperer — production CLI for AI agents (Claude, Cursor, …)

Auth:
  login --key <vsk_…> [--url <base>]

Personas (account key vsk_…):
  personas list [--json]
  personas get <id> [--json]
  personas create --from <file.json|->
  personas create --name <n> --soul <file|text> --style <…> --rules <…> --context <…>
      [--intensity 1-5] [--tagline …] [--opening …] [--adult] [--public]
  personas create --generate --name <n> --personality <…> --relationship <…> \\
      --attractions <…> --irritations <…> --style <…> [--boundaries <…>] [--intensity 1-5]
  personas update <id> --from <file.json|->
  personas update <id> --soul <…> [--style …] [--rules …] [--context …] [--name …]
      [--intensity] [--tagline] [--opening] [--adult|--no-adult] [--public|--private] [--active|--inactive]
  personas delete <id>
  personas import --from <card.json|-> --permission-confirmed
  personas chat-key <id> [--rotate] [--accept-operator]

Chat (persona key vesp_…):
  chat --key <vesp_…> --message <text> [--peer <id>] [--display-name <n>] [--age-attested]

Knowledge packs (account key vsk_…):
  knowledge packs list [--json]
  knowledge packs create --name <n> [--description …] [--slug …]
  knowledge packs create --seed <seedKey>
  knowledge packs get <packId> [--json]
  knowledge packs delete <packId>
  knowledge packs link <packId> --character <personaId> [--character <id2>…]
  knowledge packs unlink <packId> --character <personaId>

Telegram bots (account key vsk_…):
  bots list [--json]
  bots create --token <BotFather> --username <name> --character <personaId> [--accept-operator]
  bots delete --bot <botId>

Env: VESPERER_API_KEY, VESPERER_API_URL
Skill: https://vesperer.com/skill
Docs: https://vesperer.com/developers
Claude guide: https://vesperer.com/integrations/claude
`);
}

function readArg(args: string[], name: string): string | undefined {
  const i = args.indexOf(name);
  if (i === -1) return undefined;
  return args[i + 1];
}

function readArgs(args: string[], name: string): string[] {
  const out: string[] = [];
  for (let i = 0; i < args.length; i++) {
    if (args[i] === name && args[i + 1]) {
      out.push(args[i + 1]!);
      i++;
    }
  }
  return out;
}

function hasFlag(args: string[], name: string) {
  return args.includes(name);
}

function resolveText(value: string | undefined): string | undefined {
  if (value == null) return undefined;
  if (existsSync(value)) return readFileSync(value, "utf8");
  return value;
}

async function readStdin(): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of input) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks).toString("utf8");
}

async function readJsonFrom(pathOrDash: string): Promise<Record<string, unknown>> {
  const raw =
    pathOrDash === "-"
      ? await readStdin()
      : readFileSync(pathOrDash, "utf8");
  return JSON.parse(raw) as Record<string, unknown>;
}

function requireAccountKey(cfg: Config): string {
  const key = getApiKey(cfg);
  if (!key) {
    console.error("Missing API key. Run: vesperer login --key vsk_…");
    process.exit(1);
  }
  if (!key.startsWith("vsk_")) {
    console.error("Account commands require a vsk_… key from Settings → API keys.");
    process.exit(1);
  }
  return key;
}

async function api(
  method: string,
  path: string,
  opts: { key: string; base: string; body?: unknown },
) {
  const res = await fetch(`${opts.base}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      "X-Api-Key": opts.key,
      "User-Agent": "vesperer-cli/1.0",
    },
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg =
      typeof data === "object" && data && "error" in data
        ? String((data as { error: string }).error)
        : res.statusText;
    throw new Error(`${res.status}: ${msg}`);
  }
  return data;
}

function printJson(data: unknown) {
  console.log(JSON.stringify(data, null, 2));
}

async function main() {
  const args = process.argv.slice(2);
  const cmd = args[0];
  const sub = args[1];
  const third = args[2];

  if (!cmd || cmd === "-h" || cmd === "--help" || cmd === "help") {
    usage();
    process.exit(0);
  }

  const cfg = loadConfig();
  const base = getApiUrl(cfg);
  const asJson = hasFlag(args, "--json");

  if (cmd === "login") {
    const key = readArg(args, "--key");
    const url = readArg(args, "--url");
    if (!key?.startsWith("vsk_")) {
      console.error("Pass --key vsk_… (account API key from Settings).");
      process.exit(1);
    }
    saveConfig({
      ...cfg,
      apiKey: key,
      apiUrl: url || cfg.apiUrl,
    });
    console.log(`Saved credentials to ${CONFIG_PATH}`);
    return;
  }

  // ── personas ──────────────────────────────────────────────
  if (cmd === "personas" && sub === "list") {
    const key = requireAccountKey(cfg);
    const data = (await api("GET", "/api/v1/personas", { key, base })) as {
      personas: Array<{
        id: string;
        name: string;
        active: boolean;
        slug: string | null;
        isPublic: boolean;
        isAdult: boolean;
        tagline: string | null;
      }>;
    };
    if (asJson) {
      printJson(data);
      return;
    }
    for (const p of data.personas ?? []) {
      const flags = [
        p.active ? "active" : "",
        p.isPublic ? "public" : "",
        p.isAdult ? "adult" : "",
      ]
        .filter(Boolean)
        .join(",");
      console.log(
        `${p.id}\t${p.active ? "*" : " "}\t${p.name}${flags ? `\t[${flags}]` : ""}${p.slug ? `\t/${p.slug}` : ""}`,
      );
    }
    return;
  }

  if (cmd === "personas" && sub === "get") {
    const id = third;
    if (!id) {
      console.error("Usage: personas get <id>");
      process.exit(1);
    }
    const key = requireAccountKey(cfg);
    const data = await api("GET", `/api/v1/personas/${id}`, { key, base });
    printJson(data);
    return;
  }

  if (cmd === "personas" && sub === "create") {
    const key = requireAccountKey(cfg);
    let body: Record<string, unknown>;

    const from = readArg(args, "--from");
    if (from) {
      body = await readJsonFrom(from);
    } else if (hasFlag(args, "--generate")) {
      body = {
        mode: "generate",
        name: readArg(args, "--name"),
        personality: resolveText(readArg(args, "--personality")),
        relationshipType:
          readArg(args, "--relationship") ||
          readArg(args, "--relationshipType"),
        attractions: resolveText(readArg(args, "--attractions")),
        irritations: resolveText(readArg(args, "--irritations")),
        boundaries: resolveText(readArg(args, "--boundaries")) || "",
        style: resolveText(readArg(args, "--style")),
        intensity: Number(readArg(args, "--intensity") || "3"),
      };
    } else {
      body = {
        mode: "direct",
        name: readArg(args, "--name"),
        soul: resolveText(readArg(args, "--soul")),
        style: resolveText(readArg(args, "--style")),
        rules: resolveText(readArg(args, "--rules")),
        context: resolveText(readArg(args, "--context")),
        intensity: Number(readArg(args, "--intensity") || "3"),
        tagline: readArg(args, "--tagline"),
        openingLine: resolveText(readArg(args, "--opening")),
      };
    }

    if (hasFlag(args, "--adult")) body.isAdult = true;
    if (hasFlag(args, "--public")) body.isPublic = true;

    const data = (await api("POST", "/api/v1/personas", {
      key,
      base,
      body,
    })) as {
      persona: { id: string; name: string; chatApiKey: string; mode: string };
    };

    printJson(data.persona);
    console.error(
      `\nChat: npm run vesperer -- chat --key ${data.persona.chatApiKey} --message "Hello" --peer demo --age-attested`,
    );
    return;
  }

  if (cmd === "personas" && sub === "update") {
    const id = third;
    if (!id) {
      console.error("Usage: personas update <id> --from patch.json");
      process.exit(1);
    }
    const key = requireAccountKey(cfg);
    let body: Record<string, unknown> = {};

    const from = readArg(args, "--from");
    if (from) {
      body = await readJsonFrom(from);
    } else {
      const name = readArg(args, "--name");
      const soul = resolveText(readArg(args, "--soul"));
      const style = resolveText(readArg(args, "--style"));
      const rules = resolveText(readArg(args, "--rules"));
      const context = resolveText(readArg(args, "--context"));
      const intensity = readArg(args, "--intensity");
      const tagline = readArg(args, "--tagline");
      const opening = resolveText(readArg(args, "--opening"));
      const slug = readArg(args, "--slug");
      if (name) body.name = name;
      if (soul) body.soul = soul;
      if (style) body.style = style;
      if (rules) body.rules = rules;
      if (context) body.context = context;
      if (intensity) body.intensity = Number(intensity);
      if (tagline !== undefined) body.tagline = tagline;
      if (opening !== undefined) body.openingLine = opening;
      if (slug) body.slug = slug;
    }

    if (hasFlag(args, "--adult")) body.isAdult = true;
    if (hasFlag(args, "--no-adult")) body.isAdult = false;
    if (hasFlag(args, "--public")) {
      body.isPublic = true;
      if (hasFlag(args, "--accept-operator")) {
        body.platformOperatorAccepted = true;
      }
    }
    if (hasFlag(args, "--private")) body.isPublic = false;
    if (hasFlag(args, "--active")) body.active = true;
    if (hasFlag(args, "--inactive")) body.active = false;

    if (Object.keys(body).length === 0) {
      console.error("Nothing to update. Pass --from or field flags.");
      process.exit(1);
    }

    const data = await api("PATCH", `/api/v1/personas/${id}`, {
      key,
      base,
      body,
    });
    printJson(data);
    return;
  }

  if (cmd === "personas" && sub === "delete") {
    const id = third;
    if (!id) {
      console.error("Usage: personas delete <id>");
      process.exit(1);
    }
    const key = requireAccountKey(cfg);
    const data = await api("DELETE", `/api/v1/personas/${id}`, { key, base });
    printJson(data);
    return;
  }

  if (cmd === "personas" && sub === "import") {
    const key = requireAccountKey(cfg);
    const from = readArg(args, "--from");
    if (!from) {
      console.error("Usage: personas import --from card.json --permission-confirmed");
      process.exit(1);
    }
    if (!hasFlag(args, "--permission-confirmed")) {
      console.error(
        "Pass --permission-confirmed to attest you have rights to this content.",
      );
      process.exit(1);
    }
    const card = await readJsonFrom(from);
    const raw =
      typeof card.raw === "string" ? card.raw : JSON.stringify(card);
    const body = {
      raw,
      source: readArg(args, "--source"),
      permissionConfirmed: true as const,
      nameOverride: readArg(args, "--name"),
      intensity: readArg(args, "--intensity")
        ? Number(readArg(args, "--intensity"))
        : undefined,
    };
    const data = await api("POST", "/api/v1/personas/import", {
      key,
      base,
      body,
    });
    printJson(data);
    return;
  }

  if (cmd === "personas" && sub === "chat-key") {
    const id = third;
    if (!id) {
      console.error("Usage: personas chat-key <id> [--rotate]");
      process.exit(1);
    }
    const key = requireAccountKey(cfg);
    if (hasFlag(args, "--rotate")) {
      const data = await api("POST", `/api/v1/personas/${id}/chat-key`, {
        key,
        base,
        body: {
          platformOperatorAccepted: hasFlag(args, "--accept-operator") || undefined,
        },
      });
      printJson(data);
      return;
    }
    const data = await api("GET", `/api/v1/personas/${id}/chat-key`, {
      key,
      base,
    });
    printJson(data);
    return;
  }

  // ── chat ──────────────────────────────────────────────────
  if (cmd === "chat") {
    const chatKey = readArg(args, "--key");
    const message = resolveText(readArg(args, "--message"));
    if (!chatKey?.startsWith("vesp_") || !message) {
      console.error(
        'Usage: chat --key vesp_… --message "Hello" [--peer id] [--age-attested]',
      );
      process.exit(1);
    }
    const data = await api("POST", "/api/v1/chat", {
      key: chatKey,
      base,
      body: {
        message,
        peerId: readArg(args, "--peer") || "cli",
        displayName: readArg(args, "--display-name"),
        endUserAgeAttested: hasFlag(args, "--age-attested"),
      },
    });
    if (asJson) {
      printJson(data);
      return;
    }
    const text =
      typeof data === "object" && data && "text" in data
        ? String((data as { text: string }).text)
        : JSON.stringify(data);
    console.log(text);
    return;
  }

  // ── knowledge ─────────────────────────────────────────────
  if (cmd === "knowledge" && sub === "packs") {
    const action = third;
    const key = requireAccountKey(cfg);

    if (action === "list") {
      const data = await api("GET", "/api/v1/knowledge/packs", { key, base });
      if (asJson) {
        printJson(data);
        return;
      }
      const packs =
        (data as { packs?: Array<{ id: string; name: string; active: boolean }> })
          .packs ?? [];
      for (const p of packs) {
        console.log(`${p.id}\t${p.active ? "*" : " "}\t${p.name}`);
      }
      return;
    }

    if (action === "create") {
      const seedKey = readArg(args, "--seed");
      const body = seedKey
        ? { seedKey }
        : {
            name: readArg(args, "--name"),
            description: readArg(args, "--description"),
            slug: readArg(args, "--slug"),
            language: readArg(args, "--language"),
          };
      if (!seedKey && !body.name) {
        console.error("Usage: knowledge packs create --name … | --seed <key>");
        process.exit(1);
      }
      const data = await api("POST", "/api/v1/knowledge/packs", {
        key,
        base,
        body,
      });
      printJson(data);
      return;
    }

    if (action === "get") {
      const packId = args[3];
      if (!packId) {
        console.error("Usage: knowledge packs get <packId>");
        process.exit(1);
      }
      const data = await api("GET", `/api/v1/knowledge/packs/${packId}`, {
        key,
        base,
      });
      printJson(data);
      return;
    }

    if (action === "delete") {
      const packId = args[3];
      if (!packId) {
        console.error("Usage: knowledge packs delete <packId>");
        process.exit(1);
      }
      const data = await api("DELETE", `/api/v1/knowledge/packs/${packId}`, {
        key,
        base,
      });
      printJson(data);
      return;
    }

    if (action === "link") {
      const packId = args[3];
      const characterIds = readArgs(args, "--character");
      if (!packId || characterIds.length === 0) {
        console.error(
          "Usage: knowledge packs link <packId> --character <personaId>",
        );
        process.exit(1);
      }
      const data = await api(
        "POST",
        `/api/v1/knowledge/packs/${packId}/links`,
        { key, base, body: { characterIds } },
      );
      printJson(data);
      return;
    }

    if (action === "unlink") {
      const packId = args[3];
      const characterId = readArg(args, "--character");
      if (!packId || !characterId) {
        console.error(
          "Usage: knowledge packs unlink <packId> --character <personaId>",
        );
        process.exit(1);
      }
      const data = await api(
        "DELETE",
        `/api/v1/knowledge/packs/${packId}/links?characterId=${encodeURIComponent(characterId)}`,
        { key, base },
      );
      printJson(data);
      return;
    }
  }

  // ── telegram bots ─────────────────────────────────────────
  if (cmd === "bots") {
    const key = requireAccountKey(cfg);

    if (sub === "list") {
      const data = await api("GET", "/api/v1/bots", { key, base });
      if (asJson) {
        printJson(data);
        return;
      }
      const bots =
        (
          data as {
            bots?: Array<{
              id: string;
              username: string;
              characterName: string;
              active: boolean;
            }>;
          }
        ).bots ?? [];
      for (const b of bots) {
        console.log(
          `${b.id}\t${b.active ? "*" : " "}\t@${b.username}\t→ ${b.characterName}`,
        );
      }
      return;
    }

    if (sub === "create") {
      const token = readArg(args, "--token");
      const username = readArg(args, "--username");
      const characterId = readArg(args, "--character");
      if (!token || !username || !characterId) {
        console.error(
          "Usage: bots create --token <BotFather> --username <name> --character <personaId> --accept-operator",
        );
        process.exit(1);
      }
      const data = await api("POST", "/api/v1/bots", {
        key,
        base,
        body: {
          token,
          username,
          characterId,
          label: readArg(args, "--label"),
          platformOperatorAccepted:
            hasFlag(args, "--accept-operator") || undefined,
          setWebhook: !hasFlag(args, "--no-webhook"),
        },
      });
      printJson(data);
      return;
    }

    if (sub === "delete") {
      const botId = readArg(args, "--bot") || third;
      if (!botId) {
        console.error("Usage: bots delete --bot <botId>");
        process.exit(1);
      }
      const data = await api(
        "DELETE",
        `/api/v1/bots?botId=${encodeURIComponent(botId)}`,
        { key, base },
      );
      printJson(data);
      return;
    }
  }

  usage();
  process.exit(1);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
