import { useState, type FormEvent } from 'react';
import { z } from 'zod';
import { rsvpSchema, type RsvpInput } from '../../lib/rsvp-schema';

/**
 * Functional RSVP form. Unstyled beyond basic layout — restyle to match the
 * Claude Design reference. Field names match rsvpSchema / POST /api/rsvp.
 */
type GuestRow = { full_name: string; is_child: boolean; dietary: string };

const emptyGuest = (): GuestRow => ({ full_name: '', is_child: false, dietary: '' });

const input =
  'w-full rounded border border-neutral-300 bg-white px-3 py-2 text-base outline-none focus:border-brand-accent';
const label = 'block text-sm font-medium mb-1';

export default function RsvpForm() {
  const [householdName, setHouseholdName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [attending, setAttending] = useState<boolean | null>(null);
  const [guests, setGuests] = useState<GuestRow[]>([emptyGuest()]);
  const [message, setMessage] = useState('');
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [state, setState] = useState<'idle' | 'submitting' | 'done' | 'failed'>('idle');
  const [result, setResult] = useState<boolean | null>(null);

  function updateGuest(i: number, patch: Partial<GuestRow>) {
    setGuests((gs) => gs.map((g, j) => (j === i ? { ...g, ...patch } : g)));
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (attending === null) {
      setErrors({ attending: ['Please let us know if you can make it'] });
      return;
    }
    const payload: RsvpInput = {
      household_name: householdName,
      email,
      phone,
      invite_code: inviteCode,
      attending,
      guests: attending ? guests.filter((g) => g.full_name.trim()) : [],
      message,
      website: (e.currentTarget.elements.namedItem('website') as HTMLInputElement)?.value ?? '',
    };
    const parsed = rsvpSchema.safeParse(payload);
    if (!parsed.success) {
      setErrors(z.flattenError(parsed.error).fieldErrors as Record<string, string[]>);
      return;
    }
    setErrors({});
    setState('submitting');
    try {
      const res = await fetch('/api/rsvp', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(parsed.data),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrors(data.issues ?? { form: [data.error ?? 'Something went wrong'] });
        setState('failed');
        return;
      }
      setResult(data.attending);
      setState('done');
    } catch {
      setErrors({ form: ['Network error — please try again'] });
      setState('failed');
    }
  }

  if (state === 'done') {
    return (
      <div className="rounded border border-brand-accent bg-brand-accent-soft p-6 text-center">
        <p className="font-display text-2xl">
          {result ? 'Thank you — we can’t wait to celebrate with you!' : 'Thank you for letting us know.'}
        </p>
        <p className="mt-2 text-sm text-brand-muted">
          Need to change something? Just submit the form again with the same email.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6" noValidate>
      {/* honeypot */}
      <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className={label} htmlFor="household_name">Your name(s)</label>
          <input id="household_name" className={input} value={householdName} onChange={(e) => setHouseholdName(e.target.value)} placeholder="e.g. Jan & Sara van der Merwe" />
          {errors.household_name && <p className="mt-1 text-sm text-red-600">{errors.household_name[0]}</p>}
        </div>
        <div>
          <label className={label} htmlFor="email">Email</label>
          <input id="email" type="email" className={input} value={email} onChange={(e) => setEmail(e.target.value)} />
          {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email[0]}</p>}
        </div>
        <div>
          <label className={label} htmlFor="phone">Phone (optional)</label>
          <input id="phone" type="tel" className={input} value={phone} onChange={(e) => setPhone(e.target.value)} />
        </div>
        <div className="sm:col-span-2">
          <label className={label} htmlFor="invite_code">Invite code (if on your invitation)</label>
          <input id="invite_code" className={input} value={inviteCode} onChange={(e) => setInviteCode(e.target.value)} />
        </div>
      </div>

      <fieldset>
        <legend className={label}>Will you be joining us?</legend>
        <div className="flex gap-3">
          <button type="button" onClick={() => setAttending(true)} className={`rounded border px-4 py-2 ${attending === true ? 'border-brand-accent bg-brand-accent-soft' : 'border-neutral-300 bg-white'}`}>
            Joyfully accept
          </button>
          <button type="button" onClick={() => setAttending(false)} className={`rounded border px-4 py-2 ${attending === false ? 'border-brand-accent bg-brand-accent-soft' : 'border-neutral-300 bg-white'}`}>
            Regretfully decline
          </button>
        </div>
        {errors.attending && <p className="mt-1 text-sm text-red-600">{errors.attending[0]}</p>}
      </fieldset>

      {attending && (
        <fieldset className="space-y-3">
          <legend className={label}>Who's coming?</legend>
          {guests.map((g, i) => (
            <div key={i} className="grid gap-2 sm:grid-cols-[1fr_auto_1fr_auto] sm:items-center">
              <input className={input} placeholder="Full name" value={g.full_name} onChange={(e) => updateGuest(i, { full_name: e.target.value })} />
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={g.is_child} onChange={(e) => updateGuest(i, { is_child: e.target.checked })} /> Child
              </label>
              <input className={input} placeholder="Dietary requirements" value={g.dietary} onChange={(e) => updateGuest(i, { dietary: e.target.value })} />
              <button type="button" aria-label="Remove guest" disabled={guests.length === 1} onClick={() => setGuests((gs) => gs.filter((_, j) => j !== i))} className="text-sm text-brand-muted disabled:opacity-30">
                Remove
              </button>
            </div>
          ))}
          {guests.length < 10 && (
            <button type="button" onClick={() => setGuests((gs) => [...gs, emptyGuest()])} className="text-sm underline">
              + Add another guest
            </button>
          )}
          {errors.guests && <p className="text-sm text-red-600">{errors.guests[0]}</p>}
        </fieldset>
      )}

      <div>
        <label className={label} htmlFor="message">A note for the couple (optional)</label>
        <textarea id="message" rows={3} className={input} value={message} onChange={(e) => setMessage(e.target.value)} />
      </div>

      {errors.form && <p className="text-sm text-red-600">{errors.form[0]}</p>}

      <button type="submit" disabled={state === 'submitting'} className="rounded bg-brand-ink px-6 py-3 text-white disabled:opacity-50">
        {state === 'submitting' ? 'Sending…' : 'Send RSVP'}
      </button>
    </form>
  );
}
