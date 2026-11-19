import { getCloudflareContext } from "@opennextjs/cloudflare";
import { hasSession } from "../../auth";
import { forwardToCloudflare } from "../../backend";
import { privateHeaders } from "../../responses";

export async function GET(request: Request) {
  const forwarded = await forwardToCloudflare(request);
  if (forwarded) return forwarded;
  const { env } = await getCloudflareContext({ async: true });
  return new Response(null, {
    status: (await hasSession(request, env)) ? 204 : 401,
    headers: privateHeaders,
  });
}
