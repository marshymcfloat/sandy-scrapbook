import { clearSession, createSession, hasSecrets, hasSession, matchesPassphrase, suppliedPassphrase } from "./auth";
import type { Secrets } from "./auth";
import { serveMovie } from "./movie";
import { shelfPage, unlockPage } from "./pages";
import { htmlResponse, redirectHome, textResponse } from "./responses";
import { weatherResponse } from "./weather";

interface Env extends Partial<Secrets> {
  ASSETS: Fetcher;
  MEDIA: R2Bucket;
  UNLOCK_LIMITER: RateLimit;
}

function allowMethod(allow: string) {
  return textResponse("Method not allowed.", 405, { Allow: allow });
}

function fromSameOrigin(request: Request, url: URL): boolean {
  const origin = request.headers.get("Origin");
  return origin === null || origin === url.origin;
}

async function unlock(request: Request, env: Env) {
  if (!hasSecrets(env)) return htmlResponse(unlockPage("The shelf is getting ready. Try again later."), 503);

  const key = request.headers.get("CF-Connecting-IP") ?? "local";
  const result = await env.UNLOCK_LIMITER.limit({ key });
  if (!result.success) {
    return htmlResponse(unlockPage("Too many tries. Wait a minute and try again."), 429, { "Retry-After": "60" });
  }

  const candidate = await suppliedPassphrase(request);
  if (!candidate || !await matchesPassphrase(candidate, env.SITE_PASSPHRASE)) {
    return htmlResponse(unlockPage("That passphrase didn’t match. Try again.", true), 401);
  }

  return redirectHome(await createSession(env));
}

export default {
  async fetch(request, env, context): Promise<Response> {
    const url = new URL(request.url);
    const canRead = request.method === "GET" || request.method === "HEAD";

    if (url.pathname.startsWith("/assets/")) {
      return canRead ? env.ASSETS.fetch(request) : allowMethod("GET, HEAD");
    }

    switch (url.pathname) {
      case "/":
        if (!canRead) return allowMethod("GET, HEAD");
        return htmlResponse(await hasSession(request, env) ? shelfPage() : unlockPage());
      case "/unlock":
        if (request.method !== "POST") return allowMethod("POST");
        if (!fromSameOrigin(request, url)) return textResponse("Open the shelf to continue.", 403);
        return unlock(request, env);
      case "/lock":
        if (request.method !== "POST") return allowMethod("POST");
        if (!fromSameOrigin(request, url)) return textResponse("Open the shelf to continue.", 403);
        return redirectHome(clearSession());
      case "/weather":
        if (request.method !== "GET") return allowMethod("GET");
        if (!await hasSession(request, env)) return textResponse("Unlock the shelf to check the weather.", 401);
        return weatherResponse(url.searchParams.get("view") === "panels");
      case "/movie.mp4":
        if (!canRead) return allowMethod("GET, HEAD");
        if (!await hasSession(request, env)) {
          return new Response(null, { status: 401, headers: { "Cache-Control": "private, no-store" } });
        }
        return serveMovie(request, env.MEDIA, context);
      default:
        return textResponse("Page not found.", 404);
    }
  },
} satisfies ExportedHandler<Env>;
