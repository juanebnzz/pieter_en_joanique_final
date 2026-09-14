import { useState, type FormEvent } from 'react';
import { api } from './api';

const input = 'min-h-[40px] w-full border border-ink bg-surface px-3 py-2 font-body text-sm text-ink';

/** Pre-load a household onto the invite list before they RSVP. */
export default function AddHouseholdForm({ onDone, onCancel }: { onDone: () => void; onCancel: () => void }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setBusy(true);
    setErr(null);
    try {
      await api.createHousehold({
        name: f.get('name'),
        email: f.get('email') || '',
        phone: f.get('phone') || '',
        invite_code: f.get('invite_code') || '',
        max_guests: Number(f.get('max_guests') || 2),
        amount_due_cents: Math.round(Number(f.get('amount_due') || 0) * 100),
        conservation_fee_cents: Math.round(Number(f.get('conservation_fee') || 0) * 100),
        notes: f.get('notes') || '',
      });
      onDone();
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="mb-6 grid gap-3 border border-rule p-4 sm:grid-cols-3">
      <input name="name" required placeholder="Household name *" className={`${input} sm:col-span-3`} />
      <input name="email" type="email" placeholder="Email" className={input} />
      <input name="phone" placeholder="Phone" className={input} />
      <input name="invite_code" placeholder="Invite code" className={input} />
      <input name="max_guests" type="number" min={1} defaultValue={2} placeholder="Max guests" className={input} />
      <input name="amount_due" type="number" min={0} step="0.01" placeholder="Amount due (R)" className={input} />
      <input name="conservation_fee" type="number" min={0} step="0.01" placeholder="of which conservation fee (R)" title="Part of the amount due, not on top of it" className={input} />
      <input name="notes" placeholder="Notes" className={`${input} sm:col-span-3`} />
      {err && <p className="font-body text-sm text-accent sm:col-span-3">{err}</p>}
      <div className="flex gap-2 sm:col-span-3">
        <button disabled={busy} className="min-h-[40px] bg-ink px-4 py-2 font-body text-sm text-surface disabled:opacity-50">Add household</button>
        <button type="button" onClick={onCancel} className="min-h-[40px] border border-rule bg-surface px-4 py-2 font-body text-sm text-ink">Cancel</button>
      </div>
    </form>
  );
}
