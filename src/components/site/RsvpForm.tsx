import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { z } from 'zod';
import { rsvpSchema, type RsvpInput } from '../../lib/rsvp-schema';
import {
  BANK_DETAILS,
  GIFT_DETAILS,
  PAYMENT_DEADLINE,
  STAY_OPTIONS,
  formatRand,
  quote,
  type StayOption,
} from '../../lib/pricing';

/**
 * RSVP form, per the Claude Design reference. Two flows: attending (household,
 * nights, children, running total, dietary, payment + gift details) or
 * declining (a note). Posts to /api/rsvp; the server recomputes the total.
 */
type Attendance = 'attending' | 'declining' | null;
type Errors = Record<string, string[] | undefined>;

const eyebrow = 'font-body font-medium text-[0.78rem] tracking-[0.15em] uppercase text-brand-accent mb-[1.4em]';
const fieldLabel = 'block font-body font-medium text-[0.78rem] tracking-[0.05em] text-brand-muted mb-[0.6em]';
const lineInput =
  'w-full box-border bg-transparent border-0 border-b border-brand-rule py-[0.7em] text-[16px] text-brand-ink';
const boxInput =
  'w-full box-border bg-transparent border border-brand-rule px-[1em] py-[0.9em] text-[16px] text-brand-ink leading-[1.6] resize-y';
const sendButton =
  'w-full box-border min-h-[48px] bg-brand-ink text-brand-bg border-0 font-body font-medium text-[0.85rem] tracking-[0.1em] uppercase cursor-pointer transition-colors hover:bg-brand-ink-hover disabled:opacity-50';
const err = 'mt-[0.5em] font-body text-[0.8rem] text-[#9B3B2E]';

function Section({ title, children, className = '' }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={`fade-in pb-[3em] ${className}`}>
      <div className={eyebrow}>{title}</div>
      {children}
    </section>
  );
}

function DetailRows({ rows }: { rows: { label: string; value: string }[] }) {
  return (
    <>
      {rows.map((r) => (
        <div key={r.label} className="flex justify-between gap-[1em] border-t border-brand-rule py-[0.8em]">
          <span className="font-body font-medium text-[0.85rem] text-brand-muted">{r.label}</span>
          <span className="text-right font-body text-[0.95rem] text-brand-ink">{r.value}</span>
        </div>
      ))}
    </>
  );
}

