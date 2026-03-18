-- Allow gift recipients to read their own redeemed gift (for trial banner)
alter table scout_gifts enable row level security;

drop policy if exists "Recipients can read own redeemed gift" on scout_gifts;
create policy "Recipients can read own redeemed gift"
  on scout_gifts for select
  using (redeemed_by = auth.uid());
