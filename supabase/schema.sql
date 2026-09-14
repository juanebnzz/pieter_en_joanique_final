-- Pieter & Joanique — complete schema, generated from supabase/migrations/ on 2026-09-14.
-- Paste into the SQL editor of a fresh project to stand it up in one go.
-- Keep supabase/migrations/ as the source of truth; regenerate this file after schema changes.

-- ===== 20260913000000_init.sql =====
-- Pieter & Joanique wedding — initial schema
-- Access model: the browser never talks to Supabase directly. All reads/writes
-- go through Astro server endpoints using the secret (service-role) key.
-- RLS is enabled on every table with NO policies, so anon/authenticated keys
-- get nothing even if leaked.

create extension if not exists pgcrypto;

create type public.rsvp_status as enum ('pending', 'attending', 'declined');
create type public.payment_status as enum ('unpaid', 'partial', 'paid');

-- One row per invitation (a couple, a family, a single guest).
create table public.households (
  id uuid primary key default gen_random_uuid(),
  name text not null,                                  -- "Familie Botha", "Jan & Sara"
  invite_code text unique,                             -- optional pre-issued code printed on the invite
  email text,
  phone text,
  max_guests integer not null default 2 check (max_guests >= 1),
  rsvp_status public.rsvp_status not null default 'pending',
  responded_at timestamptz,
  message text,                                        -- guest's note to the couple
  amount_due_cents integer not null default 0 check (amount_due_cents >= 0),
  payment_status public.payment_status not null default 'unpaid',
  notes text,                                          -- admin-only notes
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index households_email_idx on public.households (lower(email));
create index households_rsvp_status_idx on public.households (rsvp_status);
create index households_payment_status_idx on public.households (payment_status);

-- Individual people inside a household.
create table public.guests (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  full_name text not null,
  is_child boolean not null default false,
  attending boolean,                                   -- null = not answered yet
  dietary text,
  created_at timestamptz not null default now()
);

create index guests_household_id_idx on public.guests (household_id);

-- Ledger of money received. payment_status on the household is derived from this.
create table public.payments (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  amount_cents integer not null check (amount_cents > 0),
  method text,                                         -- 'eft', 'cash', 'snapscan', ...
  reference text,
  paid_at timestamptz not null default now(),
  notes text,
  created_at timestamptz not null default now()
);

create index payments_household_id_idx on public.payments (household_id);

-- Raw audit log of every RSVP form submission (never edited, never deleted).
create table public.rsvp_submissions (
  id uuid primary key default gen_random_uuid(),
  household_id uuid references public.households (id) on delete set null,
  payload jsonb not null,
  ip text,
  user_agent text,
  created_at timestamptz not null default now()
);

-- updated_at bookkeeping
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

create trigger households_set_updated_at
  before update on public.households
  for each row execute function public.set_updated_at();

-- Keep households.payment_status in sync with the payments ledger.
create or replace function public.recompute_payment_status(p_household_id uuid)
returns void language plpgsql as $$
declare
  v_paid integer;
  v_due integer;
begin
  select coalesce(sum(amount_cents), 0) into v_paid
    from public.payments where household_id = p_household_id;
  select amount_due_cents into v_due
    from public.households where id = p_household_id;

  update public.households
     set payment_status = case
       when v_paid <= 0 then 'unpaid'::public.payment_status
       when v_paid >= v_due then 'paid'::public.payment_status
       else 'partial'::public.payment_status
     end
   where id = p_household_id;
end $$;

create or replace function public.payments_recompute_trigger()
returns trigger language plpgsql as $$
begin
  perform public.recompute_payment_status(coalesce(new.household_id, old.household_id));
  return null;
end $$;

create trigger payments_recompute_status
  after insert or update or delete on public.payments
  for each row execute function public.payments_recompute_trigger();

create or replace function public.households_due_changed_trigger()
returns trigger language plpgsql as $$
begin
  if new.amount_due_cents is distinct from old.amount_due_cents then
    perform public.recompute_payment_status(new.id);
  end if;
  return null;
end $$;

create trigger households_due_changed
  after update of amount_due_cents on public.households
  for each row execute function public.households_due_changed_trigger();

-- Convenience view for the admin dashboard.
create or replace view public.household_overview
with (security_invoker = true) as
select
  h.*,
  coalesce(g.guest_count, 0)      as guest_count,
  coalesce(g.attending_count, 0)  as attending_count,
  coalesce(g.child_count, 0)      as child_count,
  coalesce(p.paid_cents, 0)       as paid_cents,
  greatest(h.amount_due_cents - coalesce(p.paid_cents, 0), 0) as outstanding_cents
from public.households h
left join (
  select household_id,
         count(*)                                   as guest_count,
         count(*) filter (where attending is true)  as attending_count,
         count(*) filter (where is_child)           as child_count
    from public.guests group by household_id
) g on g.household_id = h.id
left join (
  select household_id, sum(amount_cents) as paid_cents
    from public.payments group by household_id
) p on p.household_id = h.id;

-- Lock everything down. Service-role bypasses RLS; nobody else gets in.
alter table public.households      enable row level security;
alter table public.guests          enable row level security;
alter table public.payments        enable row level security;
alter table public.rsvp_submissions enable row level security;

revoke all on all tables in schema public from anon, authenticated;
revoke all on all functions in schema public from anon, authenticated;

-- ===== 20260913000001_harden_function_search_path.sql =====
-- Pin search_path on trigger/helper functions (Supabase security advisor 0011).
alter function public.set_updated_at() set search_path = '';
alter function public.recompute_payment_status(uuid) set search_path = '';
alter function public.payments_recompute_trigger() set search_path = '';
alter function public.households_due_changed_trigger() set search_path = '';

-- ===== 20260913000002_rsvp_stay_children_dietary.sql =====
-- RSVP fields from the final design: which nights, children count, household dietary.
create type public.stay_option as enum ('friday_saturday', 'saturday');

alter table public.households
  add column stay public.stay_option,
  add column children_count integer not null default 0 check (children_count >= 0),
  add column dietary text;

-- household_overview selects h.* which is expanded at creation time — recreate it.
drop view public.household_overview;
create view public.household_overview
with (security_invoker = true) as
select
  h.*,
  coalesce(g.guest_count, 0)      as guest_count,
  coalesce(g.attending_count, 0)  as attending_count,
  coalesce(g.child_count, 0)      as child_count,
  coalesce(p.paid_cents, 0)       as paid_cents,
  greatest(h.amount_due_cents - coalesce(p.paid_cents, 0), 0) as outstanding_cents
from public.households h
left join (
  select household_id,
         count(*)                                   as guest_count,
         count(*) filter (where attending is true)  as attending_count,
         count(*) filter (where is_child)           as child_count
    from public.guests group by household_id
) g on g.household_id = h.id
left join (
  select household_id, sum(amount_cents) as paid_cents
    from public.payments group by household_id
) p on p.household_id = h.id;

revoke all on public.household_overview from anon, authenticated;

