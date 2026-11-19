import { clearSession } from "../../auth";
import { forwardToCloudflare } from "../../backend";
import { redirectHome, textResponse } from "../../responses";

export async function POST(request: Request) {
  const forwarded = await forwardToCloudflare(request);
  if (forwarded) return forwarded;
  const origin = request.headers.get("Origin");
  if (origin && origin !== new URL(request.url).origin) {
    return textResponse("Open the shelf to continue.", 403);
  }
  return redirectHome(clearSession());
}