export default function RsvpForm() {
  const [attendance, setAttendance] = useState<Attendance>(null);
  const [householdName, setHouseholdName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [guestNames, setGuestNames] = useState<string[]>(['', '']);
  const [stay, setStay] = useState<StayOption>('friday_saturday');
  const [children, setChildren] = useState(0);
  const [dietary, setDietary] = useState('');
  const [message, setMessage] = useState('');
  const [errors, setErrors] = useState<Errors>({});
  const [status, setStatus] = useState<'idle' | 'sending' | 'done'>('idle');
  const [sentAttending, setSentAttending] = useState(false);

  const isAttending = attendance === 'attending';
  const isDeclining = attendance === 'declining';

  const adults = guestNames.length;
  const total = useMemo(() => quote({ stay, adults, children }), [stay, adults, children]);

  // Sticky total bar overlays the bottom of the page while attending.
  useEffect(() => {
    document.body.style.paddingBottom = isAttending && status !== 'done' ? '76px' : '';
    return () => {
      document.body.style.paddingBottom = '';
    };
  }, [isAttending, status]);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const honeypot = (e.currentTarget.elements.namedItem('website') as HTMLInputElement | null)?.value ?? '';
    const payload: RsvpInput = isAttending
      ? {
          attending: true,
          household_name: householdName,
          email,
          phone,
          guests: guestNames.map((g) => g.trim()).filter(Boolean),
          stay,
          children,
          dietary,
          message: '',
          website: honeypot,
        }
      : { attending: false, household_name: householdName, email, phone: '', message, website: honeypot };

    const parsed = rsvpSchema.safeParse(payload);
    if (!parsed.success) {
      setErrors(z.flattenError(parsed.error).fieldErrors as Errors);
      return;
    }
    setErrors({});
    setStatus('sending');
    try {
      const res = await fetch('/api/rsvp', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(parsed.data),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErrors(data.issues ?? { form: [data.error ?? 'Something went wrong — please try again'] });
        setStatus('idle');
        return;
      }
      setSentAttending(!!data.attending);
      setStatus('done');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch {
      setErrors({ form: ['Network error — please try again'] });
      setStatus('idle');
    }
  }

  if (status === 'done') {
    return (
      <section className="fade-in pb-[6em] pt-[1em] text-center">
        <p className="mb-[0.6em] font-display italic font-medium text-brand-ink text-[clamp(1.5rem,4cqw,2rem)]">
          {sentAttending ? 'Thank you — we cannot wait to see you there.' : 'Thank you for letting us know.'}
        </p>
        {sentAttending && (
          <p className="mx-auto max-w-[34em] font-display leading-[1.6] text-brand-muted text-[clamp(1.05rem,2.4cqw,1.2rem)]">
            Your accommodation total is <strong className="text-brand-ink">{formatRand(total.totalCents)}</strong>, payable by
            EFT by {PAYMENT_DEADLINE}. Use your initials and surname as the reference.
          </p>
        )}
        <p className="mt-[1.6em] font-body text-[0.85rem] text-brand-muted">
          Need to change something? Submit the form again with the same email address.
        </p>
      </section>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate>
      {/* honeypot */}
      <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />

      {/* ATTENDANCE */}
      <section className="pb-[3em]">
        {(
          [
            ['attending', 'Joyfully attending'],
            ['declining', 'Regretfully declining'],
          ] as const
        ).map(([key, label]) => {
          const on = attendance === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => setAttendance(key)}
              aria-pressed={on}
              className={`mb-[0.8em] block min-h-[44px] w-full box-border cursor-pointer border px-[1.4em] py-[1.3em] text-left font-display font-medium text-brand-ink transition-colors hover:bg-brand-soft text-[clamp(1.2rem,3cqw,1.4rem)] ${
                on ? 'border-brand-ink bg-brand-soft' : 'border-brand-rule bg-transparent'
              }`}
            >
              {label}
            </button>
          );
        })}
      </section>

      {/* DECLINING FLOW */}
      {isDeclining && (
        <section className="fade-in pb-[6em]">
          <label className={fieldLabel} htmlFor="d-name">Your name(s)</label>
          <input id="d-name" className={`${lineInput} mb-[2em]`} value={householdName} onChange={(e) => setHouseholdName(e.target.value)} placeholder="e.g. The Kruger Family" />
          {errors.household_name && <p className={`${err} -mt-[1.6em] mb-[1.6em]`}>{errors.household_name[0]}</p>}

          <label className={fieldLabel} htmlFor="d-email">Email</label>
          <input id="d-email" type="email" className={`${lineInput} mb-[2em]`} value={email} onChange={(e) => setEmail(e.target.value)} />
          {errors.email && <p className={`${err} -mt-[1.6em] mb-[1.6em]`}>{errors.email[0]}</p>}

          <label className={`${fieldLabel} tracking-[0.1em] uppercase mb-[0.7em]`} htmlFor="d-message">A message for the couple (optional)</label>
          <textarea id="d-message" rows={4} className={boxInput} value={message} onChange={(e) => setMessage(e.target.value)} />

          {errors.form && <p className={err}>{errors.form[0]}</p>}
          <button type="submit" disabled={status === 'sending'} className={`${sendButton} mt-[1.6em]`}>
            {status === 'sending' ? 'Sending…' : 'Send our response'}
          </button>
        </section>
      )}

      {/* ATTENDING FLOW */}
      {isAttending && (
        <div>
          <Section title="Your Household">
            <label className={fieldLabel} htmlFor="household">Household name</label>
            <input id="household" className={`${lineInput} mb-[2em]`} value={householdName} onChange={(e) => setHouseholdName(e.target.value)} placeholder="e.g. The Kruger Family" />
            {errors.household_name && <p className={`${err} -mt-[1.6em] mb-[1.6em]`}>{errors.household_name[0]}</p>}

            <div className="mb-[2em] grid gap-[1.2em] sm:grid-cols-2">
              <div>
                <label className={fieldLabel} htmlFor="email">Email</label>
                <input id="email" type="email" className={lineInput} value={email} onChange={(e) => setEmail(e.target.value)} />
                {errors.email && <p className={err}>{errors.email[0]}</p>}
              </div>
              <div>
                <label className={fieldLabel} htmlFor="phone">Phone (optional)</label>
                <input id="phone" type="tel" className={lineInput} value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>
            </div>

            <label className={fieldLabel}>Everyone attending</label>
            {guestNames.map((name, i) => (
              <div key={i} className="mb-[0.9em] flex items-center gap-[0.8em]">
                <input
                  aria-label={`Guest ${i + 1} name`}
                  className={`${lineInput} min-w-0 flex-1`}
                  value={name}
                  onChange={(e) => setGuestNames((g) => g.map((v, j) => (j === i ? e.target.value : v)))}
                  placeholder="Guest name"
                />
                {guestNames.length > 1 && (
                  <button
                    type="button"
                    onClick={() => setGuestNames((g) => g.filter((_, j) => j !== i))}
                    aria-label="Remove guest"
                    className="h-[44px] w-[44px] flex-none cursor-pointer border-0 bg-transparent text-[1.3rem] text-brand-muted transition-colors hover:text-brand-ink"
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
            {errors.guests && <p className={err}>{errors.guests[0]}</p>}
            {guestNames.length < 10 && (
              <button
                type="button"
                onClick={() => setGuestNames((g) => [...g, ''])}
                className="inline-block min-h-[44px] cursor-pointer border-0 bg-transparent p-0 font-body font-medium text-[0.85rem] tracking-[0.03em] text-brand-accent underline underline-offset-[0.15em] transition-[text-underline-offset] hover:underline-offset-[0.3em]"
              >
                + Add another guest
              </button>
            )}
          </Section>

          <Section title="Which Nights">
            {(Object.keys(STAY_OPTIONS) as StayOption[]).map((key) => {
              const opt = STAY_OPTIONS[key];
              return (
                <label key={key} className="block min-h-[44px] w-full cursor-pointer border-t border-brand-rule py-[1.1em] transition-colors hover:bg-brand-soft">
                  <div className="flex items-baseline justify-between gap-[1em]">
                    <span className="flex items-baseline gap-[0.7em]">
                      <input type="radio" name="stay" checked={stay === key} onChange={() => setStay(key)} className="h-[18px] w-[18px] flex-none accent-brand-accent" />
                      <span className="font-display font-medium text-brand-ink text-[clamp(1.1rem,2.8cqw,1.3rem)]">{opt.label}</span>
                    </span>
                    <span className="flex-none whitespace-nowrap font-body font-medium text-[0.95rem] text-brand-accent">{opt.priceLabel}</span>
                  </div>
                  <p className="ml-[2.5em] mt-[0.5em] font-body leading-[1.6] text-[0.85rem] text-brand-muted">{opt.smallPrint}</p>
                </label>
              );
            })}
          </Section>

          <Section title="Children">
            <div className="flex items-center justify-between gap-[1em] border-t border-brand-rule py-[0.9em]">
              <label htmlFor="children" className="font-display text-brand-ink text-[clamp(1.05rem,2.6cqw,1.2rem)]">
                Children aged 2–12 — R270 per child per night
              </label>
              <input
                id="children"
                type="number"
                inputMode="numeric"
                min={0}
                max={10}
                value={children}
                onChange={(e) => {
                  const n = parseInt(e.target.value, 10);
                  setChildren(Number.isNaN(n) || n < 0 ? 0 : Math.min(10, n));
                }}
                className="w-[3.2em] flex-none box-border border-0 border-b border-brand-rule bg-transparent px-[0.3em] py-[0.6em] text-center text-[16px] text-brand-ink"
              />
            </div>
            <p className="mt-[0.8em] font-body text-[0.85rem] text-brand-muted">Children under 2 stay free.</p>
          </Section>

          <Section title="Running Total">
            {total.lines.map((l) => (
              <div key={l.label} className="flex justify-between gap-[1em] border-t border-brand-rule py-[0.7em] font-body text-[0.9rem] text-brand-muted">
                <span>{l.label}</span>
                <span className="whitespace-nowrap">{formatRand(l.cents)}</span>
              </div>
            ))}
            <div className="mt-[0.6em] flex items-baseline justify-between gap-[1em] border-t border-brand-ink pt-[1em]">
              <span className="font-display font-medium text-[1.15rem] text-brand-ink">Total</span>
              <span className="whitespace-nowrap font-display font-medium text-[1.5rem] text-brand-ink">{formatRand(total.totalCents)}</span>
            </div>
          </Section>

          <Section title="Dietary Requirements">
            <textarea rows={3} className={boxInput} value={dietary} onChange={(e) => setDietary(e.target.value)} placeholder="Let us know of any dietary requirements for your household" />
          </Section>

          <Section title="Payment">
            <p className="mb-[1.4em] font-display leading-[1.6] text-brand-ink text-[clamp(1.05rem,2.4cqw,1.2rem)]">
              Accommodation is paid directly to us by {PAYMENT_DEADLINE}.
            </p>
            <DetailRows rows={BANK_DETAILS} />
          </Section>

          <Section title="A Gift">
            <p className="mb-[1.4em] font-display leading-[1.65] text-brand-ink text-[clamp(1.05rem,2.4cqw,1.2rem)]">
              Having you celebrate our special day with us is truly the greatest gift we could ask for. If you would like to
              bless us with something extra, you are more than welcome to use the details below. Thank you for being part
              of our lives and sharing this beautiful new chapter with us.
            </p>
            <DetailRows rows={GIFT_DETAILS} />
            <p className="mt-[1.2em] font-body italic text-[0.85rem] text-brand-muted">This is separate from your accommodation payment.</p>
          </Section>

          <section className="fade-in pb-[6em]">
            {errors.form && <p className={`${err} mb-[1em]`}>{errors.form[0]}</p>}
            <button type="submit" disabled={status === 'sending'} className={sendButton}>
              {status === 'sending' ? 'Sending…' : 'Send our RSVP'}
            </button>
          </section>

          {/* STICKY TOTAL BAR */}
          <div className="fixed bottom-0 left-0 right-0 z-[15] box-border flex items-baseline justify-between border-t border-brand-ink bg-brand-bg px-[6cqw] pt-[0.8em] pb-[calc(0.8em+env(safe-area-inset-bottom,0px))]">
            <span className="font-body font-medium text-[0.78rem] uppercase tracking-[0.1em] text-brand-muted">Total</span>
            <span className="font-display font-medium text-[1.4rem] text-brand-ink">{formatRand(total.totalCents)}</span>
          </div>
        </div>
      )}
    </form>
  );
}
