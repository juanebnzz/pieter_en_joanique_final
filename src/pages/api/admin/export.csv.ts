import type { APIRoute } from 'astro';
import { supabaseAdmin } from '../../../lib/supabase';

export const prerender = false;

function csvCell(v: unknown): string {
  const s = v == null ? '' : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** One row per guest, with household + payment context. Opens straight in Excel/Numbers. */
export const GET: APIRoute = async () => {
  const db = supabaseAdmin();
  const [{ data: households }, { data: guests }] = await Promise.all([
    db.from('household_overview').select('*').order('name'),
    db.from('guests').select('*').order('full_name'),
  ]);

  const header = [
    'Household', 'Invite code', 'Email', 'Phone', 'RSVP', 'Responded at', 'Nights', 'Children', 'Household dietary',
    'Guest', 'Child', 'Attending', 'Dietary',
    'Amount due (R)', 'of which conservation fee (R)', 'Paid (R)', 'Outstanding (R)', 'Conservation fee owing (R)', 'Payment status', 'Message', 'Notes',
  ];
  const rows: string[][] = [header];

  for (const h of households ?? []) {
    const hg = (guests ?? []).filter((g) => g.household_id === h.id);
    const base = [
      h.name, h.invite_code, h.email, h.phone, h.rsvp_status, h.responded_at,
      h.stay === 'friday_saturday' ? 'Fri + Sat' : h.stay === 'saturday' ? 'Sat only' : '', h.children_count, h.dietary,
    ];
    const money = [
      ((h.amount_due_cents ?? 0) / 100).toFixed(2),
      ((h.conservation_fee_cents ?? 0) / 100).toFixed(2),
      ((h.paid_cents ?? 0) / 100).toFixed(2),
      ((h.outstanding_cents ?? 0) / 100).toFixed(2),
      ((h.conservation_fee_outstanding_cents ?? 0) / 100).toFixed(2),
      h.payment_status, h.message, h.notes,
    ];
    if (hg.length === 0) {
      rows.push([...base, '', '', '', '', ...money].map(csvCell));
    } else {
      for (const g of hg) {
        rows.push([
          ...base,
          g.full_name, g.is_child ? 'yes' : '', g.attending == null ? '' : g.attending ? 'yes' : 'no', g.dietary,
          ...money,
        ].map(csvCell));
      }
    }
  }

  const csv = '﻿' + rows.map((r) => r.join(',')).join('\r\n');
  return new Response(csv, {
    headers: {
      'content-type': 'text/csv; charset=utf-8',
      'content-disposition': `attachment; filename="rsvps-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
};
