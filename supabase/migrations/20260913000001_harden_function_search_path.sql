-- Pin search_path on trigger/helper functions (Supabase security advisor 0011).
alter function public.set_updated_at() set search_path = '';
alter function public.recompute_payment_status(uuid) set search_path = '';
alter function public.payments_recompute_trigger() set search_path = '';
alter function public.households_due_changed_trigger() set search_path = '';
