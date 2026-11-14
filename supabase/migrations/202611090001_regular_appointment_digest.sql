-- Additive nightly regular-appointment digest. Apply after appointment_slots.sql.
-- Patient snapshots are readable only by active clinic admins and the service role.
begin;

create table public.regular_appointment_digest_runs (
  digest_date date primary key,
  cutoff_at timestamptz not null,
  sender_email text not null,
  today_requests jsonb not null,
  tomorrow_requests jsonb not null,
  created_at timestamptz not null default now(),
  constraint digest_today_array check (jsonb_typeof(today_requests) = 'array'),
  constraint digest_tomorrow_array check (jsonb_typeof(tomorrow_requests) = 'array')
);

create table public.regular_appointment_digest_deliveries (
  id uuid primary key default gen_random_uuid(),
  digest_date date not null references public.regular_appointment_digest_runs(digest_date) on delete restrict,
  recipient_user_id uuid not null references auth.users(id) on delete restrict,
  recipient_email text not null,
  status text not null default 'pending' check (status in ('pending','processing','sent','failed','uncertain')),
  attempts integer not null default 0 check (attempts between 0 and 5),
  claim_token uuid,
  lease_until timestamptz,
  provider_id text,
  error_code text,
  last_attempt_at timestamptz,
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  unique (digest_date, recipient_user_id)
);
create index regular_digest_delivery_status_idx on public.regular_appointment_digest_deliveries(digest_date, status);

alter table public.regular_appointment_digest_runs enable row level security;
alter table public.regular_appointment_digest_deliveries enable row level security;
revoke all on public.regular_appointment_digest_runs from public, anon, authenticated;
revoke all on public.regular_appointment_digest_deliveries from public, anon, authenticated;
grant select on public.regular_appointment_digest_runs, public.regular_appointment_digest_deliveries to authenticated;
grant select, insert, update on public.regular_appointment_digest_runs, public.regular_appointment_digest_deliveries to service_role;
create policy regular_digest_runs_staff_read on public.regular_appointment_digest_runs
  for select to authenticated using (public.is_active_admin());
create policy regular_digest_deliveries_staff_read on public.regular_appointment_digest_deliveries
  for select to authenticated using (public.is_active_admin());

-- One transaction freezes today's and tomorrow's lists and the active recipients.
-- A second invocation on the same IST date reuses the original snapshot.
create function public.prepare_regular_appointment_digest(p_sender_email text)
returns date language plpgsql security definer set search_path = '' as $$
declare v_date date := (now() at time zone 'Asia/Kolkata')::date;
  v_cutoff timestamptz := now();
  v_start timestamptz := v_date::timestamp at time zone 'Asia/Kolkata';
  v_created_count integer;
begin
  if auth.role() <> 'service_role' then raise exception 'Unauthorized' using errcode = '42501'; end if;
  if p_sender_email is null or p_sender_email !~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' then
    raise exception 'Invalid sender email' using errcode = '22023';
  end if;
  if not exists (
    select 1 from public.admin_profiles p join auth.users u on u.id = p.id
    where p.active and u.email_confirmed_at is not null
      and u.email ~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
  ) then raise exception 'No active admin recipient with a verified email'; end if;

  insert into public.regular_appointment_digest_runs(digest_date,cutoff_at,sender_email,today_requests,tomorrow_requests)
  values (
    v_date,
    v_cutoff,
    lower(trim(p_sender_email)),
    coalesce((
      select jsonb_agg(jsonb_build_object(
        'name',coalesce(nullif(r.requester_name,''),p.full_name),
        'phone',p.phone,'preferredDate',r.preferred_date,
        'preferredTime',r.preferred_time,'preferredTimeWindow',r.preferred_time_window,
        'registrationStatus',r.registration_status,'confirmationStatus',r.confirmation_status
      ) order by r.created_at,r.id)
      from public.regular_registrations r join public.patients p on p.id = r.patient_id
      where r.created_at >= v_start and r.created_at <= v_cutoff
    ), '[]'::jsonb),
    coalesce((
      select jsonb_agg(jsonb_build_object(
        'name',coalesce(nullif(r.requester_name,''),p.full_name),
        'phone',p.phone,'preferredDate',r.preferred_date,
        'preferredTime',r.preferred_time,'preferredTimeWindow',r.preferred_time_window,
        'registrationStatus',r.registration_status,'confirmationStatus',r.confirmation_status
      ) order by r.preferred_time nulls last,r.created_at,r.id)
      from public.regular_registrations r join public.patients p on p.id = r.patient_id
      where r.preferred_date = v_date + 1 and r.created_at <= v_cutoff
    ), '[]'::jsonb)
  ) on conflict(digest_date) do nothing;
  get diagnostics v_created_count = row_count;

  if v_created_count = 1 then
    insert into public.regular_appointment_digest_deliveries(digest_date,recipient_user_id,recipient_email)
    select v_date,p.id,lower(trim(u.email))
    from public.admin_profiles p join auth.users u on u.id = p.id
    where p.active and u.email_confirmed_at is not null
      and u.email ~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
    on conflict(digest_date,recipient_user_id) do nothing;
  end if;
  return v_date;
