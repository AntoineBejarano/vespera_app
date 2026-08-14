import { buildVespererSkillFullMd } from "@/lib/skill/content";
import { markdownSkillResponse } from "@/lib/skill/serve";

export const dynamic = "force-static";

/** Concatenated pack for agents. Duplicate of /skill + reference + runtime — do not index. */
export async function GET() {
  return markdownSkillResponse(buildVespererSkillFullMd(), {
    canonicalPath: "/skill",
    index: false,
  });
}
