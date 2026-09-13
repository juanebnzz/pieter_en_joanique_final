import type { Guest, HouseholdOverview, Payment, RsvpStatus } from '../../lib/supabase';

export type HouseholdRow = HouseholdOverview & { id: string; guests: Guest[]; payments: Payment[] };

export type Overview = {
  summary: {
    households: number;
    attending: number;
    declined: number;
    pending: number;
    guests_attending: number;
    children_attending: number;
    friday_households: number;
    saturday_households: number;
    due_cents: number;
    paid_cents: number;
    outstanding_cents: number;
    paid: number;
    partial: number;
    unpaid: number;
  };
  households: HouseholdRow[];
  generated_at: string;
};

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

async function call<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: { 'content-type': 'application/json', ...(init?.headers ?? {}) },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(res.status, data.error ?? `Request failed (${res.status})`);
  return data as T;
}

export const api = {
  overview: () => call<Overview>('/api/admin/overview'),
  createHousehold: (body: Record<string, unknown>) =>
    call('/api/admin/households', { method: 'POST', body: JSON.stringify(body) }),
  updateHousehold: (id: string, body: Record<string, unknown>) =>
    call(`/api/admin/households/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  deleteHousehold: (id: string) => call(`/api/admin/households/${id}`, { method: 'DELETE' }),
  addPayment: (body: Record<string, unknown>) =>
    call('/api/admin/payments', { method: 'POST', body: JSON.stringify(body) }),
  deletePayment: (id: string) =>
    call('/api/admin/payments', { method: 'DELETE', body: JSON.stringify({ id }) }),
};

export const rands = (cents: number | null | undefined) =>
  new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR', maximumFractionDigits: 0 }).format(
    (cents ?? 0) / 100,
  );

export const STAY_LABEL: Record<string, string> = {
  friday_saturday: "Fri + Sat",
  saturday: "Sat only",
};

export const RSVP_LABEL: Record<RsvpStatus, string> = {
  pending: 'No reply yet',
  attending: 'Attending',
  declined: 'Declined',
};
