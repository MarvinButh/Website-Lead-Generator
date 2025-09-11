import { NextRequest } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic"; // always proxy fresh
export const maxDuration = 60; // allow slower backend calls on free tiers

// Proxy any request under /api/backend/* to the real backend URL.
// Set API_INTERNAL_BASE to the full backend base URL (e.g. https://your-backend.vercel.app/api)
const BACKEND_BASE = process.env.API_INTERNAL_BASE || "http://localhost:8000";

type NextCtx = { params?: Promise<{ path: string[] } | undefined> | { path?: string[] } | undefined };

async function proxy(req: NextRequest, context: NextCtx) {
  // Next.js may provide context.params as a Promise in some versions/build environments.
  // Awaiting works if it's a Promise or a plain object.
  const resolved = await (context?.params ?? {} as { path?: string[] });
  const pathParam = (resolved as { path?: string[] } | undefined)?.path;
  const path = Array.isArray(pathParam) ? pathParam.join("/") : String(pathParam || "");
  const url = new URL(req.url);
  const target = `${BACKEND_BASE.replace(/\/$/, "")}/${path}${url.search}`;

  const fwdHeaders = new Headers(req.headers);
  ["host", "x-forwarded-host", "x-forwarded-proto", "content-length"].forEach((h) => fwdHeaders.delete(h));

  const init: RequestInit = {
    method: req.method,
    headers: fwdHeaders,
    body: undefined,
    cache: "no-store",
  };

  if (["GET", "HEAD"].includes(req.method) === false) {
    init.body = req.body ? req.body : await req.clone().arrayBuffer();
  }

  const res = await fetch(target, init);
  const resHeaders = new Headers(res.headers);
  ["content-length", "transfer-encoding", "connection"].forEach((h) => resHeaders.delete(h));

  return new Response(res.body, { status: res.status, statusText: res.statusText, headers: resHeaders });
}

export { proxy as GET, proxy as POST, proxy as PUT, proxy as PATCH, proxy as DELETE, proxy as HEAD, proxy as OPTIONS };
