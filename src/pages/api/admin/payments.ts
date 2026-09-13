import type { APIRoute } from 'astro';
import { z } from 'zod';
import { supabaseAdmin } from '../../../lib/supabase';
import { error, json, readJson } from '../../../lib/http';

export const prerender = false;

const createSchema = z.object({
  household_id: z.uuid(),
  amount_cents: z.number().int().positive(),
  method: z.string().trim().max(40).optional().or(z.literal('')),
  reference: z.string().trim().max(120).optional().or(z.literal('')),
  paid_at: z.iso.datetime().optional(),
  notes: z.string().trim().max(1000).optional().or(z.literal('')),
});

/** Record money received. households.payment_status updates via trigger. */
export const POST: APIRoute = async ({ request }) => {
  const parsed = createSchema.safeParse(await readJson(request));
  if (!parsed.success) return error('Invalid payment', 400, { issues: z.flattenError(parsed.error).fieldErrors });
  const d = parsed.data;

  const { data, error: err } = await supabaseAdmin()
    .from('payments')
    .insert({
      household_id: d.household_id,
      amount_cents: d.amount_cents,
      method: d.method || null,
      reference: d.reference || null,
      paid_at: d.paid_at ?? new Date().toISOString(),
      notes: d.notes || null,
    })
    .select('*')
    .single();

  if (err) return error('Could not record payment', 400);
  return json(data, { status: 201 });
};

const deleteSchema = z.object({ id: z.uuid() });

export const DELETE: APIRoute = async ({ request }) => {
  const parsed = deleteSchema.safeParse(await readJson(request));
  if (!parsed.success) return error('Invalid payment id', 400);
  const { error: err } = await supabaseAdmin().from('payments').delete().eq('id', parsed.data.id);
  if (err) return error('Delete failed', 400);
  return json({ ok: true });
};
