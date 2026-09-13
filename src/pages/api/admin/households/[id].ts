import type { APIRoute } from 'astro';
import { z } from 'zod';
import { supabaseAdmin } from '../../../../lib/supabase';
import { error, json, readJson } from '../../../../lib/http';

export const prerender = false;

const patchSchema = z
  .object({
    name: z.string().trim().min(1).max(120),
    email: z.email().trim().max(200).nullable(),
    phone: z.string().trim().max(40).nullable(),
    invite_code: z.string().trim().max(40).nullable(),
    max_guests: z.number().int().min(1).max(20),
    rsvp_status: z.enum(['pending', 'attending', 'declined']),
    amount_due_cents: z.number().int().min(0),
    notes: z.string().trim().max(2000).nullable(),
  })
  .partial();

export const PATCH: APIRoute = async ({ params, request }) => {
  const id = params.id!;
  const parsed = patchSchema.safeParse(await readJson(request));
  if (!parsed.success) return error('Invalid update', 400, { issues: z.flattenError(parsed.error).fieldErrors });

  const update = { ...parsed.data };
  if (update.email) update.email = update.email.toLowerCase();
  if (update.invite_code) update.invite_code = update.invite_code.toUpperCase();

  const { data, error: err } = await supabaseAdmin()
    .from('households')
    .update(update)
    .eq('id', id)
    .select('*')
    .single();

  if (err) return error(err.code === '23505' ? 'That invite code is already in use' : 'Update failed', 400);
  return json(data);
};

export const DELETE: APIRoute = async ({ params }) => {
  const { error: err } = await supabaseAdmin().from('households').delete().eq('id', params.id!);
  if (err) return error('Delete failed', 400);
  return json({ ok: true });
};
