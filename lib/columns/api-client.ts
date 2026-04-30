import type { PageResult } from "@/lib/columns/types";

export async function callColumnApi(
  typeId: string,
  config: Record<string, unknown>,
  cursor?: string,
): Promise<PageResult> {
  const res = await fetch(`/api/columns/${typeId}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      config,
      ...(cursor !== undefined ? { op: "loadMore", cursor } : {}),
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
    throw new Error(err.error ?? `HTTP ${res.status}`);
  }
  return (await res.json()) as PageResult;
}
