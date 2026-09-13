import type { APIRoute } from 'astro';
import { z } from 'zod';
import { rsvpSchema } from '../../lib/rsvp-schema';
import { quote } from '../../lib/pricing';
import { supabaseAdmin, type Tables } from '../../lib/supabase';
import { error, json, readJson } from '../../lib/http';

export const prerender = false;

/**
 * Public RSVP endpoint.
 *
 * Matching: email → existing household, otherwise create one. Guests are
 * replaced with what was submitted, so re-submitting corrects an answer.
 * The accommodation total is computed here (never trusted from the client)
 * and stored as amount_due_cents. Every submission is logged raw for audit.
 */
export const POST: APIRoute = async ({ request, clientAddress }) => {
  const body = await readJson(request);
  const parsed = rsvpSchema.safeParse(body);
  if (!parsed.success) {
    return error('Invalid submission', 400, { issues: z.flattenError(parsed.error).fieldErrors });
  }
  const input = parsed.data;

  // Honeypot tripped — pretend it worked.
  if (input.website) return json({ ok: true, attending: input.attending });

  let db: ReturnType<typeof supabaseAdmin>;
  try {
    db = supabaseAdmin();
  } catch (e) {
    return error(e instanceof Error ? e.message : 'Not configured', 500);
  }

  const email = input.email.toLowerCase();

  const { data: existing } = await db.from('households').select('id').ilike('email', email).maybeSingle();
  let householdId: string | null = existing?.id ?? null;

  const common = {
    name: input.household_name,
    email,
    phone: input.phone || null,
    responded_at: new Date().toISOString(),
    message: input.message || null,
  };

  const fields: Tables['households']['Insert'] = input.attending
    ? {
        ...common,
        rsvp_status: 'attending' as const,
        stay: input.stay,
        children_count: input.children,
        dietary: input.dietary || null,
        amount_due_cents: quote({ stay: input.stay, adults: input.guests.length, children: input.children }).totalCents,
        max_guests: Math.max(1, input.guests.length),
      }
    : {
        ...common,
        rsvp_status: 'declined' as const,
        stay: null,
        children_count: 0,
        amount_due_cents: 0,
      };

  if (householdId) {
    const { error: upErr } = await db.from('households').update(fields).eq('id', householdId);
    if (upErr) return error('Could not save your RSVP', 500);
  } else {
    const { data, error: insErr } = await db.from('households').insert(fields).select('id').single();
    if (insErr || !data) return error('Could not save your RSVP', 500);
    householdId = data.id;
  }

  const { error: delErr } = await db.from('guests').delete().eq('household_id', householdId);
  if (delErr) return error('Could not save your guests', 500);

  if (input.attending) {
    const { error: gErr } = await db.from('guests').insert(
      input.guests.map((full_name) => ({
        household_id: householdId!,
        full_name,
        is_child: false,
        attending: true,
      })),
    );
    if (gErr) return error('Could not save your guests', 500);
  }

  await db.from('rsvp_submissions').insert({
    household_id: householdId,
    payload: input,
    ip: clientAddress ?? null,
    user_agent: request.headers.get('user-agent'),
  });

  return json({ ok: true, attending: input.attending });
};
