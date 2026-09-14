import type { APIRoute } from 'astro';
import { z } from 'zod';
import { supabaseAdmin } from '../../../lib/supabase';
import { error, json, readJson } from '../../../lib/http';

export const prerender = false;

const createSchema = z
  .object({
    name: z.string().trim().min(1).max(120),
    email: z.email().trim().max(200).optional().or(z.literal('')),
    phone: z.string().trim().max(40).optional().or(z.literal('')),
    invite_code: z.string().trim().max(40).optional().or(z.literal('')),
    max_guests: z.number().int().min(1).max(20).default(2),
    amount_due_cents: z.number().int().min(0).default(0),
    conservation_fee_cents: z.number().int().min(0).default(0),
    notes: z.string().trim().max(2000).optional().or(z.literal('')),
  })
  .refine((d) => d.conservation_fee_cents <= d.amount_due_cents, {
    message: 'The conservation fee is part of the amount due, so it cannot be more than it',
    path: ['conservation_fee_cents'],
  });

/** Admin pre-loads a household (invite list) before guests RSVP. */
export const POST: APIRoute = async ({ request }) => {
  const parsed = createSchema.safeParse(await readJson(request));
  if (!parsed.success) return error('Invalid household', 400, { issues: z.flattenError(parsed.error).fieldErrors });
  const d = parsed.data;

  const { data, error: err } = await supabaseAdmin()
    .from('households')
    .insert({
      name: d.name,
      email: d.email ? d.email.toLowerCase() : null,
      phone: d.phone || null,
      invite_code: d.invite_code ? d.invite_code.toUpperCase() : null,
      max_guests: d.max_guests,
      amount_due_cents: d.amount_due_cents,
      conservation_fee_cents: d.conservation_fee_cents,
      notes: d.notes || null,
    })
    .select('*')
    .single();

  if (err) return error(err.code === '23505' ? 'That invite code is already in use' : 'Could not create household', 400);
  return json(data, { status: 201 });
};
