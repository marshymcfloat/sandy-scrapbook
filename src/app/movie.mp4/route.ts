import { getCloudflareContext } from "@opennextjs/cloudflare";
import { hasSession } from "../../auth";
import { forwardToCloudflare } from "../../backend";
import { serveMovie } from "../../movie";
import { privateHeaders } from "../../responses";

export async function GET(request: Request) {
  const forwarded = await forwardToCloudflare(request);
  if (forwarded) return forwarded;
  const { env } = await getCloudflareContext({ async: true });
  if (!await hasSession(request, env)) {
    return new Response(null, { status: 401, headers: privateHeaders });
  }
  return serveMovie(request, env.MEDIA);
}

export const HEAD = GET;
