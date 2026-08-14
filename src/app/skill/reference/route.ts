import { VESPERER_SKILL_REFERENCE_MD } from "@/lib/skill/content";
import { markdownSkillResponse } from "@/lib/skill/serve";

export const dynamic = "force-static";

export async function GET() {
  return markdownSkillResponse(VESPERER_SKILL_REFERENCE_MD);
}
