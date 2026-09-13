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
