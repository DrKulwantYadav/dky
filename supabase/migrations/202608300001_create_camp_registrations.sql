create table if not exists public.camp_registrations (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 80),
  age smallint not null check (age between 1 and 120),
  mobile text not null check (char_length(mobile) between 10 and 18),
  registration_for text not null check (registration_for in ('self', 'parent', 'sibling', 'other')),
  status text not null default 'new' check (status in ('new', 'contacted', 'confirmed', 'attended', 'cancelled')),
  created_at timestamptz not null default now()
);

alter table public.camp_registrations enable row level security;

grant insert on table public.camp_registrations to anon, authenticated;

create policy "Visitors can submit camp registrations"
on public.camp_registrations
for insert
to anon, authenticated
with check (true);

create index if not exists camp_registrations_created_at_idx
on public.camp_registrations (created_at desc);
