import { prisma } from "@/lib/db";
import type { RuntimeBindingView } from "@/lib/reasoning/types";
import { resolveReasoningMode } from "@/lib/reasoning/mode";

export { resolveReasoningMode };

export async function loadRuntimeBinding(params: {
  workspaceId: string;
  bindingId: string | null | undefined;
}): Promise<
  | { ok: true; binding: RuntimeBindingView }
  | { ok: false; error: string; status: number }
> {
  if (!params.bindingId) {
    return {
      ok: false,
      status: 400,
      error: "External reasoning requires a workspace runtime binding.",
    };
  }
  const row = await prisma.runtimeBinding.findFirst({
    where: { id: params.bindingId, workspaceId: params.workspaceId },
  });
  if (!row) {
    return {
      ok: false,
      status: 400,
      error: "Runtime binding not found in this workspace.",
    };
  }
  return {
    ok: true,
    binding: {
      id: row.id,
      workspaceId: row.workspaceId,
      name: row.name,
      kind: row.kind,
      baseUrl: row.baseUrl,
      authSecretRef: row.authSecretRef,
      timeoutMs: row.timeoutMs,
    },
  };
}
