-- Apply after 202610040002_regular_appointment_requests.sql.
-- Availability and capacity are enforced inside the database, including concurrent bookings.

create table public.appointment_slots (
  id uuid primary key default gen_random_uuid(),
  slot_date date not null,
  start_time time not null,
  is_open boolean not null default true,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (slot_date, start_time),
  constraint appointment_slots_half_hour check (
    start_time >= time '08:00' and start_time <= time '21:30'
    and extract(minute from start_time) in (0, 30)
    and extract(second from start_time) = 0
  )
);

create index appointment_slots_date_open_idx on public.appointment_slots(slot_date, is_open, start_time);
create trigger appointment_slots_updated before update on public.appointment_slots
  for each row execute function public.set_updated_at();

alter table public.regular_registrations
  add column if not exists appointment_slot_id uuid references public.appointment_slots(id) on delete restrict,
  add column if not exists fee_inr integer;
create index regular_registrations_slot_idx on public.regular_registrations(appointment_slot_id, registration_status);

alter table public.appointment_slots enable row level security;
revoke all on public.appointment_slots from anon;
grant select, insert, update on public.appointment_slots to authenticated;
create policy appointment_slots_admin_read on public.appointment_slots for select to authenticated
  using (public.is_active_admin());
create policy appointment_slots_admin_insert on public.appointment_slots for insert to authenticated
  with check (public.is_active_admin(array['super_admin','admin']::public.admin_role[]));
create policy appointment_slots_admin_update on public.appointment_slots for update to authenticated
  using (public.is_active_admin(array['super_admin','admin']::public.admin_role[]))
  with check (public.is_active_admin(array['super_admin','admin']::public.admin_role[]));

create or replace function public.list_public_appointment_slots(p_date date)
returns table (slot_id uuid, start_time time)
language sql stable security definer set search_path = '' as $$
  select s.id, s.start_time
  from public.appointment_slots s
  left join public.regular_registrations r
    on r.appointment_slot_id = s.id and r.registration_status <> 'Cancelled'
  where s.slot_date = p_date and s.is_open
    and p_date between (now() at time zone 'Asia/Kolkata')::date
      and (now() at time zone 'Asia/Kolkata')::date + 365
    and s.slot_date + s.start_time > (now() at time zone 'Asia/Kolkata')
  group by s.id, s.start_time
  having count(r.id) < 4
  order by s.start_time;
$$;
revoke all on function public.list_public_appointment_slots(date) from public;
grant execute on function public.list_public_appointment_slots(date) to anon, authenticated;

create or replace function public.list_admin_appointment_slots(p_from date, p_to date)
returns table (slot_id uuid, slot_date date, start_time time, is_open boolean, booked_count bigint)
language sql stable security invoker set search_path = '' as $$
  select s.id, s.slot_date, s.start_time, s.is_open, count(r.id)
  from public.appointment_slots s
  left join public.regular_registrations r
    on r.appointment_slot_id = s.id and r.registration_status <> 'Cancelled'
  where s.slot_date between p_from and p_to
  group by s.id, s.slot_date, s.start_time, s.is_open
  order by s.slot_date, s.start_time;
$$;
revoke all on function public.list_admin_appointment_slots(date, date) from public;
grant execute on function public.list_admin_appointment_slots(date, date) to authenticated;

create or replace function public.book_public_appointment_slot(
  p_slot_id uuid,
  p_full_name text,
  p_phone text,
  p_email text,
  p_age_group text,
  p_patient_type text,
  p_reason text,
  p_consent boolean
) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  v_name text := trim(regexp_replace(coalesce(p_full_name, ''), '\s+', ' ', 'g'));
  v_phone text := regexp_replace(coalesce(p_phone, ''), '[^0-9]', '', 'g');
  v_slot public.appointment_slots%rowtype;
  v_patient_id uuid;
  v_registration_id uuid;
