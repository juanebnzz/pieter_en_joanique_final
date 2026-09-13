import { useCallback, useEffect, useMemo, useState } from 'react';
import { api, ApiError, rands, type HouseholdRow, type Overview } from './api';
import HouseholdCard from './HouseholdCard';
import AddHouseholdForm from './AddHouseholdForm';

/**
 * Admin dashboard — a single React island under /admin.
 * Mobile-first; styled on the site's palette so it feels like the same product.
 */
type RsvpFilter = 'all' | 'attending' | 'declined' | 'pending';
type PayFilter = 'all' | 'paid' | 'partial' | 'unpaid';

const btn = 'min-h-[40px] border border-rule bg-surface px-3 py-2 font-body text-sm text-ink transition-colors hover:border-ink';
const btnDark = 'min-h-[40px] bg-ink px-3 py-2 font-body text-sm text-surface transition-colors hover:bg-accent';
const select = 'min-h-[40px] border border-ink bg-surface px-3 py-2 font-body text-sm text-ink';

export default function AdminDashboard() {
  const [data, setData] = useState<Overview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [offline, setOffline] = useState(false);
  const [search, setSearch] = useState('');
  const [rsvpFilter, setRsvpFilter] = useState<RsvpFilter>('all');
  const [payFilter, setPayFilter] = useState<PayFilter>('all');
  const [showAdd, setShowAdd] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const d = await api.overview();
      setData(d);
      setError(null);
      setOffline(false);
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) {
        setError('Your admin session has expired. Open your private admin link again to sign back in.');
      } else if (!navigator.onLine) {
        setOffline(true);
      } else {
        setError(e instanceof Error ? e.message : 'Could not load data');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    const onOnline = () => refresh();
    window.addEventListener('online', onOnline);
    return () => window.removeEventListener('online', onOnline);
  }, [refresh]);

  const filtered = useMemo(() => {
    if (!data) return [];
    const q = search.trim().toLowerCase();
    return data.households.filter((h) => {
      if (rsvpFilter !== 'all' && h.rsvp_status !== rsvpFilter) return false;
      if (payFilter !== 'all') {
        if (payFilter === 'unpaid' && !(h.payment_status === 'unpaid' && (h.amount_due_cents ?? 0) > 0)) return false;
        if (payFilter !== 'unpaid' && h.payment_status !== payFilter) return false;
      }
      if (!q) return true;
      const hay = [h.name, h.email, h.phone, h.invite_code, h.notes, h.dietary, ...h.guests.map((g) => g.full_name)]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return hay.includes(q);
    });
  }, [data, search, rsvpFilter, payFilter]);

  const s = data?.summary;

  return (
    <div className="mx-auto max-w-5xl px-4 pb-24 pt-6 sm:px-6">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-medium text-ink">Pieter &amp; Joanique</h1>
          <p className="font-body text-sm text-ink">
            RSVPs &amp; payments
            {data && <> · updated {new Date(data.generated_at).toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' })}</>}
            {offline && <span className="ml-2 border border-accent px-2 py-0.5 text-accent">offline — showing last copy</span>}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={refresh} className={btn}>Refresh</button>
          <a href="/api/admin/export.csv" className={`${btn} inline-flex items-center`}>Export CSV</a>
          <button onClick={() => setShowAdd((v) => !v)} className={btnDark}>+ Household</button>
          <form method="post" action="/admin/logout">
            <button className={btn}>Log out</button>
          </form>
        </div>
      </header>

      {error && <div className="mb-4 border border-accent p-4 font-body text-sm text-ink" role="alert">{error}</div>}

      {showAdd && <AddHouseholdForm onDone={() => { setShowAdd(false); refresh(); }} onCancel={() => setShowAdd(false)} />}

      {s && (
        <section className="mb-6 grid grid-cols-2 gap-px border border-rule bg-rule sm:grid-cols-4">
          <Stat label="Attending" value={s.attending} sub={`${s.guests_attending} ${s.guests_attending === 1 ? "guest" : "guests"} · ${s.children_attending} ${s.children_attending === 1 ? "child" : "children"}`} />
          <Stat label="Fri + Sat / Sat only" value={`${s.friday_households} / ${s.saturday_households}`} sub="households" />
          <Stat label="Declined · No reply" value={`${s.declined} · ${s.pending}`} sub={`${s.households} on the list`} />
          <Stat label="Paid" value={rands(s.paid_cents)} sub={`of ${rands(s.due_cents)} · ${rands(s.outstanding_cents)} outstanding`} />
        </section>
      )}

      <section className="mb-4 flex flex-wrap gap-2">
        <input
          type="search"
          placeholder="Search name, email, guest, dietary…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={`${select} min-w-[12rem] flex-1`}
        />
        <select value={rsvpFilter} onChange={(e) => setRsvpFilter(e.target.value as RsvpFilter)} className={select}>
          <option value="all">All RSVPs</option>
          <option value="attending">Attending</option>
          <option value="declined">Declined</option>
          <option value="pending">No reply yet</option>
        </select>
        <select value={payFilter} onChange={(e) => setPayFilter(e.target.value as PayFilter)} className={select}>
          <option value="all">All payments</option>
          <option value="paid">Paid</option>
          <option value="partial">Partially paid</option>
          <option value="unpaid">Unpaid (owing)</option>
        </select>
      </section>

      {loading && !data && <p className="font-body text-sm text-ink">Loading…</p>}

      {data && filtered.length === 0 && (
        <p className="border border-dashed border-rule p-8 text-center font-body text-sm text-ink">
          {data.households.length === 0 ? 'No RSVPs yet. Add households manually or wait for guests to respond.' : 'Nothing matches those filters.'}
        </p>
      )}

      <ul className="space-y-3">
        {filtered.map((h: HouseholdRow) => (
          <li key={h.id}>
            <HouseholdCard household={h} onChanged={refresh} />
          </li>
        ))}
      </ul>

      <p className="mt-8 text-center font-body text-xs text-ink">
        {filtered.length} of {data?.households.length ?? 0} households
      </p>
    </div>
  );
}

function Stat({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="bg-surface p-4">
      <p className="eyebrow text-[0.68rem]">{label}</p>
      <p className="mt-1 font-display text-2xl font-medium text-ink">{value}</p>
      {sub && <p className="mt-1 font-body text-xs text-ink">{sub}</p>}
    </div>
  );
}
