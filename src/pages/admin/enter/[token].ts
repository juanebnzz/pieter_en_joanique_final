import type { APIRoute } from 'astro';
import { isValidAdminToken, setAdminSession } from '../../../lib/admin-auth';

export const prerender = false;

/** The couple's secret link. Valid token → cookie → /admin. Anything else → 404. */
export const GET: APIRoute = ({ params, cookies, redirect, url }) => {
  if (!isValidAdminToken(params.token)) {
    return new Response('Not found', { status: 404 });
  }
  setAdminSession(cookies, url.protocol === 'https:');
  return redirect('/admin', 302);
};
