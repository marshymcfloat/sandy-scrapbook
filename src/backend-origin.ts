export function cloudflareBackendOrigin() {
  if (process.env.VERCEL !== "1" || !process.env.CLOUDFLARE_BACKEND_URL) return null;
  try {
    const url = new URL(process.env.CLOUDFLARE_BACKEND_URL);
    return url.protocol === "https:" && !url.username && !url.password ? url.origin : null;
  } catch {
    return null;
  }
}
