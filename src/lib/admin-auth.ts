import { createHmac, timingSafeEqual } from 'node:crypto';
import type { AstroCookies } from 'astro';
import { ADMIN_SECRET } from 'astro:env/server';

/**
 * Secret-link auth for the admin dashboard.
 *
 * Flow: the couple opens /admin/enter/<ADMIN_SECRET> once. That sets a signed,
 * httpOnly cookie and redirects to /admin. From then on /admin works without
 * the token in the URL — which is also what lets the PWA install with a clean
 * start_url. The cookie holds an HMAC of the secret, never the secret itself.
 */
export const ADMIN_COOKIE = 'pj_admin';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 year

function sessionValue(): string {
  return createHmac('sha256', ADMIN_SECRET).update('admin-session-v1').digest('hex');
}

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}

export function isValidAdminToken(token: string | undefined): boolean {
  return !!token && safeEqual(token, ADMIN_SECRET);
}

export function isAdminSession(cookies: AstroCookies): boolean {
  const v = cookies.get(ADMIN_COOKIE)?.value;
  return !!v && safeEqual(v, sessionValue());
}

export function setAdminSession(cookies: AstroCookies, secure: boolean): void {
  cookies.set(ADMIN_COOKIE, sessionValue(), {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    secure,
    maxAge: COOKIE_MAX_AGE,
  });
}

export function clearAdminSession(cookies: AstroCookies): void {
  cookies.delete(ADMIN_COOKIE, { path: '/' });
}
