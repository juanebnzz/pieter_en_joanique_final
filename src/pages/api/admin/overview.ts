import type { APIRoute } from 'astro';
import { supabaseAdmin } from '../../../lib/supabase';
import { error, json } from '../../../lib/http';

export const prerender = false;

/** Everything the dashboard needs in one round trip. */
export const GET: APIRoute = async () => {
  let db: ReturnType<typeof supabaseAdmin>;
  try {
    db = supabaseAdmin();
  } catch (e) {
    return error(e instanceof Error ? e.message : "Supabase not configured", 500);
  }

  const [households, guests, payments] = await Promise.all([
    db.from('household_overview').select('*').order('created_at', { ascending: false }),
    db.from('guests').select('*').order('created_at'),
    db.from('payments').select('*').order('paid_at', { ascending: false }),
  ]);

  if (households.error || guests.error || payments.error) {
    return error('Failed to load data', 500);
  }

  const guestsByHousehold = new Map<string, typeof guests.data>();
  for (const g of guests.data) {
    const list = guestsByHousehold.get(g.household_id) ?? [];
    list.push(g);
    guestsByHousehold.set(g.household_id, list);
  }
  const paymentsByHousehold = new Map<string, typeof payments.data>();
  for (const p of payments.data) {
    const list = paymentsByHousehold.get(p.household_id) ?? [];
    list.push(p);
    paymentsByHousehold.set(p.household_id, list);
  }

  const rows = households.data.map((h) => ({
    ...h,
    guests: guestsByHousehold.get(h.id!) ?? [],
    payments: paymentsByHousehold.get(h.id!) ?? [],
  }));

  const summary = {
    households: rows.length,
    attending: rows.filter((h) => h.rsvp_status === 'attending').length,
    declined: rows.filter((h) => h.rsvp_status === 'declined').length,
    pending: rows.filter((h) => h.rsvp_status === 'pending').length,
    guests_attending: rows.reduce((n, h) => n + (h.rsvp_status === "attending" ? (h.attending_count ?? 0) + (h.children_count ?? 0) : 0), 0),
    children_attending: rows.reduce((n, h) => n + (h.rsvp_status === "attending" ? (h.children_count ?? 0) : 0), 0),
    friday_households: rows.filter((h) => h.rsvp_status === "attending" && h.stay === "friday_saturday").length,
    saturday_households: rows.filter((h) => h.rsvp_status === "attending" && h.stay === "saturday").length,
    due_cents: rows.reduce((n, h) => n + (h.amount_due_cents ?? 0), 0),
    paid_cents: rows.reduce((n, h) => n + (h.paid_cents ?? 0), 0),
    outstanding_cents: rows.reduce((n, h) => n + (h.outstanding_cents ?? 0), 0),
    paid: rows.filter((h) => h.payment_status === 'paid').length,
    partial: rows.filter((h) => h.payment_status === 'partial').length,
    unpaid: rows.filter((h) => h.payment_status === 'unpaid' && (h.amount_due_cents ?? 0) > 0).length,
  };

  return json({ summary, households: rows, generated_at: new Date().toISOString() });
};
