create extension if not exists pgcrypto;

create type public.admin_role as enum ('super_admin', 'admin', 'staff');
create type public.marketing_source as enum ('WhatsApp Organic', 'Meta Ads', 'Google Ads', 'Website', 'QR Code', 'Referral', 'Walk-in', 'Other');
create type public.confirmation_status as enum ('Pending', 'Confirmed', 'Rejected');
create type public.camp_registration_status as enum ('New', 'Registered', 'Cancelled');
create type public.reminder_status as enum ('Not Scheduled', 'Scheduled', 'Sent', 'Failed', 'Cancelled');
create type public.attendance_status as enum ('Pending', 'Attended', 'No-show', 'Cancelled');
create type public.regular_registration_status as enum ('New', 'Contacted', 'Confirmed', 'Appointment Booked', 'Completed', 'Cancelled', 'No-show');

create table public.admin_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  role public.admin_role not null default 'staff',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.patients (
  id uuid primary key default gen_random_uuid(),
  full_name text not null check (char_length(full_name) between 2 and 120),
  phone text not null,
  country_code text not null default '+91',
  age smallint check (age between 0 and 120),
  gender text check (gender is null or gender in ('Female', 'Male', 'Other', 'Prefer not to say')),
  city text,
  area text,
  source public.marketing_source not null default 'Website',
  campaign_name text,
  campaign_id text,
  adset_id text,
  ad_id text,
  landing_page text,
  referral_source text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_content text,
  utm_term text,
  first_contact_at timestamptz not null default now(),
  last_contact_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint patients_phone_unique unique (phone)
);

create table public.camps (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  hospital_name text not null default 'Gopinath Hospital',
  address text not null,
  start_date date not null,
  end_date date not null,
  registration_open boolean not null default true,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (end_date >= start_date)
);

create table public.camp_sessions (
  id uuid primary key default gen_random_uuid(),
  camp_id uuid not null references public.camps(id) on delete cascade,
  session_date date not null,
  start_time time not null,
  end_time time not null,
  maximum_capacity integer check (maximum_capacity is null or maximum_capacity > 0),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (camp_id, session_date),
  check (end_time > start_time)
);

