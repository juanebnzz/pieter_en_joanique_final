import { defineMiddleware } from 'astro:middleware';
import { isAdminSession } from './lib/admin-auth';

/**
 * Guards everything under /admin and /api/admin behind the admin cookie.
 * /admin/enter/<token> is the only unauthenticated admin route.
 * Unauthenticated page hits get a 404 (don't advertise that /admin exists);
 * API hits get a 401 so the dashboard can show a "session expired" message.
 */
export const onRequest = defineMiddleware((context, next) => {
  const { pathname } = context.url;

  const isAdminPage = pathname === '/admin' || pathname.startsWith('/admin/');
  const isAdminApi = pathname.startsWith('/api/admin/');
  const isEnter = pathname.startsWith('/admin/enter/');
  const isPublicAsset = pathname === '/admin/manifest.webmanifest' || pathname === '/admin/sw.js';

  if ((isAdminPage || isAdminApi) && !isEnter && !isPublicAsset) {
    if (!isAdminSession(context.cookies)) {
      if (isAdminApi) {
        return new Response(JSON.stringify({ error: 'unauthorized' }), {
          status: 401,
          headers: { 'content-type': 'application/json' },
        });
      }
      return new Response('Not found', { status: 404 });
    }
    context.locals.isAdmin = true;
  }

  return next();
});
