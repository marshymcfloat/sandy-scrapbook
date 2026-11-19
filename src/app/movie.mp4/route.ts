import { getCloudflareContext } from "@opennextjs/cloudflare";
import { createMovieTicket, hasMovieTicket, hasSecrets, sessionExpiration } from "../../auth";
import { forwardToCloudflare } from "../../backend";
import { serveMovie } from "../../movie";
import { privateHeaders } from "../../responses";

function unauthorized() {
  return new Response(null, { status: 401, headers: privateHeaders });
}

export async function GET(request: Request) {
  const forwarded = await forwardToCloudflare(request);
  if (forwarded) return forwarded;
  const { env } = await getCloudflareContext({ async: true });
  if (!hasSecrets(env)) return unauthorized();

  const params = new URL(request.url).searchParams;
  const sessionExpires = await sessionExpiration(request, env);
  if (params.get("source") === "direct") {
    if (!sessionExpires) return unauthorized();
    const ticket = await createMovieTicket(sessionExpires, env);
    return new Response(null, {
      status: 307,
      headers: { ...privateHeaders, Location: `/movie.mp4?ticket=${ticket}` },
    });
  }

  if (!sessionExpires && !(await hasMovieTicket(params.get("ticket"), env))) return unauthorized();
  return serveMovie(request, env.MEDIA);
}

export const HEAD = GET;
