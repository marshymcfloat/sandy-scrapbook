import { getCloudflareContext } from "@opennextjs/cloudflare";
import { hasSession } from "../../auth";
import { forwardToCloudflare } from "../../backend";
import { weatherResponse } from "../../weather";
import { textResponse } from "../../responses";

export async function GET(request: Request) {
  const forwarded = await forwardToCloudflare(request);
  if (forwarded) return forwarded;
  const { env } = await getCloudflareContext({ async: true });
  if (!(await hasSession(request, env))) {
    return textResponse("Unlock the shelf to check the weather.", 401);
  }
  return weatherResponse(
    new URL(request.url).searchParams.get("view") === "panels",
  );
}
