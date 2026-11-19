interface CloudflareEnv {
  ASSETS: import("@cloudflare/workers-types").Fetcher;
  MEDIA: import("@cloudflare/workers-types").R2Bucket;
  UNLOCK_LIMITER: import("@cloudflare/workers-types").RateLimit;
  SITE_PASSPHRASE?: string;
  SESSION_SECRET?: string;
}
