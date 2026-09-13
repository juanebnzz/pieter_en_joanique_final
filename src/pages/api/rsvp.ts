import type { APIRoute } from 'astro';
import { z } from 'zod';
import { rsvpSchema } from '../../lib/rsvp-schema';
import { supabaseAdmin } from '../../lib/supabase';
import { error, json, readJson } from '../../lib/http';

export const prerender = false;

/**
 * Public RSVP endpoint.
 *
 * Matching order: invite_code → email → create a new household.
 * Guests for the household are replaced with what was submitted, so a guest
 * can re-submit to correct their answer. Every submission is also logged raw
 * to rsvp_submissions for auditing.
 */
export const POST: APIRoute = async ({ request, clientAddress }) => {
  const body = await readJson(request);
  const parsed = rsvpSchema.safeParse(body);
  if (!parsed.success) {
    return error('Invalid submission', 400, { issues: z.flattenError(parsed.error).fieldErrors });
  }
  const input = parsed.data;

  // Honeypot tripped — pretend it worked.
  if (input.website) return json({ ok: true });

  if (input.attending && input.guests.length === 0) {
    return error('Please add at least one guest', 400, {
      issues: { guests: ['Please add at least one guest'] },
    });
  }

  const db = supabaseAdmin();
  const email = input.email.toLowerCase();
  const inviteCode = input.invite_code?.trim().toUpperCase() || null;

  // 1. Find an existing household
  let householdId: string | null = null;
  if (inviteCode) {
    const { data } = await db.from('households').select('id').eq('invite_code', inviteCode).maybeSingle();
    householdId = data?.id ?? null;
  }
  if (!householdId) {
    const { data } = await db.from('households').select('id').ilike('email', email).maybeSingle();
    householdId = data?.id ?? null;
  }

  const rsvpFields = {
    name: input.household_name,
    email,
    phone: input.phone || null,
    rsvp_status: input.attending ? ('attending' as const) : ('declined' as const),
    responded_at: new Date().toISOString(),
    message: input.message || null,
  };

  // 2. Upsert the household
  if (householdId) {
    const { error: upErr } = await db.from('households').update(rsvpFields).eq('id', householdId);
    if (upErr) return error('Could not save your RSVP', 500);
  } else {
    const { data, error: insErr } = await db
      .from('households')
      .insert({ ...rsvpFields, max_guests: Math.max(1, input.guests.length) })
      .select('id')
      .single();
    if (insErr || !data) return error('Could not save your RSVP', 500);
    householdId = data.id;
  }

  // 3. Replace guests
  const { error: delErr } = await db.from('guests').delete().eq('household_id', householdId);
  if (delErr) return error('Could not save your guests', 500);

  if (input.guests.length > 0) {
    const { error: gErr } = await db.from('guests').insert(
      input.guests.map((g) => ({
        household_id: householdId!,
        full_name: g.full_name,
        is_child: g.is_child,
        attending: input.attending,
        dietary: g.dietary || null,
      })),
    );
    if (gErr) return error('Could not save your guests', 500);
  }

  // 4. Audit log (best effort)
  await db.from('rsvp_submissions').insert({
    household_id: householdId,
    payload: input,
    ip: clientAddress ?? null,
    user_agent: request.headers.get('user-agent'),
  });

  return json({ ok: true, attending: input.attending });
};