begin
  if v_phone ~ '^91[6-9][0-9]{9}$' then v_phone := right(v_phone, 10); end if;
  if char_length(v_name) not between 2 and 120 or v_phone !~ '^[6-9][0-9]{9}$' then
    raise exception 'Invalid appointment details';
  end if;
  if p_consent is distinct from true then raise exception 'Consent is required'; end if;
  if char_length(coalesce(p_email, '')) > 254 or
     (nullif(trim(coalesce(p_email, '')), '') is not null and trim(p_email) !~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$') then
    raise exception 'Invalid email';
  end if;
  if coalesce(p_age_group, '') not in ('18–29 years', '30–44 years', '45–59 years', '60–74 years', '75 years or above') or
     coalesce(p_patient_type, '') not in ('New patient', 'Follow-up patient') or
     coalesce(p_reason, '') not in ('Diabetes', 'Blood pressure', 'Fatty liver', 'Weight management', 'Fever or infection', 'Respiratory problem', 'Digestive problem', 'Headache', 'Seizure follow-up', 'Kidney-related concern', 'Report review', 'Other medical concern') then
    raise exception 'Invalid appointment preferences';
  end if;

  select * into v_slot from public.appointment_slots where id = p_slot_id for update;
  if not found or not v_slot.is_open or
     v_slot.slot_date not between (now() at time zone 'Asia/Kolkata')::date
       and (now() at time zone 'Asia/Kolkata')::date + 365 or
     v_slot.slot_date + v_slot.start_time <= (now() at time zone 'Asia/Kolkata') then
    raise exception 'This appointment time is no longer available' using errcode = 'P0002';
  end if;
  if (select count(*) from public.regular_registrations r
      where r.appointment_slot_id = p_slot_id and r.registration_status <> 'Cancelled') >= 4 then
    raise exception 'This appointment time is full' using errcode = 'P0002';
  end if;

  insert into public.patients (full_name, phone, source, landing_page)
  values (v_name, v_phone, 'Website', '/book-appointment')
  on conflict (phone) do update set last_contact_at = now()
  returning id into v_patient_id;

  if exists (select 1 from public.regular_registrations r
      where r.appointment_slot_id = p_slot_id and r.patient_id = v_patient_id
        and lower(r.requester_name) = lower(v_name) and r.registration_status <> 'Cancelled') then
    raise exception 'This patient already requested this appointment time' using errcode = 'P0002';
  end if;

  insert into public.regular_registrations
    (patient_id, requester_name, requester_email, age_group, patient_type, consultation_type,
     preferred_date, preferred_time, preferred_time_window, reason_for_visit, appointment_slot_id,
     fee_inr, consent_at, registration_status, confirmation_status, source)
  values
    (v_patient_id, v_name, nullif(trim(coalesce(p_email, '')), ''), p_age_group, p_patient_type,
     'In-person consultation', v_slot.slot_date, v_slot.start_time, null, p_reason, v_slot.id,
     499, now(), 'New', 'Pending', 'Website')
  returning id into v_registration_id;
  return v_registration_id;
end;
$$;
revoke all on function public.book_public_appointment_slot(uuid, text, text, text, text, text, text, boolean) from public;
grant execute on function public.book_public_appointment_slot(uuid, text, text, text, text, text, text, boolean) to anon, authenticated;

-- The earlier date/time-window endpoint must not bypass the new capacity rule.
revoke execute on function public.submit_public_appointment_request(text, text, text, text, text, text, date, text, text, boolean) from anon, authenticated;

-- If an admin reactivates a cancelled request, it must still fit in the slot.
create or replace function public.guard_appointment_reactivation()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.appointment_slot_id is not null and old.registration_status = 'Cancelled'
     and new.registration_status <> 'Cancelled' then
    perform 1 from public.appointment_slots where id = new.appointment_slot_id for update;
    if (select count(*) from public.regular_registrations r
        where r.appointment_slot_id = new.appointment_slot_id
          and r.id <> new.id and r.registration_status <> 'Cancelled') >= 4 then
      raise exception 'This appointment time is full';
    end if;
  end if;
  return new;
end;
$$;
create trigger regular_registration_slot_reactivation
  before update of registration_status on public.regular_registrations
  for each row execute function public.guard_appointment_reactivation();
