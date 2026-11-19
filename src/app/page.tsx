import { headers } from "next/headers";
import { getSiteAccess } from "../backend";
import { Gate } from "../components/Gate";
import { Scrapbook } from "../components/Scrapbook";

export const dynamic = "force-dynamic";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ unlock?: string; note?: string }>;
}) {
  const request = new Request("https://scrapbook.local/", {
    headers: await headers(),
  });
  const access = await getSiteAccess(request);
  if (access) {
    const { note } = await searchParams;
    return <Scrapbook initialNoteOpen={note === "new"} {...access} />;
  }

  const { unlock } = await searchParams;
  const messages = new Map([
    ["invalid", "That passphrase didn’t match. Try again."],
    ["unavailable", "The shelf is getting ready. Try again later."],
    ["limited", "Too many tries. Wait a minute and try again."],
  ]);
  return (
    <Gate message={messages.get(unlock ?? "")} invalid={unlock === "invalid"} />
  );
}
