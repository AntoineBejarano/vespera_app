import JSZip from "jszip";
import {
  classifyObsidianNote,
  previewObsidianNotes,
  type ClassifiedNotePreview,
} from "@/lib/persona/mind-graph";

export type VaultNote = {
  path: string;
  title: string;
  content: string;
};

function titleFromPath(path: string) {
  const base = path.split("/").pop() || path;
  return base.replace(/\.md$/i, "");
}

export async function notesFromFiles(files: FileList | File[]): Promise<VaultNote[]> {
  const list = Array.from(files);
  const notes: VaultNote[] = [];

  for (const file of list) {
    const name = file.name.toLowerCase();
    if (name.endsWith(".zip")) {
      const buf = await file.arrayBuffer();
      const zip = await JSZip.loadAsync(buf);
      const entries = Object.keys(zip.files);
      for (const path of entries) {
        if (!path.toLowerCase().endsWith(".md")) continue;
        if (path.includes("__MACOSX") || path.startsWith(".")) continue;
        const entry = zip.files[path];
        if (!entry || entry.dir) continue;
        const content = await entry.async("string");
        if (!content.trim()) continue;
        // Drop the zip root folder so paths match vault-relative notes
        const parts = path.split("/");
        const finalPath =
          parts.length > 1 ? parts.slice(1).join("/") : path;
        notes.push({
          path: finalPath,
          title: titleFromPath(finalPath),
          content,
        });
      }
      continue;
    }

    if (!name.endsWith(".md")) continue;
    const content = await file.text();
    if (!content.trim()) continue;
    notes.push({
      path: file.webkitRelativePath || file.name,
      title: titleFromPath(file.name),
      content,
    });
  }

  return notes.slice(0, 120);
}

export function classifyVault(notes: VaultNote[]): ClassifiedNotePreview[] {
  return previewObsidianNotes(notes);
}

export function summarizeClassification(preview: ClassifiedNotePreview[]) {
  const counts: Record<string, number> = {};
  for (const p of preview) {
    counts[p.type] = (counts[p.type] ?? 0) + 1;
  }
  return counts;
}

export { classifyObsidianNote };
