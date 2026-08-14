import { buildVespererSkillFullMd } from "@/lib/skill/content";
import { markdownSkillResponse } from "@/lib/skill/serve";

export const dynamic = "force-static";

export async function GET() {
  return markdownSkillResponse(buildVespererSkillFullMd());
}
