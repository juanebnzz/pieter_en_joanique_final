import type { APIRoute } from 'astro';
import { clearAdminSession } from '../../lib/admin-auth';

export const prerender = false;

export const POST: APIRoute = ({ cookies, redirect }) => {
  clearAdminSession(cookies);
  return redirect('/', 302);
};
