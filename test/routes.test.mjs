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
let routes;
let session;

function request(path, options = {}) {
  const method = options.method ?? "GET";
  const handler = {
    "/unlock": routes.unlock,
    "/lock": routes.lock,
    "/movie.mp4": method === "HEAD" ? routes.movieHead : routes.movie,
    "/weather": routes.weather,
    "/session": routes.session,
  }[path];
  return handler(new Request(origin + path, options));
}

function authenticate(passphrase, extraHeaders) {
  return request("/unlock", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      ...extraHeaders,
    },
    body: new URLSearchParams({ passphrase }).toString(),
  });
}

before(async () => {
  // Run the actual App Router handlers against isolated Cloudflare bindings.
  const { outputFiles } = await build({
    stdin: {
      contents: `
        export { POST as unlock } from "./src/app/unlock/route";
        export { POST as lock } from "./src/app/lock/route";
        export { GET as movie, HEAD as movieHead } from "./src/app/movie.mp4/route";
        export { GET as weather } from "./src/app/weather/route";
        export { GET as session } from "./src/app/session/route";
        export { forwardToCloudflare } from "./src/backend";
        export { hasSession } from "./src/auth";
      `,
      resolveDir: process.cwd(),
    },
    write: false,
    bundle: true,
    platform: "node",
    format: "esm",
    plugins: [
      {
        name: "cloudflare-test-context",
        setup(build) {
          build.onResolve({ filter: /^@opennextjs\/cloudflare$/ }, () => ({
            path: "context",
            namespace: "fixture",
          }));
          build.onLoad({ filter: /.*/, namespace: "fixture" }, () => ({
            contents:
              "export const getCloudflareContext = async () => globalThis.scrapbookTestContext;",
          }));
        },
      },
    ],
  });
  runtime = new Miniflare(
    convertV4MiniflareOptions({
      modules: true,
      script:
        "export default { fetch() { return new Response('test bindings'); } };",
      compatibilityDate: "2026-01-01",
      bindings: secrets,
      r2Buckets: ["MEDIA"],
      ratelimits: {
        UNLOCK_LIMITER: {
          namespace_id: "1",
          simple: { limit: 10, period: 60 },
        },
      },
    }),
  );
  globalThis.scrapbookTestContext = { env: await runtime.getBindings() };
  const storage = await runtime.getR2Bucket("MEDIA");
  await storage.put("forrest-gump.mp4", fixture);
  routes = await import(
    `data:text/javascript;base64,${Buffer.from(outputFiles[0].text).toString("base64")}`
  );
  session = await authenticate(secrets.SITE_PASSPHRASE);
});

after(async () => {
  delete globalThis.scrapbookTestContext;
  await runtime?.dispose();
});

test("movie and weather routes require a session", async () => {
  for (const method of ["GET", "HEAD"]) {
    const movie = await request("/movie.mp4", {
      method,
      headers: { Range: "bytes=0-1" },
    });
    assert.equal(movie.status, 401);
    assert.equal(await movie.text(), "");
    assert.equal(movie.headers.get("Cache-Control"), "private, no-store");
  }
  assert.equal((await request("/weather")).status, 401);
  assert.equal((await request("/session")).status, 401);
});

test("unlock creates a compatible 30-day session and Lock clears it", async () => {
  assert.equal(session.status, 303);
  assert.equal(session.headers.get("Location"), "/");
  const cookie = session.headers.get("Set-Cookie");
  assert.match(cookie, /Max-Age=2592000; Secure; HttpOnly; SameSite=Lax/);
  assert.equal(
    (await request("/session", { headers: { Cookie: cookie.split(";")[0] } }))
      .status,
    204,
  );
  assert.equal(
    await routes.hasSession(
      new Request(origin, { headers: { Cookie: cookie.split(";")[0] } }),
      secrets,
    ),
    true,
  );

  const lock = await request("/lock", { method: "POST" });
  assert.equal(lock.status, 303);
  assert.match(
    lock.headers.get("Set-Cookie"),
    /^__Host-sandyfave=; .*Max-Age=0/,
  );
  assert.equal(
    (
      await authenticate(secrets.SITE_PASSPHRASE, {
        Origin: "https://other.test",
      })
    ).status,
    403,
  );
});

test("wrong passphrases, expired sessions, and modified sessions are rejected", async () => {
  const wrong = await authenticate("wrong");
  assert.equal(wrong.status, 303);
  assert.equal(
    new URL(wrong.headers.get("Location")).searchParams.get("unlock"),
    "invalid",
  );
  assert.equal(wrong.headers.get("Set-Cookie"), null);

  const time = Math.floor(Date.now() / 1000) - 1;
  const material = JSON.stringify([
    secrets.SESSION_SECRET,
    secrets.SITE_PASSPHRASE,
  ]);
  const signature = createHmac("sha256", material)
    .update(`sandyfave/v1/${time}`)
    .digest("base64url");
  const expired = `__Host-sandyfave=${time}.${signature}`;
  const valid = session.headers.get("Set-Cookie").split(";")[0];
  const modified = valid.replace(/\.(.)/, (_, first) =>
    first === "a" ? ".b" : ".a",
  );

  for (const Cookie of [expired, modified]) {
    assert.equal(
      await routes.hasSession(
        new Request(origin, { headers: { Cookie } }),
        secrets,
      ),
      false,
    );
    assert.equal(
      (await request("/movie.mp4", { headers: { Cookie } })).status,
      401,
    );
  }
});

