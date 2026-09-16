-- Invite codes were never used: guests RSVP by name, and the admin found the
-- field confusing. Drop it. household_overview selects h.* which is expanded at
-- creation time, so it must be recreated without the column.
drop view public.household_overview;
alter table public.households drop column invite_code;

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
