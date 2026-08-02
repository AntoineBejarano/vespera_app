import {
  buildAfterDarkLlmsTxt,
  buildApexLlmsTxt,
  plainTextResponse,
} from "@/lib/seo/build-llms";
import { getRequestSurface } from "@/lib/seo/request-surface";

/** Legacy alias — same body as /llms.txt */
export const dynamic = "force-dynamic";

export async function GET() {
  const { surface } = await getRequestSurface();
  const body =
    surface === "after-dark" ? buildAfterDarkLlmsTxt() : buildApexLlmsTxt();
  return plainTextResponse(body);
}