end;
$$;
revoke all on function public.prepare_regular_appointment_digest(text) from public, anon, authenticated;
grant execute on function public.prepare_regular_appointment_digest(text) to service_role;

create function public.claim_regular_appointment_digest(p_id uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_delivery public.regular_appointment_digest_deliveries%rowtype;
  v_run public.regular_appointment_digest_runs%rowtype;
  v_claim uuid := gen_random_uuid();
begin
  if auth.role() <> 'service_role' then raise exception 'Unauthorized' using errcode = '42501'; end if;
  select d.* into v_delivery from public.regular_appointment_digest_deliveries d
    where d.id = p_id for update;
  if not found then return null; end if;
  select * into v_run from public.regular_appointment_digest_runs where digest_date = v_delivery.digest_date;
  if v_delivery.status = 'sent' or v_delivery.attempts >= 5 or
     (v_delivery.status = 'processing' and v_delivery.lease_until > now()) or
     (v_delivery.attempts > 0 and now() > v_run.cutoff_at + interval '23 hours') then
    return null;
  end if;
  if not exists (
    select 1 from public.admin_profiles p join auth.users u on u.id = p.id
    where p.id = v_delivery.recipient_user_id and p.active
      and u.email_confirmed_at is not null and lower(trim(u.email)) = v_delivery.recipient_email
  ) then
    update public.regular_appointment_digest_deliveries
      set status = 'failed', attempts = 5, error_code = 'recipient_inactive', claim_token = null, lease_until = null
      where id = p_id;
    return null;
  end if;
  update public.regular_appointment_digest_deliveries
    set status = 'processing', attempts = attempts + 1, claim_token = v_claim,
        lease_until = now() + interval '2 minutes', last_attempt_at = now(), error_code = null
    where id = p_id;
  return jsonb_build_object('id',v_delivery.id,'claimToken',v_claim,
    'date',v_run.digest_date,'cutoffAt',v_run.cutoff_at,
    'senderEmail',v_run.sender_email,
    'todayRequests',v_run.today_requests,'tomorrowRequests',v_run.tomorrow_requests,
    'recipientEmail',v_delivery.recipient_email);
end;
$$;
revoke all on function public.claim_regular_appointment_digest(uuid) from public, anon, authenticated;
grant execute on function public.claim_regular_appointment_digest(uuid) to service_role;

create function public.finish_regular_appointment_digest(
  p_id uuid, p_claim_token uuid, p_status text, p_provider_id text default null, p_error_code text default null
) returns boolean language plpgsql security definer set search_path = '' as $$
begin
  if auth.role() <> 'service_role' then raise exception 'Unauthorized' using errcode = '42501'; end if;
  if p_status not in ('sent','failed','uncertain') then
    raise exception 'Invalid digest status' using errcode = '22023';
  end if;
  update public.regular_appointment_digest_deliveries
    set status = p_status, provider_id = case when p_status = 'sent' then p_provider_id else null end,
        error_code = case when p_status = 'sent' then null else left(coalesce(p_error_code,'unknown'),80) end,
        sent_at = case when p_status = 'sent' then now() else null end,
        claim_token = null, lease_until = null
    where id = p_id and status = 'processing' and claim_token = p_claim_token;
  return found;
end;
$$;
revoke all on function public.finish_regular_appointment_digest(uuid,uuid,text,text,text) from public, anon, authenticated;
grant execute on function public.finish_regular_appointment_digest(uuid,uuid,text,text,text) to service_role;
commit;
