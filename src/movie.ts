import { privateHeaders, textResponse } from "./responses";

const MOVIE_KEY = "forrest-gump.mp4";
const OPEN_RANGE_BYTES = 8 * 1024 * 1024;

interface ByteRange {
  offset: number;
  length: number;
}

function parseByteRange(header: string | null, size: number): ByteRange | "unsatisfiable" | null {
  const match = header?.match(/^bytes=(\d*)-(\d*)$/i);
  if (!match || (!match[1] && !match[2])) return null;

  if (!match[1]) {
    const length = Math.min(Number(match[2]), size);
    return length > 0 ? { offset: size - length, length } : "unsatisfiable";
  }

  const offset = Number(match[1]);
  const requestedEnd = match[2] ? Number(match[2]) : offset + OPEN_RANGE_BYTES - 1;
  const end = Math.min(requestedEnd, size - 1);
  return offset <= end ? { offset, length: end - offset + 1 } : "unsatisfiable";
}

export async function serveMovie(request: Request, bucket: R2Bucket, context: ExecutionContext): Promise<Response> {
  try {
    const metadata = await bucket.head(MOVIE_KEY);
    if (!metadata?.size) return textResponse("The movie is temporarily unavailable.", 503);

    const headers = new Headers(privateHeaders);
    headers.set("Content-Type", "video/mp4");
    headers.set("Accept-Ranges", "bytes");
    headers.set("ETag", metadata.httpEtag);

    if (request.method === "HEAD") {
      headers.set("Content-Length", String(metadata.size));
      return new Response(null, { headers });
    }

    const ifRange = request.headers.get("If-Range");
    const range = !ifRange || ifRange === metadata.httpEtag
      ? parseByteRange(request.headers.get("Range"), metadata.size)
      : null;

    if (range === "unsatisfiable") {
      headers.delete("Content-Type");
      headers.set("Content-Range", `bytes */${metadata.size}`);
      return new Response(null, { status: 416, headers });
    }

    const movie = await bucket.get(MOVIE_KEY, {
      ...(range ? { range } : {}),
      onlyIf: { etagMatches: metadata.etag },
    });
    if (!movie || !("body" in movie)) return textResponse("The movie is temporarily unavailable.", 503);

    if (range) {
      headers.set("Content-Range", `bytes ${range.offset}-${range.offset + range.length - 1}/${metadata.size}`);
    }
    const stream = new FixedLengthStream(range?.length ?? metadata.size);
    context.waitUntil(movie.body.pipeTo(stream.writable).catch(() => undefined));

    return new Response(stream.readable, { status: range ? 206 : 200, headers, encodeBody: "manual" });
  } catch (error) {
    console.error("Could not read the movie from storage", error);
    return textResponse("The movie is temporarily unavailable.", 503);
  }
}