test("MP4 route streams bounded, suffix, unsatisfiable, and full responses", async () => {
  const Cookie = session.headers.get("Set-Cookie").split(";")[0];
  const head = await request("/movie.mp4", {
    method: "HEAD",
    headers: { Cookie },
  });
  assert.equal(head.status, 200);
  assert.equal(head.headers.get("Content-Length"), "16");
  assert.equal(head.headers.get("Accept-Ranges"), "bytes");

  for (const [Range, start, end] of [
    ["bytes=0-1", 0, 1],
    ["bytes=3-5", 3, 5],
    ["bytes=-4", 12, 15],
    ["bytes=15-", 15, 15],
  ]) {
    const res = await request("/movie.mp4", { headers: { Cookie, Range } });
    assert.equal(res.status, 206);
    assert.equal(res.headers.get("Content-Range"), `bytes ${start}-${end}/16`);
    assert.equal(res.headers.get("Content-Length"), String(end - start + 1));
    assert.deepEqual(
      new Uint8Array(await res.arrayBuffer()),
      fixture.slice(start, end + 1),
    );
  }
  const unsatisfiable = await request("/movie.mp4", {
    headers: { Cookie, Range: "bytes=16-" },
  });
  assert.equal(unsatisfiable.status, 416);
  assert.equal(unsatisfiable.headers.get("Content-Range"), "bytes */16");
  const complete = await request("/movie.mp4", {
    headers: { Cookie, Range: "bytes=0-1", "If-Range": '"old-etag"' },
  });
  assert.equal(complete.status, 200);
  assert.deepEqual(new Uint8Array(await complete.arrayBuffer()), fixture);
});

test("repeated unlock attempts are limited", async () => {
  let response;
  for (let attempt = 0; attempt <= 10; attempt += 1) {
    response = await authenticate("wrong", {
      "CF-Connecting-IP": "192.0.2.12",
    });
    if (response.headers.get("Retry-After")) break;
  }
  assert.equal(response.headers.get("Retry-After"), "60");
  assert.equal(
    new URL(response.headers.get("Location")).searchParams.get("unlock"),
    "limited",
  );
});

test("Vercel forwards the scrapbook cookie and byte ranges and keeps redirects on its own site", async () => {
  const originalFetch = globalThis.fetch;
  const originalPlatform = process.env.VERCEL;
  const originalBackend = process.env.CLOUDFLARE_BACKEND_URL;
  process.env.VERCEL = "1";
  process.env.CLOUDFLARE_BACKEND_URL = "https://cloudflare.test";
  try {
    globalThis.fetch = async (url, options) => {
      assert.equal(url.href, "https://cloudflare.test/movie.mp4");
      assert.equal(
        options.headers.get("Cookie"),
        "__Host-sandyfave=test-session",
      );
      assert.equal(options.headers.get("Range"), "bytes=3-5");
      return new Response(fixture.slice(3, 6), {
        status: 206,
        headers: { "Content-Range": "bytes 3-5/16" },
      });
    };
    const movie = await request("/movie.mp4", {
      headers: {
        Cookie: "other=private; __Host-sandyfave=test-session",
        Range: "bytes=3-5",
      },
    });
    assert.equal(movie.status, 206);
    assert.deepEqual(
      new Uint8Array(await movie.arrayBuffer()),
      fixture.slice(3, 6),
    );

    globalThis.fetch = async (url, options) => {
      assert.equal(url.href, "https://cloudflare.test/unlock");
      assert.equal(options.headers.get("Origin"), "https://cloudflare.test");
      assert.equal(await new Response(options.body).text(), "passphrase=test");
      return new Response(null, {
        status: 303,
        headers: { Location: "https://cloudflare.test/?unlock=invalid" },
      });
    };
    const unlock = await authenticate("test", { Origin: origin });
    assert.equal(unlock.status, 303);
    assert.equal(unlock.headers.get("Location"), "/?unlock=invalid");
    assert.equal(
      (await authenticate("test", { Origin: "https://other.test" })).status,
      403,
    );
  } finally {
    globalThis.fetch = originalFetch;
    if (originalPlatform === undefined) delete process.env.VERCEL;
    else process.env.VERCEL = originalPlatform;
    if (originalBackend === undefined)
      delete process.env.CLOUDFLARE_BACKEND_URL;
    else process.env.CLOUDFLARE_BACKEND_URL = originalBackend;
  }
});
