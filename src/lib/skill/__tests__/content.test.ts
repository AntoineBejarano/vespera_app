import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  buildVespererSkillFullMd,
  VESPERER_SKILL_MD,
  VESPERER_SKILL_REFERENCE_MD,
  VESPERER_SKILL_RUNTIME_MD,
} from "@/lib/skill/content";
import { markdownSkillResponse } from "@/lib/skill/serve";
import { buildApexLlmsTxt } from "@/lib/seo/build-llms";
import { APEX_STATIC_PAGES } from "@/lib/seo/public-pages";

function repoFile(relative: string) {
  return readFileSync(join(process.cwd(), relative), "utf8").replace(/\n$/, "");
}

describe("public Vesperer skill", () => {
  it("has installable frontmatter and stays under 500 lines", () => {
    assert.match(VESPERER_SKILL_MD, /^---\nname: vesperer\n/);
    assert.match(VESPERER_SKILL_MD, /description:/);
    assert.ok(
      VESPERER_SKILL_MD.split("\n").length < 500,
      "SKILL.md must stay under 500 lines",
    );
    assert.match(VESPERER_SKILL_MD, /vsk_/);
    assert.match(VESPERER_SKILL_MD, /vesp_/);
    assert.match(VESPERER_SKILL_RUNTIME_MD, /vesperer\.context_envelope\.v1/);
    assert.match(VESPERER_SKILL_RUNTIME_MD, /proposed_relationship_update/);
    assert.match(VESPERER_SKILL_REFERENCE_MD, /\/api\/v1\/runtime-bindings/);
  });

  it("keeps skills/vesperer copies in sync", () => {
    assert.equal(repoFile("skills/vesperer/SKILL.md"), VESPERER_SKILL_MD.trimEnd());
    assert.equal(
      repoFile("skills/vesperer/reference.md"),
      VESPERER_SKILL_REFERENCE_MD.trimEnd(),
    );
    assert.equal(
      repoFile("skills/vesperer/runtime.md"),
      VESPERER_SKILL_RUNTIME_MD.trimEnd(),
    );
  });

  it("is advertised first for agents in llms.txt", () => {
    const txt = buildApexLlmsTxt();
    assert.match(txt, /https:\/\/vesperer\.com\/skill/);
    assert.match(txt, /https:\/\/vesperer\.com\/developers/);
    const skillAt = txt.indexOf("/skill");
    const studioAt = txt.indexOf("signed-in studio");
    assert.ok(skillAt !== -1);
    if (studioAt !== -1) {
      assert.ok(skillAt < studioAt);
    }
    assert.match(buildVespererSkillFullMd(), /# Vesperer API reference/);
  });

  it("indexes unique skill URLs and noindexes the concatenated pack", () => {
    const indexed = new Set(APEX_STATIC_PAGES.map((p) => p.path));
    assert.ok(indexed.has("/developers"));
    assert.ok(indexed.has("/skill"));
    assert.ok(indexed.has("/skill/reference"));
    assert.ok(indexed.has("/skill/runtime"));
    assert.equal(indexed.has("/skill.md"), false);
    assert.equal(indexed.has("/skill/full"), false);

    const skill = markdownSkillResponse("# skill", { canonicalPath: "/skill" });
    assert.equal(skill.headers.get("X-Robots-Tag"), "all");
    assert.match(skill.headers.get("Link") ?? "", /\/skill>; rel="canonical"/);
    assert.match(
      skill.headers.get("Link") ?? "",
      /\/developers>; rel="alternate"; type="text\/html"/,
    );

    const pack = markdownSkillResponse("# full", {
      canonicalPath: "/skill",
      index: false,
    });
    assert.equal(pack.headers.get("X-Robots-Tag"), "noindex, follow");
  });
});
