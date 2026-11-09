-- Additive migration. Apply only after checking that public.is_active_admin() exists.
-- Public visitors cannot read or write these health-related leads directly.
begin;
create table public.findrisc_leads (
  id uuid primary key default gen_random_uuid(),
  submission_key uuid not null unique,
  payload_hash text not null check (payload_hash ~ '^[a-f0-9]{64}$'),
  attendee_name text not null check (char_length(attendee_name) between 2 and 120),
  contact_phone text check (contact_phone is null or contact_phone ~ '^[6-9][0-9]{9}$'),
  contact_email text check (contact_email is null or char_length(contact_email) <= 254),
  answers jsonb not null,
  score smallint not null check (score between 0 and 26),
  risk_tier text not null check (risk_tier in ('low','slightlyElevated','moderate','high','veryHigh')),
  consented_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  constraint findrisc_lead_contact_required check (contact_phone is not null or contact_email is not null)
);
create index findrisc_leads_created_idx on public.findrisc_leads(created_at desc);
alter table public.findrisc_leads enable row level security;
revoke all on public.findrisc_leads from public, anon, authenticated;
grant select on public.findrisc_leads to authenticated;
grant select, insert on public.findrisc_leads to service_role;
create policy findrisc_leads_staff_read on public.findrisc_leads
  for select to authenticated using (public.is_active_admin());

create table public.findrisc_rate_limits (
  key_hash text primary key,
  window_started_at timestamptz not null,
  attempts integer not null
);
alter table public.findrisc_rate_limits enable row level security;
revoke all on public.findrisc_rate_limits from public, anon, authenticated;
grant select, insert, update on public.findrisc_rate_limits to service_role;

create function public.consume_findrisc_rate_limit(p_key_hash text, p_limit integer, p_window_seconds integer)
returns boolean language plpgsql security definer set search_path = '' as $$
declare v_attempts integer;
begin
  if auth.role() <> 'service_role' then raise exception 'Unauthorized' using errcode='42501'; end if;
  if p_key_hash !~ '^[a-f0-9]{64}$' or p_limit not between 1 and 100 or p_window_seconds not between 60 and 86400 then
    raise exception 'Invalid rate limit parameters' using errcode='22023';
  end if;
  insert into public.findrisc_rate_limits(key_hash,window_started_at,attempts) values(p_key_hash,now(),1)
  on conflict(key_hash) do update set
    window_started_at=case when public.findrisc_rate_limits.window_started_at < now() - make_interval(secs=>p_window_seconds)
      then now() else public.findrisc_rate_limits.window_started_at end,
    attempts=case when public.findrisc_rate_limits.window_started_at < now() - make_interval(secs=>p_window_seconds)
      then 1 else public.findrisc_rate_limits.attempts+1 end
  returning attempts into v_attempts;
  return v_attempts <= p_limit;
end;
$$;
revoke all on function public.consume_findrisc_rate_limit(text,integer,integer) from public, anon, authenticated;
grant execute on function public.consume_findrisc_rate_limit(text,integer,integer) to service_role;
commit;