create table public.camp_registrations (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete restrict,
  camp_id uuid not null references public.camps(id) on delete restrict,
  camp_session_id uuid references public.camp_sessions(id) on delete set null,
  registration_for text not null default 'self' check (registration_for in ('self', 'parent', 'sibling', 'other')),
  registration_status public.camp_registration_status not null default 'New',
  confirmation_status public.confirmation_status not null default 'Pending',
  reminder_status public.reminder_status not null default 'Not Scheduled',
  attendance_status public.attendance_status not null default 'Pending',
  confirmation_template text,
  confirmation_sent_at timestamptz,
  confirmation_response text,
  confirmed_at timestamptz,
  reminder_sent_at timestamptz,
  attended_at timestamptz,
  source public.marketing_source not null default 'Website',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.regular_registrations (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete restrict,
  consultation_type text not null,
  doctor text not null default 'Dr. Kulwant Yadav',
  preferred_date date,
  preferred_time time,
  reason_for_visit text,
  notes text,
  registration_status public.regular_registration_status not null default 'New',
  confirmation_status public.confirmation_status not null default 'Pending',
  confirmation_template text,
  confirmation_sent_at timestamptz,
  confirmation_response text,
  source public.marketing_source not null default 'Website',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.reminders (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  camp_registration_id uuid references public.camp_registrations(id) on delete cascade,
  regular_registration_id uuid references public.regular_registrations(id) on delete cascade,
  registration_type text not null check (registration_type in ('camp', 'regular')),
  reminder_type text not null check (reminder_type in ('Registration Confirmation', '1 Day Before', 'Camp Morning', 'Appointment Reminder', 'Follow-up')),
  scheduled_at timestamptz,
  sent_at timestamptz,
  status public.reminder_status not null default 'Not Scheduled',
  error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    (registration_type = 'camp' and camp_registration_id is not null and regular_registration_id is null)
    or (registration_type = 'regular' and regular_registration_id is not null and camp_registration_id is null)
  )
);

create table public.admin_activity_logs (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid not null references public.admin_profiles(id) on delete restrict,
  action text not null,
  patient_id uuid references public.patients(id) on delete set null,
  registration_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.system_logs (
  id uuid primary key default gen_random_uuid(),
  integration text not null,
  event text not null,
  error text,
  payload jsonb,
  created_at timestamptz not null default now()
);

create index patients_phone_idx on public.patients(phone);
create index patients_name_idx on public.patients using gin (to_tsvector('simple', full_name));
create index patients_location_idx on public.patients(city, area);
create index camp_sessions_camp_date_idx on public.camp_sessions(camp_id, session_date);
create index camp_registrations_patient_idx on public.camp_registrations(patient_id);
create index camp_registrations_camp_idx on public.camp_registrations(camp_id, camp_session_id);
create index camp_registrations_created_idx on public.camp_registrations(created_at desc);
create index camp_registrations_status_idx on public.camp_registrations(confirmation_status, attendance_status, reminder_status);
create index regular_registrations_patient_idx on public.regular_registrations(patient_id);
create index regular_registrations_created_idx on public.regular_registrations(created_at desc);
create index regular_registrations_status_idx on public.regular_registrations(registration_status, confirmation_status);
create index reminders_schedule_idx on public.reminders(status, scheduled_at);
create index activity_logs_created_idx on public.admin_activity_logs(created_at desc);

create or replace function public.set_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger admin_profiles_updated before update on public.admin_profiles for each row execute function public.set_updated_at();
create trigger patients_updated before update on public.patients for each row execute function public.set_updated_at();
create trigger camps_updated before update on public.camps for each row execute function public.set_updated_at();
create trigger camp_sessions_updated before update on public.camp_sessions for each row execute function public.set_updated_at();
create trigger camp_registrations_updated before update on public.camp_registrations for each row execute function public.set_updated_at();
create trigger regular_registrations_updated before update on public.regular_registrations for each row execute function public.set_updated_at();
create trigger reminders_updated before update on public.reminders for each row execute function public.set_updated_at();

create or replace function public.is_active_admin(required_roles public.admin_role[] default array['super_admin','admin','staff']::public.admin_role[])
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.admin_profiles
    where id = auth.uid() and active = true and role = any(required_roles)
  );
$$;

revoke all on function public.is_active_admin(public.admin_role[]) from public;
grant execute on function public.is_active_admin(public.admin_role[]) to authenticated;

create or replace function public.submit_public_camp_registration(
  p_full_name text,
  p_age smallint,
  p_phone text,
  p_registration_for text
) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  v_phone text;
  v_patient_id uuid;
  v_camp_id uuid;
  v_registration_id uuid;
begin
  v_phone := regexp_replace(coalesce(p_phone, ''), '[^0-9+]', '', 'g');
  if char_length(trim(p_full_name)) < 2 or p_age < 1 or p_age > 120 or char_length(v_phone) < 10 then
    raise exception 'Invalid registration details';
  end if;
  if p_registration_for not in ('self', 'parent', 'sibling', 'other') then
    raise exception 'Invalid registration relationship';
  end if;

  select id into v_camp_id from public.camps
  where active and registration_open and current_date between start_date and end_date
  order by start_date limit 1;
  if v_camp_id is null then
    select id into v_camp_id from public.camps where active and registration_open order by start_date limit 1;
  end if;
  if v_camp_id is null then raise exception 'Registration is not open'; end if;

  insert into public.patients (full_name, phone, age, source, landing_page)
  values (trim(p_full_name), v_phone, p_age, 'Website', '/world-heart-day-free-ecg-camp')
  on conflict (phone) do update set
    full_name = excluded.full_name,
    age = coalesce(excluded.age, public.patients.age),
    last_contact_at = now()
  returning id into v_patient_id;

  insert into public.camp_registrations (patient_id, camp_id, registration_for, registration_status, source)
  values (v_patient_id, v_camp_id, p_registration_for, 'Registered', 'Website')
  returning id into v_registration_id;
  return v_registration_id;
end;
$$;

revoke all on function public.submit_public_camp_registration(text, smallint, text, text) from public;
grant execute on function public.submit_public_camp_registration(text, smallint, text, text) to anon, authenticated;

alter table public.admin_profiles enable row level security;
alter table public.patients enable row level security;
alter table public.camps enable row level security;
alter table public.camp_sessions enable row level security;
alter table public.camp_registrations enable row level security;
alter table public.regular_registrations enable row level security;
alter table public.reminders enable row level security;
alter table public.admin_activity_logs enable row level security;
alter table public.system_logs enable row level security;

create policy admin_profiles_self_read on public.admin_profiles for select to authenticated using (id = auth.uid() or public.is_active_admin(array['super_admin']::public.admin_role[]));
create policy admin_profiles_super_manage on public.admin_profiles for all to authenticated using (public.is_active_admin(array['super_admin']::public.admin_role[])) with check (public.is_active_admin(array['super_admin']::public.admin_role[]));

create policy patients_admin_read on public.patients for select to authenticated using (public.is_active_admin());
create policy patients_admin_write on public.patients for all to authenticated using (public.is_active_admin(array['super_admin','admin']::public.admin_role[])) with check (public.is_active_admin(array['super_admin','admin']::public.admin_role[]));
create policy camps_admin_read on public.camps for select to authenticated using (public.is_active_admin());
create policy camps_admin_write on public.camps for all to authenticated using (public.is_active_admin(array['super_admin','admin']::public.admin_role[])) with check (public.is_active_admin(array['super_admin','admin']::public.admin_role[]));
create policy sessions_admin_read on public.camp_sessions for select to authenticated using (public.is_active_admin());
create policy sessions_admin_write on public.camp_sessions for all to authenticated using (public.is_active_admin(array['super_admin','admin']::public.admin_role[])) with check (public.is_active_admin(array['super_admin','admin']::public.admin_role[]));
create policy camp_registrations_admin_read on public.camp_registrations for select to authenticated using (public.is_active_admin());
create policy camp_registrations_admin_write on public.camp_registrations for all to authenticated using (public.is_active_admin(array['super_admin','admin']::public.admin_role[])) with check (public.is_active_admin(array['super_admin','admin']::public.admin_role[]));
create policy regular_registrations_admin_read on public.regular_registrations for select to authenticated using (public.is_active_admin());
create policy regular_registrations_admin_write on public.regular_registrations for all to authenticated using (public.is_active_admin(array['super_admin','admin']::public.admin_role[])) with check (public.is_active_admin(array['super_admin','admin']::public.admin_role[]));
create policy reminders_admin_read on public.reminders for select to authenticated using (public.is_active_admin());
create policy reminders_admin_write on public.reminders for all to authenticated using (public.is_active_admin(array['super_admin','admin']::public.admin_role[])) with check (public.is_active_admin(array['super_admin','admin']::public.admin_role[]));
create policy activity_admin_read on public.admin_activity_logs for select to authenticated using (public.is_active_admin(array['super_admin','admin']::public.admin_role[]));
create policy activity_admin_insert on public.admin_activity_logs for insert to authenticated with check (admin_id = auth.uid() and public.is_active_admin());
create policy system_logs_super_only on public.system_logs for select to authenticated using (public.is_active_admin(array['super_admin']::public.admin_role[]));

insert into public.camps (id, name, description, hospital_name, address, start_date, end_date)
values (
  'ec920026-0000-4000-8000-000000000001',
  'Free ECG & Heart Checkup Camp',
  'World Heart Day initiative offering free ECG and heart-risk screening.',
  'Gopinath Hospital',
  'Bhiwadi, Rajasthan',
  '2026-09-01',
  '2026-09-29'
);

insert into public.camp_sessions (camp_id, session_date, start_time, end_time, maximum_capacity)
values
  ('ec920026-0000-4000-8000-000000000001', '2026-09-06', '09:00', '13:00', 150),
  ('ec920026-0000-4000-8000-000000000001', '2026-09-13', '09:00', '13:00', 150),
  ('ec920026-0000-4000-8000-000000000001', '2026-09-20', '09:00', '13:00', 150),
  ('ec920026-0000-4000-8000-000000000001', '2026-09-27', '09:00', '13:00', 150);
