import { useState, type FormEvent } from 'react';
import { api, rands, RSVP_LABEL, type HouseholdRow } from './api';
import type { RsvpStatus } from '../../lib/supabase';

const badge: Record<string, string> = {
  attending: 'bg-emerald-100 text-emerald-800',
  declined: 'bg-neutral-200 text-neutral-700',
  pending: 'bg-amber-100 text-amber-800',
  paid: 'bg-emerald-100 text-emerald-800',
  partial: 'bg-amber-100 text-amber-800',
  unpaid: 'bg-red-100 text-red-800',
};
const input = 'w-full rounded border border-neutral-300 bg-white px-3 py-2 text-sm';

export default function HouseholdCard({ household: h, onChanged }: { household: HouseholdRow; onChanged: () => void }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function run(fn: () => Promise<unknown>) {
    setBusy(true);
    setErr(null);
    try {
      await fn();
      onChanged();
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Failed');
    } finally {
      setBusy(false);
    }
  }

  async function saveDetails(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    await run(() =>
      api.updateHousehold(h.id, {
        name: f.get('name'),
        email: f.get('email') || null,
        phone: f.get('phone') || null,
        invite_code: f.get('invite_code') || null,
        max_guests: Number(f.get('max_guests') || 1),
        rsvp_status: f.get('rsvp_status') as RsvpStatus,
        amount_due_cents: Math.round(Number(f.get('amount_due') || 0) * 100),
        notes: f.get('notes') || null,
      }),
    );
  }

  async function addPayment(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const f = new FormData(form);
    await run(() =>
      api.addPayment({
        household_id: h.id,
        amount_cents: Math.round(Number(f.get('amount') || 0) * 100),
        method: f.get('method') || '',
        reference: f.get('reference') || '',
      }),
    );
    form.reset();
  }

  const owes = (h.amount_due_cents ?? 0) > 0;
  const payStatus = owes ? h.payment_status! : null;

  return (
    <div className="rounded-lg border border-neutral-200 bg-white">
      <button onClick={() => setOpen((v) => !v)} className="flex w-full items-start justify-between gap-3 p-4 text-left">
        <div className="min-w-0">
          <p className="truncate font-medium">{h.name}</p>
          <p className="truncate text-sm text-neutral-500">
            {h.guests.length > 0 ? h.guests.map((g) => g.full_name).join(', ') : h.email ?? '—'}
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1 text-xs">
          <span className={`rounded px-2 py-0.5 ${badge[h.rsvp_status!]}`}>
            {RSVP_LABEL[h.rsvp_status!]}{h.rsvp_status === 'attending' && ` · ${h.attending_count}`}
          </span>
          {payStatus && (
            <span className={`rounded px-2 py-0.5 ${badge[payStatus]}`}>
              {payStatus === 'paid' ? 'Paid' : `${rands(h.paid_cents)} / ${rands(h.amount_due_cents)}`}
            </span>
          )}
        </div>
      </button>

      {open && (
        <div className="space-y-5 border-t border-neutral-200 p-4">
          {h.guests.length > 0 && (
            <div>
              <h3 className="mb-1 text-xs uppercase tracking-wide text-neutral-500">Guests</h3>
              <ul className="text-sm">
                {h.guests.map((g) => (
                  <li key={g.id} className="flex justify-between gap-2 py-0.5">
                    <span>
                      {g.full_name}
                      {g.is_child && <span className="ml-1 text-xs text-neutral-500">(child)</span>}
                      {g.attending === false && <span className="ml-1 text-xs text-neutral-500">(not attending)</span>}
                    </span>
                    {g.dietary && <span className="text-neutral-500">{g.dietary}</span>}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {h.message && (
            <div>
              <h3 className="mb-1 text-xs uppercase tracking-wide text-neutral-500">Message</h3>
              <p className="text-sm italic">“{h.message}”</p>
            </div>
          )}

          <form onSubmit={saveDetails} className="grid gap-2 sm:grid-cols-3">
            <h3 className="text-xs uppercase tracking-wide text-neutral-500 sm:col-span-3">Details</h3>
            <input name="name" defaultValue={h.name ?? ''} className={`${input} sm:col-span-3`} />
            <input name="email" defaultValue={h.email ?? ''} placeholder="Email" className={input} />
            <input name="phone" defaultValue={h.phone ?? ''} placeholder="Phone" className={input} />
            <input name="invite_code" defaultValue={h.invite_code ?? ''} placeholder="Invite code" className={input} />
            <select name="rsvp_status" defaultValue={h.rsvp_status!} className={input}>
              <option value="pending">No reply yet</option>
              <option value="attending">Attending</option>
              <option value="declined">Declined</option>
            </select>
            <input name="max_guests" type="number" min={1} defaultValue={h.max_guests ?? 2} placeholder="Max guests" className={input} />
            <input name="amount_due" type="number" min={0} step="0.01" defaultValue={((h.amount_due_cents ?? 0) / 100).toFixed(2)} placeholder="Amount due (R)" className={input} />
            <textarea name="notes" defaultValue={h.notes ?? ''} placeholder="Private notes" rows={2} className={`${input} sm:col-span-3`} />
            <div className="sm:col-span-3">
              <button disabled={busy} className="rounded bg-neutral-900 px-4 py-2 text-sm text-white disabled:opacity-50">Save</button>
            </div>
          </form>

          <div>
            <h3 className="mb-1 text-xs uppercase tracking-wide text-neutral-500">
              Payments · {rands(h.paid_cents)} received{owes && ` · ${rands(h.outstanding_cents)} outstanding`}
            </h3>
            {h.payments.length > 0 && (
              <ul className="mb-2 divide-y divide-neutral-100 text-sm">
                {h.payments.map((p) => (
                  <li key={p.id} className="flex items-center justify-between gap-2 py-1">
                    <span>
                      {rands(p.amount_cents)} · {new Date(p.paid_at).toLocaleDateString('en-ZA')}
                      {p.method && <span className="text-neutral-500"> · {p.method}</span>}
                      {p.reference && <span className="text-neutral-500"> · {p.reference}</span>}
                    </span>
                    <button disabled={busy} onClick={() => confirm('Remove this payment?') && run(() => api.deletePayment(p.id))} className="text-xs text-red-600">
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <form onSubmit={addPayment} className="grid gap-2 sm:grid-cols-4">
              <input name="amount" type="number" min={0.01} step="0.01" required placeholder="Amount (R)" className={input} />
              <input name="method" placeholder="EFT / cash / SnapScan" className={input} />
              <input name="reference" placeholder="Reference" className={input} />
              <div className="flex gap-2">
                <button disabled={busy} className="rounded border border-neutral-900 px-3 py-2 text-sm">Record</button>
                {owes && (h.outstanding_cents ?? 0) > 0 && (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => run(() => api.addPayment({ household_id: h.id, amount_cents: h.outstanding_cents, method: 'marked paid' }))}
                    className="rounded border border-neutral-300 px-3 py-2 text-sm"
                  >
                    Mark paid in full
                  </button>
                )}
              </div>
            </form>
          </div>

          {err && <p className="text-sm text-red-600">{err}</p>}

          <div className="flex justify-end">
            <button
              disabled={busy}
              onClick={() => confirm(`Delete "${h.name}" and all their guests and payments?`) && run(() => api.deleteHousehold(h.id))}
              className="text-xs text-red-600"
            >
              Delete household
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
