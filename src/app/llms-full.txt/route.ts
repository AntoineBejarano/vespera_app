import {
  buildApexLlmsFullTxt,
  buildAfterDarkLlmsTxt,
  plainTextResponse,
} from "@/lib/seo/build-llms";
import { getRequestSurface } from "@/lib/seo/request-surface";

export const dynamic = "force-dynamic";

export async function GET() {
  const { surface } = await getRequestSurface();
  // After Dark stays compact; full SFW catalog lives on the apex host
  const body =
    surface === "after-dark"
      ? buildAfterDarkLlmsTxt()
      : buildApexLlmsFullTxt();
  return plainTextResponse(body, 1800);
}
