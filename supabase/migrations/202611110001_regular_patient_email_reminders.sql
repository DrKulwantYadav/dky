-- Apply after 202611090001_regular_appointment_digest.sql.
-- A separate delivery ledger keeps patient reminders independent of staff digests.
begin;

alter table public.regular_appointment_digest_runs
  add column if not exists patient_reminders_prepared_at timestamptz,
  add column if not exists patient_reminders_no_email_count integer not null default 0;

create table public.regular_appointment_patient_reminder_deliveries (
  id uuid primary key default gen_random_uuid(),
  digest_date date not null references public.regular_appointment_digest_runs(digest_date) on delete restrict,
  registration_id uuid not null references public.regular_registrations(id) on delete restrict,
  recipient_email text not null,
  recipient_name text not null,
  appointment_date date not null,
  appointment_time time,
  appointment_time_window text,
  status text not null default 'pending'
    check (status in ('pending','processing','sent','failed','uncertain','skipped')),
  attempts integer not null default 0 check (attempts between 0 and 5),
  claim_token uuid,
  lease_until timestamptz,
  provider_id text,
  error_code text,
  last_attempt_at timestamptz,
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  unique (digest_date, registration_id)
);
create index regular_patient_reminder_status_idx
  on public.regular_appointment_patient_reminder_deliveries(digest_date, status);

alter table public.regular_appointment_patient_reminder_deliveries enable row level security;
revoke all on public.regular_appointment_patient_reminder_deliveries from public, anon, authenticated;
grant select on public.regular_appointment_patient_reminder_deliveries to authenticated;
grant select, insert, update on public.regular_appointment_patient_reminder_deliveries to service_role;
create policy regular_patient_reminders_staff_read
  on public.regular_appointment_patient_reminder_deliveries
  for select to authenticated using (public.is_active_admin());

-- The first call freezes recipients for this IST date. Later calls cannot add late bookings.
create function public.prepare_regular_patient_reminders(p_digest_date date)
returns boolean language plpgsql security definer set search_path = '' as $$
declare v_run public.regular_appointment_digest_runs%rowtype;
  v_no_email integer;
