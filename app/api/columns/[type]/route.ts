import { NextResponse } from "next/server";
import { getServerFetcher } from "@/lib/columns/server-registry";

// Grok calls are slow and expensive — don't cache, always fresh on refresh.
export const dynamic = "force-dynamic";
export const maxDuration = 60;

type RouteContext = { params: Promise<{ type: string }> };

export async function POST(req: Request, context: RouteContext) {
  const { type } = await context.params;
  const fetcher = getServerFetcher(type);
  if (!fetcher) {
    return NextResponse.json(
      { error: `Unknown column type: ${type}` },
      { status: 404 },
    );
  }

  const body = await req.json().catch(() => ({}));
  const config = (body?.config ?? {}) as Record<string, unknown>;
  const cursor =
    body?.op === "loadMore" && typeof body?.cursor === "string"
      ? (body.cursor as string)
      : undefined;

  try {
    const result = await fetcher(config, cursor);
    return NextResponse.json(result);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error(`[api/columns/${type}]`, msg);
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
