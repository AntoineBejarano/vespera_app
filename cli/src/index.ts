#!/usr/bin/env node
/**
 * Vesperer CLI — create & list personas with an account API key (vsk_…).
 *
 * Usage:
 *   npx tsx cli/src/index.ts login --key vsk_…
 *   npx tsx cli/src/index.ts personas create --from persona.json
 *   npx tsx cli/src/index.ts personas list
 *
 * Env:
 *   VESPERER_API_KEY   account key (vsk_…)
 *   VESPERER_API_URL   default https://vesperer.com
 */

import { mkdirSync, readFileSync, writeFileSync, existsSync } from "fs";
import { homedir } from "os";
import { join } from "path";

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
  writeFileSync(CONFIG_PATH, JSON.stringify(cfg, null, 2) + "\n", { mode: 0o600 });
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
  console.log(`vesperer — AI-friendly CLI for Vesperer personas

Commands:
  login --key <vsk_…> [--url <base>]
  personas list
  personas create --from <file.json>
  personas create --name <n> --soul <file|text> --style <…> --rules <…> --context <…>
  personas create --generate --name <n> --personality <…> --relationship <…> \\
      --attractions <…> --irritations <…> --style <…> [--boundaries <…>] [--intensity 1-5]

Env: VESPERER_API_KEY, VESPERER_API_URL
Docs: https://vesperer.com/docs
`);
}

function readArg(args: string[], name: string): string | undefined {
  const i = args.indexOf(name);
  if (i === -1) return undefined;
  return args[i + 1];
}

function hasFlag(args: string[], name: string) {
  return args.includes(name);
}

function resolveText(value: string | undefined): string | undefined {
  if (value == null) return undefined;
  if (existsSync(value)) return readFileSync(value, "utf8");
  return value;
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

async function main() {
  const args = process.argv.slice(2);
  const cmd = args[0];
  const sub = args[1];

  if (!cmd || cmd === "-h" || cmd === "--help" || cmd === "help") {
    usage();
    process.exit(0);
  }

  const cfg = loadConfig();

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

  if (cmd === "personas" && sub === "list") {
    const key = getApiKey(cfg);
    if (!key) {
      console.error("Missing API key. Run: vesperer login --key vsk_…");
      process.exit(1);
    }
    const data = (await api("GET", "/api/v1/personas", {
      key,
      base: getApiUrl(cfg),
    })) as { personas: Array<{ id: string; name: string; active: boolean }> };
    for (const p of data.personas ?? []) {
      console.log(`${p.id}\t${p.active ? "*" : " "}\t${p.name}`);
    }
    return;
  }

  if (cmd === "personas" && sub === "create") {
    const key = getApiKey(cfg);
    if (!key) {
      console.error("Missing API key. Run: vesperer login --key vsk_…");
      process.exit(1);
    }

    let body: Record<string, unknown>;

    const from = readArg(args, "--from");
    if (from) {
      body = JSON.parse(readFileSync(from, "utf8")) as Record<string, unknown>;
    } else if (hasFlag(args, "--generate")) {
      body = {
        mode: "generate",
        name: readArg(args, "--name"),
        personality: resolveText(readArg(args, "--personality")),
        relationshipType:
          readArg(args, "--relationship") || readArg(args, "--relationshipType"),
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

    const data = (await api("POST", "/api/v1/personas", {
      key,
      base: getApiUrl(cfg),
      body,
    })) as {
      persona: { id: string; name: string; chatApiKey: string; mode: string };
    };

    console.log(JSON.stringify(data.persona, null, 2));
    console.log(
      `\nChat with: curl -X POST ${getApiUrl(cfg)}/api/v1/chat -H "X-Api-Key: ${data.persona.chatApiKey}" -H "Content-Type: application/json" -d '{"message":"Hello","peerId":"demo"}'`,
    );
    return;
  }

  usage();
  process.exit(1);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
