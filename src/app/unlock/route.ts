import { getCloudflareContext } from "@opennextjs/cloudflare";
import { forwardToCloudflare } from "../../backend";
import {
  createSession,
  hasSecrets,
  matchesPassphrase,
  suppliedPassphrase,
} from "../../auth";
import { privateHeaders, redirectHome, textResponse } from "../../responses";

function feedback(request: Request, reason: string) {
  return new Response(null, {
    status: 303,
    headers: {
      ...privateHeaders,
      Location: new URL(`/?unlock=${reason}`, request.url).href,
    },
  });
}

export async function POST(request: Request) {
  const forwarded = await forwardToCloudflare(request);
  if (forwarded) return forwarded;
  const origin = request.headers.get("Origin");
  if (origin && origin !== new URL(request.url).origin) {
    return textResponse("Open the shelf to continue.", 403);
  }
  const { env } = await getCloudflareContext({ async: true });
  if (!hasSecrets(env)) return feedback(request, "unavailable");

  const key = request.headers.get("CF-Connecting-IP") ?? "local";
  const limit = await env.UNLOCK_LIMITER.limit({ key });
  if (!limit.success) {
    const response = feedback(request, "limited");
    response.headers.set("Retry-After", "60");
    return response;
  }
  const candidate = await suppliedPassphrase(request);
  if (
    !candidate ||
    !(await matchesPassphrase(candidate, env.SITE_PASSPHRASE))
  ) {
    return feedback(request, "invalid");
  }
  return redirectHome(await createSession(env));
}
