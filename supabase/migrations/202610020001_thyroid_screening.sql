-- Run before enabling the thyroid landing page in production.
-- This campaign uses the existing patients / camps / camp_registrations CRM.
alter table public.camp_registrations
  add column if not exists participant_name text,
  add column if not exists participant_age smallint,
  add column if not exists campaign_attribution jsonb not null default '{}'::jsonb;

alter table public.camp_registrations drop constraint if exists camp_registrations_registration_for_check;
alter table public.camp_registrations add constraint camp_registrations_registration_for_check
  check (registration_for in ('self', 'parent', 'sibling', 'spouse', 'family', 'other'));

insert into public.camps (id, name, description, hospital_name, address, start_date, end_date, registration_open, active)
values (
  '7c351eb4-6bea-4ec4-a96a-4b88347a1e10',
  'Ultra-Sensitive TSH Screening · 10 October 2026',
  'World Mental Health Day thyroid awareness initiative. Screening is not a diagnosis.',
  'Gopinath Hospital',
  'H-226, Industrial Area, near Ramphal Cinema, Bhiwadi, Rajasthan 301019',
  '2026-10-10', '2026-10-10', true, true
)
on conflict (id) do update set
  name = excluded.name,
  description = excluded.description,
  hospital_name = excluded.hospital_name,
  address = excluded.address,
  start_date = excluded.start_date,
  end_date = excluded.end_date;

create or replace function public.submit_public_thyroid_registration(
  p_full_name text,
  p_age smallint,
  p_phone text,
  p_registration_for text,
  p_attribution jsonb default '{}'::jsonb
) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  v_phone text;
  v_patient_id uuid;
  v_registration_id uuid;
  v_camp_id uuid := '7c351eb4-6bea-4ec4-a96a-4b88347a1e10';
begin
  v_phone := regexp_replace(coalesce(p_phone, ''), '[^0-9]', '', 'g');
  if v_phone ~ '^91[6-9][0-9]{9}$' then v_phone := right(v_phone, 10); end if;
  if p_full_name is null or char_length(trim(p_full_name)) not between 2 and 120
     or p_age is null or p_age not between 18 and 120
     or v_phone !~ '^[6-9][0-9]{9}$' then
    raise exception 'Invalid registration details';
  end if;
  if p_registration_for not in ('self', 'parent', 'spouse', 'family') then
    raise exception 'Invalid registration relationship';
  end if;
  if current_date > date '2026-10-10' or not exists (select 1 from public.camps where id = v_camp_id and active and registration_open) then
    raise exception 'Registration is not open';
  end if;
  if p_attribution is not null and (jsonb_typeof(p_attribution) <> 'object' or octet_length(p_attribution::text) > 1200) then
    raise exception 'Invalid attribution';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtext(v_phone));
  if (select count(*) from public.camp_registrations r
      join public.patients p on p.id = r.patient_id
      where r.camp_id = v_camp_id
        and p.phone in (v_phone, '91' || v_phone, '+91' || v_phone)) >= 5 then
    raise exception 'Registration limit reached for this phone';
  end if;

  -- Do not overwrite an existing patient's name/age just because a family member
  -- registers using the same contact number. The screened person's name is kept
  -- on this registration and shown in the admin camp list.
  select id into v_patient_id from public.patients
  where phone in (v_phone, '91' || v_phone, '+91' || v_phone)
  order by created_at limit 1;
  if v_patient_id is null then
    insert into public.patients (full_name, phone, age, source, campaign_name, landing_page)
    values (trim(p_full_name), v_phone, p_age, 'Website', 'thyroid_screening_oct2026', '/thyroid-screening-bhiwadi')
    on conflict (phone) do nothing
    returning id into v_patient_id;
    if v_patient_id is null then
      select id into v_patient_id from public.patients where phone = v_phone;
    end if;
  end if;

  insert into public.camp_registrations
    (patient_id, camp_id, participant_name, participant_age, registration_for, registration_status, source, campaign_attribution)
  values
    (v_patient_id, v_camp_id, trim(p_full_name), p_age, p_registration_for, 'Registered',
     case when p_attribution->>'utm_source' = 'meta' then 'Meta Ads'::public.marketing_source
          else 'Website'::public.marketing_source end,
     coalesce(p_attribution, '{}'::jsonb) || jsonb_build_object('relationship', p_registration_for))
  returning id into v_registration_id;
  return v_registration_id;
end;
$$;

revoke all on function public.submit_public_thyroid_registration(text, smallint, text, text, jsonb) from public;
grant execute on function public.submit_public_thyroid_registration(text, smallint, text, text, jsonb) to anon, authenticated;