begin
  if auth.role() <> 'service_role' then raise exception 'Unauthorized' using errcode = '42501'; end if;
  select * into v_run from public.regular_appointment_digest_runs
    where digest_date = p_digest_date for update;
  if not found then raise exception 'Digest snapshot missing' using errcode = '22023'; end if;
  if v_run.patient_reminders_prepared_at is not null then return false; end if;

  insert into public.regular_appointment_patient_reminder_deliveries
    (digest_date, registration_id, recipient_email, recipient_name,
     appointment_date, appointment_time, appointment_time_window)
  select p_digest_date, r.id, lower(trim(r.requester_email)),
    coalesce(nullif(trim(r.requester_name), ''), p.full_name),
    r.preferred_date, r.preferred_time, r.preferred_time_window
  from public.regular_registrations r join public.patients p on p.id = r.patient_id
  where r.preferred_date = p_digest_date + 1
    and r.registration_status = 'Appointment Booked'
    and r.confirmation_status <> 'Rejected'
    and r.created_at <= v_run.cutoff_at and r.updated_at <= v_run.cutoff_at
    and r.requester_email is not null
    and trim(r.requester_email) ~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
  on conflict (digest_date, registration_id) do nothing;

  select count(*) into v_no_email from public.regular_registrations r
  where r.preferred_date = p_digest_date + 1
    and r.registration_status = 'Appointment Booked'
    and r.confirmation_status <> 'Rejected'
    and r.created_at <= v_run.cutoff_at and r.updated_at <= v_run.cutoff_at
    and (r.requester_email is null or trim(r.requester_email) !~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$');

  update public.regular_appointment_digest_runs
    set patient_reminders_prepared_at = now(), patient_reminders_no_email_count = v_no_email
    where digest_date = p_digest_date;
  return true;
end;
$$;
revoke all on function public.prepare_regular_patient_reminders(date) from public, anon, authenticated;
grant execute on function public.prepare_regular_patient_reminders(date) to service_role;

-- Claiming is serialized per delivery. The current booking is checked again before sending.
create function public.claim_regular_patient_reminder(p_id uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_delivery public.regular_appointment_patient_reminder_deliveries%rowtype;
  v_run public.regular_appointment_digest_runs%rowtype;
  v_claim uuid := gen_random_uuid();
begin
  if auth.role() <> 'service_role' then raise exception 'Unauthorized' using errcode = '42501'; end if;
  select * into v_delivery from public.regular_appointment_patient_reminder_deliveries
    where id = p_id for update;
  if not found then return null; end if;
  select * into v_run from public.regular_appointment_digest_runs
    where digest_date = v_delivery.digest_date;
  if (now() at time zone 'Asia/Kolkata')::date <> v_delivery.digest_date
    or v_delivery.status in ('sent','skipped') or v_delivery.attempts >= 5
    or (v_delivery.status = 'processing' and v_delivery.lease_until > now())
    or (v_delivery.attempts > 0 and now() > v_run.cutoff_at + interval '23 hours') then
    return null;
  end if;
  if not exists (
    select 1 from public.regular_registrations r join public.patients p on p.id = r.patient_id
    where r.id = v_delivery.registration_id
      and r.registration_status = 'Appointment Booked'
      and r.confirmation_status <> 'Rejected'
      and r.preferred_date = v_delivery.appointment_date
      and r.preferred_time is not distinct from v_delivery.appointment_time
      and r.preferred_time_window is not distinct from v_delivery.appointment_time_window
      and lower(trim(r.requester_email)) = v_delivery.recipient_email
      and coalesce(nullif(trim(r.requester_name), ''), p.full_name) = v_delivery.recipient_name
  ) then
    update public.regular_appointment_patient_reminder_deliveries
      set status = 'skipped', error_code = 'booking_changed', claim_token = null, lease_until = null
      where id = p_id;
    return null;
  end if;
  update public.regular_appointment_patient_reminder_deliveries
    set status = 'processing', attempts = attempts + 1, claim_token = v_claim,
        lease_until = now() + interval '2 minutes', last_attempt_at = now(), error_code = null
    where id = p_id;
  return jsonb_build_object('id',v_delivery.id,'claimToken',v_claim,
    'date',v_delivery.digest_date,'cutoffAt',v_run.cutoff_at,
    'recipientEmail',v_delivery.recipient_email,'recipientName',v_delivery.recipient_name,
    'appointmentDate',v_delivery.appointment_date,
    'appointmentTime',v_delivery.appointment_time,
    'appointmentTimeWindow',v_delivery.appointment_time_window,
    'senderEmail',v_run.sender_email);
end;
$$;
revoke all on function public.claim_regular_patient_reminder(uuid) from public, anon, authenticated;
grant execute on function public.claim_regular_patient_reminder(uuid) to service_role;

create function public.finish_regular_patient_reminder(
  p_id uuid, p_claim_token uuid, p_status text, p_provider_id text default null, p_error_code text default null
) returns boolean language plpgsql security definer set search_path = '' as $$
begin
  if auth.role() <> 'service_role' then raise exception 'Unauthorized' using errcode = '42501'; end if;
  if p_status not in ('sent','failed','uncertain') then
    raise exception 'Invalid reminder status' using errcode = '22023';
  end if;
  update public.regular_appointment_patient_reminder_deliveries
    set status = p_status, provider_id = case when p_status = 'sent' then p_provider_id else null end,
        error_code = case when p_status = 'sent' then null else left(coalesce(p_error_code,'unknown'),80) end,
        sent_at = case when p_status = 'sent' then now() else null end,
        claim_token = null, lease_until = null
    where id = p_id and status = 'processing' and claim_token = p_claim_token;
  return found;
end;
$$;
revoke all on function public.finish_regular_patient_reminder(uuid,uuid,text,text,text) from public, anon, authenticated;
grant execute on function public.finish_regular_patient_reminder(uuid,uuid,text,text,text) to service_role;
commit;
