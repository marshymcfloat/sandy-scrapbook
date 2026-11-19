import { timingSafeEqual } from "node:crypto";

export interface Secrets {
  SITE_PASSPHRASE: string;
  SESSION_SECRET: string;
}

const COOKIE_NAME = "__Host-sandyfave";
const SESSION_SECONDS = 30 * 24 * 60 * 60;
const FORM_BYTES = 2048;
const encoder = new TextEncoder();

export function hasSecrets(env: Partial<Secrets>): env is Secrets {
  return Boolean(env.SITE_PASSPHRASE?.trim() && env.SESSION_SECRET && env.SESSION_SECRET.length >= 32);
}

export async function suppliedPassphrase(request: Request): Promise<string | null> {
  const contentType = request.headers.get("Content-Type")?.split(";", 1)[0].trim();
  if (contentType !== "application/x-www-form-urlencoded" || !request.body) return null;

  const reader = request.body.getReader();
  const buffer = new Uint8Array(FORM_BYTES);
  let offset = 0;

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    if (offset + value.byteLength > FORM_BYTES) {
      await reader.cancel();
      return null;
    }
    buffer.set(value, offset);
    offset += value.byteLength;
  }

  const form = new URLSearchParams(new TextDecoder().decode(buffer.subarray(0, offset)));
  return form.get("passphrase")?.trim() || null;
}

export async function matchesPassphrase(candidate: string, expected: string): Promise<boolean> {
  const [enteredHash, expectedHash] = await Promise.all([
    crypto.subtle.digest("SHA-256", encoder.encode(candidate)),
    crypto.subtle.digest("SHA-256", encoder.encode(expected.trim())),
  ]);
  return timingSafeEqual(new Uint8Array(enteredHash), new Uint8Array(expectedHash));
}

function signingKey(secrets: Secrets) {
  const material = encoder.encode(JSON.stringify([secrets.SESSION_SECRET, secrets.SITE_PASSPHRASE]));
  return crypto.subtle.importKey("raw", material, { name: "HMAC", hash: "SHA-256" }, false, [
    "sign",
    "verify",
  ]);
}

function sessionMessage(expires: number) {
  return encoder.encode(`sandyfave/v1/${expires}`);
}

function cookie(value: string, maxAge: number): string {
  return `${COOKIE_NAME}=${value}; Path=/; Max-Age=${maxAge}; Secure; HttpOnly; SameSite=Lax`;
}

export const clearSession = () => cookie("", 0);

export async function createSession(secrets: Secrets): Promise<string> {
  const expires = Math.floor(Date.now() / 1000) + SESSION_SECONDS;
  const signature = await crypto.subtle.sign("HMAC", await signingKey(secrets), sessionMessage(expires));
  const token = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replaceAll("=", "");
  return cookie(`${expires}.${token}`, SESSION_SECONDS);
}

export async function hasSession(request: Request, secrets: Partial<Secrets>): Promise<boolean> {
  if (!hasSecrets(secrets)) return false;

  const entry = request.headers.get("Cookie")?.split(/;\s*/).find((part) => part.startsWith(`${COOKIE_NAME}=`));
  const parts = entry?.slice(COOKIE_NAME.length + 1).match(/^(\d{10,11})\.([A-Za-z0-9_-]{43})$/);
  if (!parts) return false;

  const expires = Number(parts[1]);
  if (expires <= Math.floor(Date.now() / 1000)) return false;

  const signature = Uint8Array.from(atob(parts[2].replaceAll("-", "+").replaceAll("_", "/")), (character) =>
    character.charCodeAt(0),
  );
  return crypto.subtle.verify("HMAC", await signingKey(secrets), signature, sessionMessage(expires));
}
