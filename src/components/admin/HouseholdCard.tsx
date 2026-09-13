import { useState, type FormEvent } from 'react';
import { api, rands, RSVP_LABEL, STAY_LABEL, type HouseholdRow } from './api';
import type { RsvpStatus } from '../../lib/supabase';

// Status is carried by the label text; chips are hairline-ruled, never filled.
// Anything needing attention (no reply, owing) is ruled in accent.
const badge: Record<string, string> = {
  attending: 'border border-rule text-ink',
  declined: 'border border-rule text-ink',
  pending: 'border border-accent text-accent',
  paid: 'border border-rule text-ink',
  partial: 'border border-accent text-accent',
  unpaid: 'border border-accent text-accent',
};
const input = 'min-h-[40px] w-full border border-ink bg-surface px-3 py-2 font-body text-sm text-ink';
const h3 = 'eyebrow mb-2 text-[0.68rem]';

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
    const stay = f.get('stay');
    await run(() =>
      api.updateHousehold(h.id, {
        name: f.get('name'),
        email: f.get('email') || null,
        phone: f.get('phone') || null,
        invite_code: f.get('invite_code') || null,
        max_guests: Number(f.get('max_guests') || 1),
        rsvp_status: f.get('rsvp_status') as RsvpStatus,
        stay: stay ? stay : null,
        children_count: Number(f.get('children_count') || 0),
        dietary: f.get('dietary') || null,
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
  const headcount = (h.attending_count ?? 0) + (h.children_count ?? 0);

  return (
    <div className="border border-rule bg-surface">
      <button onClick={() => setOpen((v) => !v)} className="flex w-full items-start justify-between gap-3 p-4 text-left" aria-expanded={open}>
        <div className="min-w-0">
          <p className="truncate font-display text-lg font-medium text-ink">{h.name}</p>
          <p className="truncate font-body text-sm text-ink">
            {h.guests.length > 0 ? h.guests.map((g) => g.full_name).join(', ') : (h.email ?? '—')}
            {(h.children_count ?? 0) > 0 && ` + ${h.children_count} child${h.children_count === 1 ? '' : 'ren'}`}
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1 font-body text-xs">
          <span className={`px-2 py-0.5 ${badge[h.rsvp_status!]}`}>
            {RSVP_LABEL[h.rsvp_status!]}
            {h.rsvp_status === 'attending' && ` · ${headcount}${h.stay ? ` · ${STAY_LABEL[h.stay]}` : ''}`}
          </span>
          {payStatus && (
            <span className={`px-2 py-0.5 ${badge[payStatus]}`}>
              {payStatus === 'paid' ? 'Paid' : `${rands(h.paid_cents)} / ${rands(h.amount_due_cents)}`}
            </span>
          )}
        </div>
      </button>

      {open && (
        <div className="space-y-5 border-t border-rule p-4">
          {h.guests.length > 0 && (
            <div>
              <h3 className={h3}>Guests</h3>
              <ul className="font-body text-sm">
                {h.guests.map((g) => (
                  <li key={g.id} className="py-0.5">
                    {g.full_name}
                    {g.attending === false && <span className="ml-1 text-xs text-ink">(not attending)</span>}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {h.dietary && (
            <div>
              <h3 className={h3}>Dietary</h3>
              <p className="font-body text-sm">{h.dietary}</p>
            </div>
          )}

          {h.message && (
            <div>
              <h3 className={h3}>Message</h3>
              <p className="font-display text-base italic">“{h.message}”</p>
            </div>
          )}

          <form onSubmit={saveDetails} className="grid gap-2 sm:grid-cols-3">
            <h3 className={`${h3} sm:col-span-3`}>Details</h3>
            <input name="name" defaultValue={h.name ?? ''} className={`${input} sm:col-span-3`} />
            <input name="email" defaultValue={h.email ?? ''} placeholder="Email" className={input} />
            <input name="phone" defaultValue={h.phone ?? ''} placeholder="Phone" className={input} />
            <input name="invite_code" defaultValue={h.invite_code ?? ''} placeholder="Invite code" className={input} />
            <select name="rsvp_status" defaultValue={h.rsvp_status!} className={input}>
              <option value="pending">No reply yet</option>
              <option value="attending">Attending</option>
              <option value="declined">Declined</option>
            </select>
            <select name="stay" defaultValue={h.stay ?? ''} className={input}>
              <option value="">Nights — not set</option>
              <option value="friday_saturday">Friday + Saturday</option>
              <option value="saturday">Saturday only</option>
            </select>
            <label className="flex items-center gap-2 font-body text-sm text-ink">
              Children
              <input name="children_count" type="number" min={0} defaultValue={h.children_count ?? 0} className={input} />
            </label>
            <input name="max_guests" type="number" min={1} defaultValue={h.max_guests ?? 2} placeholder="Max guests" className={input} />
            <label className="flex items-center gap-2 font-body text-sm text-ink sm:col-span-2">
              Due (R)
              <input name="amount_due" type="number" min={0} step="0.01" defaultValue={((h.amount_due_cents ?? 0) / 100).toFixed(2)} className={input} />
            </label>
            <textarea name="dietary" defaultValue={h.dietary ?? ''} placeholder="Dietary requirements" rows={2} className={`${input} sm:col-span-3`} />
            <textarea name="notes" defaultValue={h.notes ?? ''} placeholder="Private notes" rows={2} className={`${input} sm:col-span-3`} />
            <div className="sm:col-span-3">
              <button disabled={busy} className="min-h-[40px] bg-ink px-4 py-2 font-body text-sm text-surface disabled:opacity-50">Save</button>
            </div>
          </form>

          <div>
            <h3 className={h3}>
              Payments · {rands(h.paid_cents)} received{owes && ` · ${rands(h.outstanding_cents)} outstanding`}
            </h3>
            {h.payments.length > 0 && (
              <ul className="mb-2 divide-y divide-rule font-body text-sm">
                {h.payments.map((p) => (
                  <li key={p.id} className="flex items-center justify-between gap-2 py-1">
                    <span>
                      {rands(p.amount_cents)} · {new Date(p.paid_at).toLocaleDateString('en-ZA')}
                      {p.method && <span className="text-ink"> · {p.method}</span>}
                      {p.reference && <span className="text-ink"> · {p.reference}</span>}
                    </span>
                    <button disabled={busy} onClick={() => confirm('Remove this payment?') && run(() => api.deletePayment(p.id))} className="text-xs text-accent">
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <form onSubmit={addPayment} className="grid gap-2 sm:grid-cols-4">
              <input name="amount" type="number" min={0.01} step="0.01" required placeholder="Amount (R)" className={input} />
              <input name="method" placeholder="EFT / cash" className={input} />
              <input name="reference" placeholder="Reference" className={input} />
              <div className="flex flex-wrap gap-2">
                <button disabled={busy} className="min-h-[40px] border border-ink px-3 py-2 font-body text-sm text-ink">Record</button>
                {owes && (h.outstanding_cents ?? 0) > 0 && (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => run(() => api.addPayment({ household_id: h.id, amount_cents: h.outstanding_cents, method: 'marked paid' }))}
                    className="min-h-[40px] border border-rule px-3 py-2 font-body text-sm text-ink"
                  >
                    Mark paid in full
                  </button>
                )}
              </div>
            </form>
          </div>

          {err && <p className="font-body text-sm text-accent">{err}</p>}

          <div className="flex justify-end">
            <button
              disabled={busy}
              onClick={() => confirm(`Delete "${h.name}" and all their guests and payments?`) && run(() => api.deleteHousehold(h.id))}
              className="font-body text-xs text-accent"
            >
              Delete household
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
