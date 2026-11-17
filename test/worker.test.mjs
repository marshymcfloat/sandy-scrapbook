import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { after, before, test } from "node:test";
import { build } from "esbuild";
import { convertV4MiniflareOptions, Miniflare } from "miniflare";

const origin = "https://shelf.test";
const secrets = {
  SITE_PASSPHRASE: "a private test phrase",
  SESSION_SECRET: "test-key-used-for-http-integration-tests",
};
const fixture = Uint8Array.from({ length: 16 }, (_, index) => index);
let runtime;
let session;

function request(path, options) {
  return runtime.dispatchFetch(origin + path, options);
}

function authenticate(passphrase, extraHeaders) {
  return request("/unlock", {
    method: "POST",
    redirect: "manual",
    headers: { "Content-Type": "application/x-www-form-urlencoded", ...extraHeaders },
    body: new URLSearchParams({ passphrase }).toString(),
  });
}

before(async () => {
  const { outputFiles } = await build({
    entryPoints: ["src/worker.ts"], write: false, bundle: true, format: "esm",
  });
  runtime = new Miniflare(convertV4MiniflareOptions({
    modules: true,
    script: outputFiles[0].text,
    compatibilityDate: "2026-01-01",
    bindings: secrets,
    r2Buckets: ["MEDIA"],
    ratelimits: { UNLOCK_LIMITER: { namespace_id: "1", simple: { limit: 10, period: 60 } } },
  }));
  const storage = await runtime.getR2Bucket("MEDIA");
  await storage.put("forrest-gump.mp4", fixture);
  session = await authenticate(secrets.SITE_PASSPHRASE);
});

after(async () => {
  await runtime?.dispose();
});

test("personal content and the movie stay locked without a session", async () => {
  const page = await request("/");
  const body = await page.text();
  assert.match(body, /Open the shelf/);
  assert.doesNotMatch(body, /Happy birthday|Forrest Gump|Smiley meat loaf/);

  for (const method of ["GET", "HEAD"]) {
    const movie = await request("/movie.mp4", { method, headers: { Range: "bytes=0-1" } });
    assert.equal(movie.status, 401);
    assert.equal(await movie.text(), "");
  }
});

test("the passphrase creates a private 30-day session, and the Lock button clears it", async () => {
  assert.equal(session.status, 303);
  const cookie = session.headers.get("Set-Cookie");
  assert.match(cookie, /Max-Age=2592000; Secure; HttpOnly; SameSite=Lax/);
  const page = await request("/", { headers: { Cookie: cookie.split(";")[0] } });
  assert.match(await page.text(), /Happy birthday, Sandy/);
  assert.equal(page.headers.get("Cache-Control"), "private, no-store");

  const lock = await request("/lock", { method: "POST", redirect: "manual" });
  assert.equal(lock.status, 303);
  assert.match(lock.headers.get("Set-Cookie"), /^__Host-sandyfave=; .*Max-Age=0/);
});

test("wrong passphrases and expired or modified sessions are rejected", async () => {
  const wrong = await authenticate("wrong");
  assert.equal(wrong.status, 401);
  assert.match(await wrong.text(), /passphrase didn’t match/);
  assert.equal(wrong.headers.get("Set-Cookie"), null);

  const time = Math.floor(Date.now() / 1000) - 1;
  const material = JSON.stringify([secrets.SESSION_SECRET, secrets.SITE_PASSPHRASE]);
  const signature = createHmac("sha256", material).update(`sandyfave/v1/${time}`).digest("base64url");
  const expired = `__Host-sandyfave=${time}.${signature}`;
  const valid = session.headers.get("Set-Cookie").split(";")[0];
  const modified = valid.replace(/\.(.)/, (_, first) => first === "a" ? ".b" : ".a");

  for (const Cookie of [expired, modified]) {
    assert.match(await (await request("/", { headers: { Cookie } })).text(), /Open the shelf/);
    assert.equal((await request("/movie.mp4", { headers: { Cookie } })).status, 401);
  }
});

test("MP4 endpoint returns bounded, suffix, and unsatisfiable ranges", async () => {
  const Cookie = session.headers.get("Set-Cookie").split(";")[0];
  const head = await request("/movie.mp4", { method: "HEAD", headers: { Cookie } });
  assert.equal(head.status, 200);
  assert.equal(head.headers.get("Content-Length"), "16");
  assert.equal(head.headers.get("Accept-Ranges"), "bytes");

  for (const [Range, start, end] of [["bytes=0-1", 0, 1], ["bytes=3-5", 3, 5], ["bytes=-4", 12, 15], ["bytes=15-", 15, 15]]) {
    const res = await request("/movie.mp4", { headers: { Cookie, Range } });
    assert.equal(res.status, 206);
    assert.equal(res.headers.get("Content-Range"), `bytes ${start}-${end}/16`);
    assert.equal(res.headers.get("Content-Length"), String(end - start + 1));
    assert.deepEqual(new Uint8Array(await res.arrayBuffer()), fixture.slice(start, end + 1));
  }

  const unsatisfiable = await request("/movie.mp4", { headers: { Cookie, Range: "bytes=16-" } });
  assert.equal(unsatisfiable.status, 416);
  assert.equal(unsatisfiable.headers.get("Content-Range"), "bytes */16");

  const complete = await request("/movie.mp4", {
    headers: { Cookie, Range: "bytes=0-1", "If-Range": '"old-etag"' },
  });
  assert.equal(complete.status, 200);
  assert.deepEqual(new Uint8Array(await complete.arrayBuffer()), fixture);
});

test("the unlock endpoint rate-limits repeat attempts", async () => {
  let response;
  for (let attempt = 0; attempt <= 10; attempt += 1) {
    response = await authenticate("wrong", { "CF-Connecting-IP": "192.0.2.12" });
    await response.text();
    if (response.status === 429) break;
  }
  assert.equal(response.status, 429);
  assert.equal(response.headers.get("Retry-After"), "60");
});
