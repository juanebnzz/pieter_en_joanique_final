import { useCallback, useEffect, useMemo, useState } from 'react';
import { api, ApiError, rands, RSVP_LABEL, type HouseholdRow, type Overview } from './api';
import HouseholdCard from './HouseholdCard';
import AddHouseholdForm from './AddHouseholdForm';

/**
 * Admin dashboard — a single React island under /admin.
 * Functional and mobile-first; visual polish to follow the design reference.
 */
type RsvpFilter = 'all' | 'attending' | 'declined' | 'pending';
type PayFilter = 'all' | 'paid' | 'partial' | 'unpaid';

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
      const hay = [h.name, h.email, h.phone, h.invite_code, h.notes, ...h.guests.map((g) => g.full_name)]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return hay.includes(q);
    });
  }, [data, search, rsvpFilter, payFilter]);

  const s = data?.summary;

  return (
    <div className="mx-auto max-w-5xl px-4 pb-24 pt-6 sm:px-6">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Pieter &amp; Joanique</h1>
          <p className="text-sm text-neutral-500">
            RSVP &amp; payments
            {data && <> · updated {new Date(data.generated_at).toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' })}</>}
            {offline && <span className="ml-2 rounded bg-amber-100 px-2 py-0.5 text-amber-800">offline — showing last copy</span>}
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={refresh} className="rounded border border-neutral-300 bg-white px-3 py-2 text-sm">Refresh</button>
          <a href="/api/admin/export.csv" className="rounded border border-neutral-300 bg-white px-3 py-2 text-sm">Export CSV</a>
          <button onClick={() => setShowAdd((v) => !v)} className="rounded bg-neutral-900 px-3 py-2 text-sm text-white">+ Household</button>
          <form method="post" action="/admin/logout">
            <button className="rounded border border-neutral-300 bg-white px-3 py-2 text-sm">Log out</button>
          </form>
        </div>
      </header>

      {error && <div className="mb-4 rounded border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</div>}

      {showAdd && (
        <AddHouseholdForm
          onDone={() => { setShowAdd(false); refresh(); }}
          onCancel={() => setShowAdd(false)}
        />
      )}

      {s && (
        <section className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="Attending" value={s.attending} sub={`${s.guests_attending} guests · ${s.children_attending} kids`} />
          <Stat label="Declined" value={s.declined} />
          <Stat label="No reply yet" value={s.pending} sub={`${s.households} invitations`} />
          <Stat label="Paid" value={rands(s.paid_cents)} sub={`of ${rands(s.due_cents)} · ${rands(s.outstanding_cents)} outstanding`} />
        </section>
      )}

      <section className="mb-4 flex flex-wrap gap-2">
        <input
          type="search"
          placeholder="Search name, email, guest…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="min-w-[12rem] flex-1 rounded border border-neutral-300 bg-white px-3 py-2 text-sm"
        />
        <select value={rsvpFilter} onChange={(e) => setRsvpFilter(e.target.value as RsvpFilter)} className="rounded border border-neutral-300 bg-white px-3 py-2 text-sm">
          <option value="all">All RSVPs</option>
          <option value="attending">Attending</option>
          <option value="declined">Declined</option>
          <option value="pending">No reply yet</option>
        </select>
        <select value={payFilter} onChange={(e) => setPayFilter(e.target.value as PayFilter)} className="rounded border border-neutral-300 bg-white px-3 py-2 text-sm">
          <option value="all">All payments</option>
          <option value="paid">Paid</option>
          <option value="partial">Partially paid</option>
          <option value="unpaid">Unpaid (owing)</option>
        </select>
      </section>

      {loading && !data && <p className="text-sm text-neutral-500">Loading…</p>}

      {data && filtered.length === 0 && (
        <p className="rounded border border-dashed border-neutral-300 p-8 text-center text-sm text-neutral-500">
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

      <p className="mt-8 text-center text-xs text-neutral-400">
        {filtered.length} of {data?.households.length ?? 0} · {RSVP_LABEL.pending.toLowerCase()} means no RSVP received
      </p>
    </div>
  );
}

function Stat({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-4">
      <p className="text-xs uppercase tracking-wide text-neutral-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
      {sub && <p className="mt-1 text-xs text-neutral-500">{sub}</p>}
    </div>
  );
}
