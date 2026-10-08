-- Keep details submitted for an appointment with the individual request.
-- The patients table is keyed by phone, which may be shared by family members.
alter table public.regular_registrations
  add column if not exists requester_name text,
  add column if not exists requester_email text,
  add column if not exists age_group text,
  add column if not exists patient_type text,
  add column if not exists preferred_time_window text,
  add column if not exists consent_at timestamptz;

create or replace function public.submit_public_appointment_request(
  p_full_name text,
  p_phone text,
  p_email text,
  p_age_group text,
  p_patient_type text,
  p_consultation_mode text,
  p_preferred_date date,
  p_preferred_time_window text,
  p_reason text,
  p_consent boolean
) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  v_name text := trim(regexp_replace(coalesce(p_full_name, ''), '\s+', ' ', 'g'));
  v_phone text := regexp_replace(coalesce(p_phone, ''), '[^0-9]', '', 'g');
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
     coalesce(p_consultation_mode, '') <> 'In-person consultation' or
     coalesce(p_preferred_time_window, '') not in ('Morning', 'Afternoon', 'Evening', 'Any available time') or
     coalesce(p_reason, '') not in ('Diabetes', 'Blood pressure', 'Fatty liver', 'Weight management', 'Fever or infection', 'Respiratory problem', 'Digestive problem', 'Headache', 'Seizure follow-up', 'Kidney-related concern', 'Report review', 'Other medical concern') or
     p_preferred_date is null or p_preferred_date < current_date or p_preferred_date > current_date + 365 then
    raise exception 'Invalid appointment preferences';
  end if;

  insert into public.patients (full_name, phone, source, landing_page)
  values (v_name, v_phone, 'Website', '/book-appointment')
  on conflict (phone) do update set last_contact_at = now()
  returning id into v_patient_id;

  insert into public.regular_registrations
    (patient_id, requester_name, requester_email, age_group, patient_type, consultation_type,
     preferred_date, preferred_time_window, reason_for_visit, consent_at, registration_status, confirmation_status, source)
  values
    (v_patient_id, v_name, nullif(trim(coalesce(p_email, '')), ''), p_age_group, p_patient_type,
     p_consultation_mode, p_preferred_date, p_preferred_time_window, p_reason, now(),
     'New', 'Pending', 'Website')
  returning id into v_registration_id;

  return v_registration_id;
end;
$$;

revoke all on function public.submit_public_appointment_request(text, text, text, text, text, text, date, text, text, boolean) from public;
grant execute on function public.submit_public_appointment_request(text, text, text, text, text, text, date, text, text, boolean) to anon, authenticated;
