export const privateHeaders = {
  "Cache-Control": "private, no-store",
  "Referrer-Policy": "same-origin",
  "X-Content-Type-Options": "nosniff",
  "X-Robots-Tag": "noindex, nofollow, noarchive",
};

const contentSecurityPolicy = [
  "default-src 'self'",
  "base-uri 'none'",
  "frame-ancestors 'none'",
  "form-action 'self'",
  "object-src 'none'",
].join("; ");

export function htmlResponse(body: string, status = 200, extra?: HeadersInit): Response {
  const headers = new Headers(extra);
  for (const [name, value] of Object.entries(privateHeaders)) headers.set(name, value);
  headers.set("Content-Type", "text/html; charset=UTF-8");
  headers.set("Content-Security-Policy", contentSecurityPolicy);
  return new Response(body, { headers, status });
}

export function textResponse(body: string, status: number, extra?: HeadersInit): Response {
  const headers = new Headers(extra);
  for (const [name, value] of Object.entries(privateHeaders)) headers.set(name, value);
  headers.set("Content-Type", "text/plain; charset=UTF-8");
  return new Response(body, { headers, status });
}

export function redirectHome(setCookie: string) {
  return new Response(null, {
    status: 303,
    headers: { ...privateHeaders, Location: "/", "Set-Cookie": setCookie },
  });
}
