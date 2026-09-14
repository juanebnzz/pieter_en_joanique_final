-- Dinokeng conservation fee, tracked apart from the accommodation.
-- It is a COMPONENT of amount_due_cents (already included in the total the
-- guest pays), stored separately so the admin can see who still owes their
-- R100 and how much the couple must pass on to the reserve. Declines hold 0.
alter table public.households
  add column conservation_fee_cents integer not null default 0
    check (conservation_fee_cents >= 0),
  add constraint households_fee_within_due
    check (conservation_fee_cents <= amount_due_cents);

-- household_overview selects h.* which is expanded at creation time — recreate it.
-- The fee is treated as the last part of the total to be settled, so it counts
-- as paid only once the household has paid in full.
drop view public.household_overview;
create view public.household_overview
with (security_invoker = true) as
select
  h.*,
  coalesce(g.guest_count, 0)      as guest_count,
  coalesce(g.attending_count, 0)  as attending_count,
  coalesce(g.child_count, 0)      as child_count,
  coalesce(p.paid_cents, 0)       as paid_cents,
  greatest(h.amount_due_cents - coalesce(p.paid_cents, 0), 0) as outstanding_cents,
  least(h.conservation_fee_cents,
        greatest(h.amount_due_cents - coalesce(p.paid_cents, 0), 0)) as conservation_fee_outstanding_cents
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
