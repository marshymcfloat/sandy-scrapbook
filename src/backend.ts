import { getCloudflareContext } from "@opennextjs/cloudflare";
import { hasSession } from "./auth";
import { privateHeaders, textResponse } from "./responses";

// Vercel renders the same React app while Cloudflare owns the private R2 access and sessions.
export async function forwardToCloudflare(
  request: Request,
): Promise<Response | null> {
  if (process.env.VERCEL !== "1") return null;
  const backend = process.env.CLOUDFLARE_BACKEND_URL;
  if (!backend)
    return textResponse(
      "The scrapbook is getting ready. Try again later.",
      503,
    );

  const incoming = new URL(request.url);
  const origin = request.headers.get("Origin");
  if (request.method === "POST" && origin && origin !== incoming.origin) {
    return textResponse("Open the shelf to continue.", 403);
  }
  const upstream = new URL(incoming.pathname + incoming.search, backend);
  const headers = new Headers();
  for (const name of ["Content-Type", "Range", "If-Range"]) {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  }
  const cookie = request.headers
    .get("Cookie")
    ?.split(/;\s*/)
    .find((entry) => entry.startsWith("__Host-sandyfave="));
  if (cookie) headers.set("Cookie", cookie);
  if (request.method === "POST") headers.set("Origin", upstream.origin);

  const options: RequestInit & { duplex?: "half" } = {
    method: request.method,
    headers,
    redirect: "manual",
    cache: "no-store",
    signal: request.signal,
  };
  if (request.body) {
    options.body = request.body;
    options.duplex = "half";
  }
  try {
    const response = await fetch(upstream, options);
    const outgoing = new Headers(response.headers);
    // fetch decodes compressed responses before exposing the stream.
    const encoding = outgoing.get("Content-Encoding");
    outgoing.delete("Content-Encoding");
    outgoing.delete("Transfer-Encoding");
    if (incoming.pathname !== "/movie.mp4" || (encoding && encoding.toLowerCase() !== "identity")) {
      outgoing.delete("Content-Length");
    } else if (response.status === 206) {
      // The Worker can stream the requested bytes without a Content-Length header.
      const range = outgoing.get("Content-Range")?.match(/^bytes (\d+)-(\d+)\/\d+$/i);
      if (range) {
        const start = Number(range[1]);
        const end = Number(range[2]);
        const length = end - start + 1;
        if (
          Number.isSafeInteger(start) && Number.isSafeInteger(end) &&
          Number.isSafeInteger(length) && length > 0
        ) {
          outgoing.set("Content-Length", String(length));
        }
      }
    }
    for (const [name, value] of Object.entries(privateHeaders))
      outgoing.set(name, value);
    const location = outgoing.get("Location");
    if (location) {
      const target = new URL(location, upstream);
      outgoing.set("Location", target.pathname + target.search);
    }
    return new Response(response.body, {
      status: response.status,
      headers: outgoing,
    });
  } catch (error) {
    if (!request.signal.aborted)
      console.error("Cloudflare backend request failed", error);
    return textResponse(
      "The scrapbook is temporarily unavailable. Try again.",
      503,
    );
  }
}

export async function hasSiteSession(request: Request) {
  const sessionRequest = new Request(new URL("/session", request.url), {
    headers: request.headers,
  });
  const forwarded = await forwardToCloudflare(sessionRequest);
  if (forwarded) return forwarded.status === 204;
  const { env } = await getCloudflareContext({ async: true });
  return hasSession(request, env);
}
