#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const dist = join(here, "..", "dist", "index.js");
const src = join(here, "..", "src", "index.ts");

if (existsSync(dist)) {
  await import(pathToFileURL(dist).href);
} else {
  const r = spawnSync(
    process.execPath,
    ["--import", "tsx", src, ...process.argv.slice(2)],
    { stdio: "inherit" },
  );
  if (r.error || r.status === null) {
    // Fallback: run via npx tsx if local tsx loader missing
    const r2 = spawnSync(
      "npx",
      ["--yes", "tsx", src, ...process.argv.slice(2)],
      { stdio: "inherit", shell: process.platform === "win32" },
    );
    process.exit(r2.status ?? 1);
  }
  process.exit(r.status ?? 0);
}
