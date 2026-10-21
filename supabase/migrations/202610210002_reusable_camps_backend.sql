-- Apply after 202610210001. This migration is additive to legacy camp data.
-- Preflight live data before applying: see docs/camps-backend.md.
alter table public.camp_registrations
  add column if not exists token_number bigint,
  add column if not exists booking_payload_hash text,
  add column if not exists initial_confirmation jsonb,
  add column if not exists notification_revision integer not null default 0;
alter table public.camp_slots alter column token_sequence type bigint;
create unique index if not exists camp_registration_slot_token_number_unique
  on public.camp_registrations(camp_slot_id, token_number) where camp_slot_id is not null and token_number is not null;

-- MATCH SIMPLE deliberately permits historic registrations without a slot/session.
alter table public.camp_sessions add constraint camp_sessions_id_camp_unique unique (id,camp_id);
alter table public.camp_slots add constraint camp_slots_id_camp_session_unique unique (id,camp_id,session_id);
alter table public.camp_slots add constraint camp_slots_session_camp_fk
  foreign key (session_id,camp_id) references public.camp_sessions(id,camp_id) not valid;
alter table public.camp_registrations add constraint camp_registration_slot_ownership_fk
  foreign key (camp_slot_id,camp_id,camp_session_id)
  references public.camp_slots(id,camp_id,session_id) not valid;
alter table public.camp_registrations add constraint camp_registration_slot_requires_session
  check (camp_slot_id is null or camp_session_id is not null) not valid;
alter table public.camp_registrations add constraint camp_registration_session_ownership_fk
  foreign key (camp_session_id,camp_id) references public.camp_sessions(id,camp_id) not valid;

create table if not exists public.camp_notification_jobs (
  id uuid primary key default gen_random_uuid(),
  registration_id uuid not null references public.camp_registrations(id) on delete restrict,
  kind text not null check (kind in ('confirmation','reschedule')),
  revision integer not null,
  status text not null default 'pending' check (status in ('pending','processing','sent','failed','cancelled')),
  attempts integer not null default 0,
  next_attempt_at timestamptz not null default now(),
  lease_until timestamptz,
  provider_message_id text,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(registration_id,kind,revision)
);
create index if not exists camp_notification_due_idx on public.camp_notification_jobs(status,next_attempt_at);
alter table public.camp_notification_jobs enable row level security;
revoke all on public.camp_notification_jobs from anon, authenticated;
grant select,insert,update,delete on public.camp_notification_jobs to service_role;

create table if not exists public.camp_rate_limits (
  key_hash text primary key,
  window_started_at timestamptz not null,
  attempts integer not null
);
alter table public.camp_rate_limits enable row level security;
revoke all on public.camp_rate_limits from anon, authenticated;
grant select,insert,update,delete on public.camp_rate_limits to service_role;

-- Legacy generic RPC selects the first open camp and does not enforce slots.
-- Historic records are retained. The dated thyroid campaign RPC is untouched.
do $$
begin
  if to_regprocedure('public.submit_public_camp_registration(text,smallint,text,text)') is not null then
    revoke execute on function public.submit_public_camp_registration(text,smallint,text,text)
      from public, anon, authenticated;
  end if;
end;
$$;
revoke insert, delete on public.camp_registrations from anon, authenticated;
-- Metadata PATCH is moved to a guarded RPC below; no client may change status/slot directly.
revoke update on public.camp_registrations from anon, authenticated;
revoke insert, update, delete on public.camp_slots from anon, authenticated;

create or replace function public.consume_camp_rate_limit(p_key_hash text, p_limit integer, p_window_seconds integer)
returns boolean language plpgsql security definer set search_path = '' as $$
declare v_attempts integer;
begin
  if auth.role() <> 'service_role' then raise exception 'Unauthorized' using errcode='42501'; end if;
  if p_key_hash !~ '^[a-f0-9]{64}$' or p_limit not between 1 and 100 or p_window_seconds not between 60 and 86400 then
    raise exception 'Invalid rate limit key' using errcode='22023';
  end if;
  insert into public.camp_rate_limits(key_hash,window_started_at,attempts) values(p_key_hash,now(),1)
  on conflict(key_hash) do update set
    window_started_at=case when public.camp_rate_limits.window_started_at < now() - make_interval(secs=>p_window_seconds)
      then now() else public.camp_rate_limits.window_started_at end,
    attempts=case when public.camp_rate_limits.window_started_at < now() - make_interval(secs=>p_window_seconds)
      then 1 else public.camp_rate_limits.attempts+1 end
  returning attempts into v_attempts;
  return v_attempts <= p_limit;
end;
$$;
revoke all on function public.consume_camp_rate_limit(text,integer,integer) from public;
grant execute on function public.consume_camp_rate_limit(text,integer,integer) to service_role;

create or replace function public.camp_booking_confirmation(p_registration_id uuid)
returns jsonb language sql stable security definer set search_path = '' as $$
  select jsonb_build_object('status','confirmed','confirmation',jsonb_build_object(
    'campName',c.name,'date',cs.session_date::text,
    'arrivalStartTime',left(sl.start_time::text,5),
    'arrivalEndTime',left(sl.end_time::text,5),
    'token',r.token,'venueName',c.hospital_name,'venueAddress',c.address,
    'bookingReference',r.booking_reference))
  from public.camp_registrations r join public.camps c on c.id=r.camp_id
  join public.camp_sessions cs on cs.id=r.camp_session_id
  join public.camp_slots sl on sl.id=r.camp_slot_id
  where r.id=p_registration_id;
$$;
revoke all on function public.camp_booking_confirmation(uuid) from public;
grant execute on function public.camp_booking_confirmation(uuid) to service_role;

create or replace function public.book_public_camp_slot(
  p_slug text,p_camp_id uuid,p_session_id uuid,p_slot_id uuid,
  p_name text,p_mobile text,p_consent boolean,p_submission_key uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_phone text := regexp_replace(coalesce(p_mobile,''),'[^0-9]','','g');
  v_name text := trim(regexp_replace(coalesce(p_name,''),'[[:space:]]+',' ','g'));
  v_hash text; v_existing public.camp_registrations%rowtype;
  v_camp public.camps%rowtype; v_slot public.camp_slots%rowtype; v_session public.camp_sessions%rowtype;
  v_booked bigint; v_number bigint; v_patient uuid; v_registration uuid; v_reference text; v_job uuid; v_confirmation jsonb;
begin
  if auth.role() <> 'service_role' then raise exception 'Unauthorized' using errcode='42501'; end if;
  if v_phone ~ '^91[6-9][0-9]{9}$' then v_phone:=right(v_phone,10); end if;
  if p_submission_key is null or p_camp_id is null or p_session_id is null or p_slot_id is null
     or p_slug !~ '^[a-z0-9]+(-[a-z0-9]+)*$' or length(v_name) not between 2 and 120
     or v_phone !~ '^[6-9][0-9]{9}$' or p_consent is distinct from true then
    raise exception 'VALIDATION_ERROR' using errcode='P0001';
  end if;
  v_hash:=pg_catalog.md5(jsonb_build_object('slug',p_slug,'camp',p_camp_id,'session',p_session_id,
    'slot',p_slot_id,'name',v_name,'mobile',v_phone,'consent',true)::text);
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_submission_key::text,0));
  select * into v_existing from public.camp_registrations where submission_key=p_submission_key;
  if found then
    if v_existing.booking_payload_hash is distinct from v_hash then
      raise exception 'IDEMPOTENCY_CONFLICT' using errcode='P0001';
    end if;
    return v_existing.initial_confirmation;
  end if;
  select * into v_camp from public.camps where id=p_camp_id and slug=p_slug for share;
  if not found or v_camp.lifecycle<>'published' or not v_camp.active then
    raise exception 'CAMP_NOT_FOUND' using errcode='P0001';
  end if;
  if not v_camp.registration_open or (v_camp.registration_opens_at is not null and now()<v_camp.registration_opens_at)
     or (v_camp.registration_closes_at is not null and now()>v_camp.registration_closes_at) then
    raise exception 'REGISTRATION_CLOSED' using errcode='P0001';
  end if;
  select * into v_slot from public.camp_slots where id=p_slot_id for update;
  if not found or v_slot.camp_id<>p_camp_id or v_slot.session_id<>p_session_id then
    raise exception 'SLOT_CLOSED' using errcode='P0001';
  end if;
  select * into v_session from public.camp_sessions where id=p_session_id and camp_id=p_camp_id;
  if not found or not v_session.active or not v_slot.active
     or ((v_session.session_date+v_slot.start_time) at time zone 'Asia/Kolkata')<=now() then
    raise exception 'SLOT_CLOSED' using errcode='P0001';
  end if;
  select count(*) into v_booked from public.camp_registrations
    where camp_slot_id=p_slot_id and registration_status<>'Cancelled';
  if v_booked>=v_slot.capacity then raise exception 'SLOT_FULL' using errcode='P0001'; end if;
  update public.camp_slots set token_sequence=token_sequence+1 where id=p_slot_id returning token_sequence into v_number;
  -- The contact record is shared by phone; never overwrite its name for another attendee.
  select id into v_patient from public.patients where phone in (v_phone,'91'||v_phone,'+91'||v_phone)
    order by created_at limit 1 for update;
  if v_patient is null then
    insert into public.patients(full_name,phone,source,landing_page)
      values(v_name,v_phone,'Website','/camps/'||p_slug)
      on conflict(phone) do update set last_contact_at=now()
      returning id into v_patient;
  else
    update public.patients set last_contact_at=now() where id=v_patient;
  end if;
  v_reference:='CAMP-'||upper(replace(gen_random_uuid()::text,'-',''));
  insert into public.camp_registrations(patient_id,camp_id,camp_session_id,camp_slot_id,participant_name,
    token_number,token,booking_reference,submission_key,booking_payload_hash,consent_at,
    registration_status,confirmation_status,notification_status,source)
  values(v_patient,p_camp_id,p_session_id,p_slot_id,v_name,v_number,
    upper(replace(p_slot_id::text,'-',''))||'-'||lpad(v_number::text,3,'0'),
    v_reference,p_submission_key,v_hash,now(),'Registered','Confirmed','Pending','Website')
  returning id into v_registration;
  insert into public.camp_notification_jobs(registration_id,kind,revision)
    values(v_registration,'confirmation',0) returning id into v_job;
  v_confirmation:=public.camp_booking_confirmation(v_registration);
  update public.camp_registrations set initial_confirmation=v_confirmation where id=v_registration;
  return v_confirmation||jsonb_build_object('jobId',v_job);
end;
$$;
revoke all on function public.book_public_camp_slot(text,uuid,uuid,uuid,text,text,boolean,uuid) from public;
grant execute on function public.book_public_camp_slot(text,uuid,uuid,uuid,text,text,boolean,uuid) to service_role;

-- Replay lookup is service-only and requires the original key plus exact normalized
-- booking payload. It lets safe retries bypass rate limits without exposing a
-- reference-only or token-only retrieval endpoint.
create or replace function public.replay_public_camp_booking(
  p_slug text,p_camp_id uuid,p_session_id uuid,p_slot_id uuid,p_name text,p_mobile text,p_submission_key uuid)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare v_phone text:=regexp_replace(coalesce(p_mobile,''),'[^0-9]','','g');
  v_name text:=trim(regexp_replace(coalesce(p_name,''),'[[:space:]]+',' ','g'));
  v_hash text; v_row public.camp_registrations%rowtype;
begin
  if auth.role()<>'service_role' then raise exception 'Unauthorized' using errcode='42501'; end if;
  if v_phone ~ '^91[6-9][0-9]{9}$' then v_phone:=right(v_phone,10); end if;
  select * into v_row from public.camp_registrations where submission_key=p_submission_key;
  if not found then return null; end if;
  v_hash:=pg_catalog.md5(jsonb_build_object('slug',p_slug,'camp',p_camp_id,'session',p_session_id,
    'slot',p_slot_id,'name',v_name,'mobile',v_phone,'consent',true)::text);
  if v_row.booking_payload_hash is distinct from v_hash then
    raise exception 'IDEMPOTENCY_CONFLICT' using errcode='P0001'; end if;
  return v_row.initial_confirmation;
end;
$$;
revoke all on function public.replay_public_camp_booking(text,uuid,uuid,uuid,text,text,uuid) from public;
grant execute on function public.replay_public_camp_booking(text,uuid,uuid,uuid,text,text,uuid) to service_role;

create or replace function public.get_public_camp(p_slug text)
returns jsonb language sql stable security definer set search_path = '' as $$
select case when auth.role() <> 'service_role' then null else (
  select jsonb_build_object('camp', jsonb_build_object(
    'id', c.id,
    'slug', c.slug,
    'title', c.name,
    'description', c.description,
    'imageUrl', c.image_url,
    'venueName', c.hospital_name,
    'venueAddress', c.address,
    'firstSessionDate', c.start_date::text,
    'lastSessionDate', c.end_date::text,
    'status', case
      when now() < c.registration_opens_at then 'upcoming'
      when now() > c.registration_closes_at or not c.registration_open then 'closed'
      when not exists (
        select 1 from public.camp_slots x
        join public.camp_sessions y on y.id = x.session_id
        where x.camp_id = c.id and y.camp_id = c.id and x.active and y.active
          and ((y.session_date + x.start_time) at time zone 'Asia/Kolkata') > now()
          and (select count(*) from public.camp_registrations r
               where r.camp_slot_id = x.id and r.registration_status <> 'Cancelled') < x.capacity
      ) then 'full'
      else 'open'
    end,
    'instructions', c.instructions,
    'sessions', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', s.id,
        'date', s.session_date::text,
        'opensAt', left(s.start_time::text, 5),
        'closesAt', left(s.end_time::text, 5),
        'slots', coalesce((
          select jsonb_agg(jsonb_build_object(
            'id', sl.id,
            'startTime', left(sl.start_time::text, 5),
            'endTime', left(sl.end_time::text, 5),
            'remaining', greatest(sl.capacity - (select count(*) from public.camp_registrations r
              where r.camp_slot_id = sl.id and r.registration_status <> 'Cancelled'), 0),
            'status', case
              when not sl.active or not s.active
                or ((s.session_date + sl.start_time) at time zone 'Asia/Kolkata') <= now()
                or now() < c.registration_opens_at or now() > c.registration_closes_at
                or not c.registration_open then 'closed'
              when (select count(*) from public.camp_registrations r
                    where r.camp_slot_id = sl.id and r.registration_status <> 'Cancelled') >= sl.capacity
                then 'full'
              else 'open'
            end
          ) order by sl.start_time)
          from public.camp_slots sl where sl.session_id = s.id and sl.camp_id = c.id
        ), '[]'::jsonb)
      ) order by s.session_date, s.start_time)
      from public.camp_sessions s where s.camp_id = c.id
    ), '[]'::jsonb)
  ))
  from public.camps c
  where c.slug = p_slug and c.lifecycle = 'published' and c.active
) end;
$$;
revoke all on function public.get_public_camp(text) from public;
grant execute on function public.get_public_camp(text) to service_role;

create or replace function public.list_public_camps()
returns jsonb language sql stable security definer set search_path = '' as $$
select case when auth.role()<>'service_role' then null else coalesce(jsonb_agg(camp->'camp' order by (camp->'camp'->>'firstSessionDate')), '[]'::jsonb) end
from (select public.get_public_camp(c.slug) as camp from public.camps c
 where c.lifecycle='published' and c.active and c.end_date >= (now() at time zone 'Asia/Kolkata')::date) x;
$$;
revoke all on function public.list_public_camps() from public;
grant execute on function public.list_public_camps() to service_role;

-- All capacity-changing admin actions lock involved slots in UUID order, then the
-- registration. A concurrent change of source slot is detected and retried by staff.
create or replace function public.change_admin_camp_registration(p_registration_id uuid,p_action text,p_destination_slot uuid default null)
returns void language plpgsql security definer set search_path = '' as $$
declare v_row public.camp_registrations%rowtype; v_dest public.camp_slots%rowtype;
  v_source uuid; v_lock uuid; v_number bigint; v_token text; v_revision integer;
begin
  if not public.is_active_admin(array['super_admin','admin']::public.admin_role[]) then
    raise exception 'Administrator permission required' using errcode='42501'; end if;
  select camp_slot_id into v_source from public.camp_registrations where id=p_registration_id;
  if not found then raise exception 'Registration not found' using errcode='P0002'; end if;
  for v_lock in select distinct slot_id from unnest(array[v_source,p_destination_slot]) as locks(slot_id)
    where slot_id is not null order by slot_id loop
    perform 1 from public.camp_slots where id=v_lock for update;
  end loop;
  select * into v_row from public.camp_registrations where id=p_registration_id for update;
  if v_row.camp_slot_id is distinct from v_source then
    raise exception 'Registration changed; refresh and retry' using errcode='40001'; end if;
  if p_action='cancel' then
    if v_row.registration_status='Cancelled' then return; end if;
    update public.camp_registrations set registration_status='Cancelled',attendance_status='Cancelled',
      notification_revision=notification_revision+1,notification_status='Cancelled' where id=p_registration_id;
    update public.camp_notification_jobs set status='cancelled' where registration_id=p_registration_id and status in ('pending','failed');
    update public.reminders set status='Cancelled' where camp_registration_id=p_registration_id and status in ('Not Scheduled','Scheduled','Failed');
  elsif p_action='reactivate' then
    if v_row.registration_status<>'Cancelled' or v_source is null then
      raise exception 'Only a cancelled scheduled booking can be reactivated' using errcode='22023'; end if;
    select * into v_dest from public.camp_slots where id=v_source;
    if not v_dest.active or not exists(select 1 from public.camp_sessions s join public.camps c on c.id=s.camp_id
      where s.id=v_dest.session_id and s.active and c.lifecycle='published' and c.active and c.registration_open
      and now() between c.registration_opens_at and c.registration_closes_at
      and ((s.session_date+v_dest.start_time) at time zone 'Asia/Kolkata')>now()) then
      raise exception 'Original slot is no longer bookable' using errcode='P0002'; end if;
    if (select count(*) from public.camp_registrations where camp_slot_id=v_source and registration_status<>'Cancelled')>=v_dest.capacity then
      raise exception 'Original slot is full' using errcode='P0002'; end if;
    update public.camp_slots set token_sequence=token_sequence+1 where id=v_source returning token_sequence into v_number;
    v_token:=upper(replace(v_source::text,'-',''))||'-'||lpad(v_number::text,3,'0');
    v_revision:=v_row.notification_revision+1;
    update public.camp_registrations set registration_status='Registered',attendance_status='Pending',
      token_number=v_number,token=v_token,notification_revision=v_revision,notification_status='Pending',
      confirmation_status='Confirmed' where id=p_registration_id;
    insert into public.camp_notification_jobs(registration_id,kind,revision)
      values(p_registration_id,'confirmation',v_revision);
  elsif p_action in ('attend','no_show') then
    if v_row.registration_status='Cancelled' then raise exception 'Cancelled registration cannot be checked in' using errcode='22023'; end if;
    update public.camp_registrations set
      attendance_status=case when p_action='attend' then 'Attended'::public.attendance_status else 'No-show'::public.attendance_status end,
      attended_at=case when p_action='attend' then now() else null end where id=p_registration_id;
  elsif p_action='move' then
    if v_row.registration_status='Cancelled' or v_source is null or p_destination_slot is null or p_destination_slot=v_source then
      raise exception 'Choose another slot for an active scheduled booking' using errcode='22023'; end if;
    select * into v_dest from public.camp_slots where id=p_destination_slot and camp_id=v_row.camp_id;
    if not found or not v_dest.active or not exists(select 1 from public.camp_sessions s where s.id=v_dest.session_id
      and s.active and ((s.session_date+v_dest.start_time) at time zone 'Asia/Kolkata')>now()) then
      raise exception 'Destination slot unavailable' using errcode='P0002'; end if;
    if (select count(*) from public.camp_registrations where camp_slot_id=p_destination_slot and registration_status<>'Cancelled')>=v_dest.capacity then
      raise exception 'Destination slot is full' using errcode='P0002'; end if;
    update public.camp_slots set token_sequence=token_sequence+1 where id=p_destination_slot returning token_sequence into v_number;
    v_token:=upper(replace(p_destination_slot::text,'-',''))||'-'||lpad(v_number::text,3,'0');
    v_revision:=v_row.notification_revision+1;
    update public.camp_registrations set camp_slot_id=p_destination_slot,camp_session_id=v_dest.session_id,
      token_number=v_number,token=v_token,notification_revision=v_revision,notification_status='Pending',
      confirmation_status='Confirmed' where id=p_registration_id;
    update public.camp_notification_jobs set status='cancelled' where registration_id=p_registration_id and status in ('pending','failed');
    update public.reminders set status='Cancelled' where camp_registration_id=p_registration_id and status in ('Not Scheduled','Scheduled','Failed');
    insert into public.camp_notification_jobs(registration_id,kind,revision) values(p_registration_id,'reschedule',v_revision);
  else raise exception 'Unsupported action' using errcode='22023'; end if;
  insert into public.camp_registration_changes(registration_id,actor_id,action,old_slot_id,new_slot_id,old_token,new_token)
    values(p_registration_id,auth.uid(),p_action,v_source,case when p_action='move' then p_destination_slot else v_source end,
      v_row.token,coalesce(v_token,v_row.token));
  insert into public.admin_activity_logs(admin_id,action,registration_id,metadata)
    values(auth.uid(),'Camp registration '||p_action,p_registration_id,
      jsonb_build_object('source_slot',v_source,'destination_slot',case when p_action='move' then p_destination_slot else null end));
end;
$$;
revoke all on function public.change_admin_camp_registration(uuid,text,uuid) from public;
grant execute on function public.change_admin_camp_registration(uuid,text,uuid) to authenticated;

create or replace function public.update_admin_camp_registration_metadata(p_id uuid,p_confirmation text,p_reminder text)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_active_admin(array['super_admin','admin']::public.admin_role[]) then
    raise exception 'Administrator permission required' using errcode='42501'; end if;
  if (p_confirmation is null and p_reminder is null) or
    (p_confirmation is not null and p_confirmation not in ('Pending','Confirmed','Rejected')) or
    (p_reminder is not null and p_reminder not in ('Not Scheduled','Scheduled','Sent','Failed','Cancelled')) then
    raise exception 'Invalid metadata' using errcode='22023'; end if;
  update public.camp_registrations set confirmation_status=coalesce(p_confirmation::public.confirmation_status,confirmation_status),
    reminder_status=coalesce(p_reminder::public.reminder_status,reminder_status) where id=p_id;
  if not found then raise exception 'Registration not found' using errcode='P0002'; end if;
  insert into public.admin_activity_logs(admin_id,action,registration_id,metadata)
    values(auth.uid(),'Camp registration metadata updated',p_id,jsonb_build_object('confirmation',p_confirmation,'reminder',p_reminder));
end;
$$;
revoke all on function public.update_admin_camp_registration_metadata(uuid,text,text) from public;
grant execute on function public.update_admin_camp_registration_metadata(uuid,text,text) to authenticated;

create or replace function public.resend_admin_camp_confirmation(p_registration_id uuid)
returns uuid language plpgsql security definer set search_path = '' as $$
declare v_row public.camp_registrations%rowtype; v_job uuid; v_recent integer;
begin
  if not public.is_active_admin(array['super_admin','admin']::public.admin_role[]) then
    raise exception 'Administrator permission required' using errcode='42501'; end if;
  select * into v_row from public.camp_registrations where id=p_registration_id for update;
  if not found or v_row.registration_status='Cancelled' or v_row.camp_slot_id is null then
    raise exception 'Active scheduled booking required' using errcode='22023'; end if;
  select count(*) into v_recent from public.camp_notification_jobs where registration_id=p_registration_id
    and created_at>now()-interval '1 day' and revision>0;
  if v_recent>=3 or exists(select 1 from public.camp_notification_jobs where registration_id=p_registration_id
    and created_at>now()-interval '15 minutes' and revision>0) then
    raise exception 'Resend limit reached; try later' using errcode='P0001'; end if;
  update public.camp_registrations set notification_revision=notification_revision+1,notification_status='Pending'
    where id=p_registration_id returning notification_revision into v_row.notification_revision;
  update public.camp_notification_jobs set status='cancelled' where registration_id=p_registration_id and status in ('pending','failed');
  insert into public.camp_notification_jobs(registration_id,kind,revision)
    values(p_registration_id,'confirmation',v_row.notification_revision) returning id into v_job;
  insert into public.admin_activity_logs(admin_id,action,registration_id,metadata)
    values(auth.uid(),'Camp confirmation resent',p_registration_id,jsonb_build_object('job_id',v_job));
  return v_job;
end;
$$;
revoke all on function public.resend_admin_camp_confirmation(uuid) from public;
grant execute on function public.resend_admin_camp_confirmation(uuid) to authenticated;

create or replace function public.claim_camp_notification_job(p_job_id uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_job public.camp_notification_jobs%rowtype; v_row public.camp_registrations%rowtype;
  v_result jsonb;
begin
  if auth.role()<>'service_role' then raise exception 'Unauthorized' using errcode='42501'; end if;
  select * into v_job from public.camp_notification_jobs where id=p_job_id for update;
  if not found or (v_job.status not in ('pending','failed') and not (v_job.status='processing' and v_job.lease_until<now()))
    or v_job.next_attempt_at>now() or v_job.attempts>=5 then return null; end if;
  select * into v_row from public.camp_registrations where id=v_job.registration_id;
  if v_row.registration_status='Cancelled' or v_row.notification_revision<>v_job.revision then
    update public.camp_notification_jobs set status='cancelled' where id=p_job_id; return null; end if;
  update public.camp_notification_jobs set status='processing',lease_until=now()+interval '2 minutes',attempts=attempts+1
    where id=p_job_id;
  select jsonb_build_object('jobId',v_job.id,'phone',p.phone,'attendee',coalesce(v_row.participant_name,p.full_name),
    'kind',v_job.kind,'campName',c.name,'date',to_char(s.session_date::timestamp,'DD Mon YYYY'),
    'startTime',left(sl.start_time::text,5),'endTime',left(sl.end_time::text,5),
    'venueName',c.hospital_name,'venueAddress',c.address,'token',v_row.token,'bookingReference',v_row.booking_reference)
  into v_result from public.patients p join public.camps c on c.id=v_row.camp_id
    join public.camp_sessions s on s.id=v_row.camp_session_id
    join public.camp_slots sl on sl.id=v_row.camp_slot_id where p.id=v_row.patient_id;
  return v_result;
end;
$$;
revoke all on function public.claim_camp_notification_job(uuid) from public;
grant execute on function public.claim_camp_notification_job(uuid) to service_role;

create or replace function public.finish_camp_notification_job(p_job_id uuid,p_sent boolean,p_provider_id text,p_error text)
returns void language plpgsql security definer set search_path = '' as $$
declare v_job public.camp_notification_jobs%rowtype; v_reg uuid;
begin
  if auth.role()<>'service_role' then raise exception 'Unauthorized' using errcode='42501'; end if;
  select registration_id into v_reg from public.camp_notification_jobs where id=p_job_id;
  if not found then return; end if;
  perform 1 from public.camp_registrations where id=v_reg for update;
  select * into v_job from public.camp_notification_jobs where id=p_job_id for update;
  if not found or v_job.status<>'processing' then return; end if;
  if p_sent then
    update public.camp_notification_jobs set status='sent',provider_message_id=left(p_provider_id,200),
      last_error=null,lease_until=null,updated_at=now() where id=p_job_id;
    update public.camp_registrations set notification_status='Sent',confirmation_sent_at=now()
      where id=v_job.registration_id and notification_revision=v_job.revision and registration_status<>'Cancelled';
  else
    update public.camp_notification_jobs set status='failed',last_error=left(coalesce(p_error,'Delivery unavailable'),300),
      lease_until=null,next_attempt_at=now()+make_interval(mins=>least(60,(v_job.attempts*v_job.attempts)*2)),updated_at=now()
      where id=p_job_id;
    update public.camp_registrations set notification_status='Failed' where id=v_job.registration_id
      and notification_revision=v_job.revision and registration_status<>'Cancelled';
  end if;
end;
$$;
revoke all on function public.finish_camp_notification_job(uuid,boolean,text,text) from public;
grant execute on function public.finish_camp_notification_job(uuid,boolean,text,text) to service_role;

create or replace function public.list_due_camp_notification_jobs(p_limit integer default 20)
returns setof uuid language sql stable security definer set search_path = '' as $$
 select id from public.camp_notification_jobs where auth.role()='service_role'
   and (status in ('pending','failed') or (status='processing' and lease_until<now()))
   and next_attempt_at<=now() and attempts<5 order by created_at limit least(greatest(p_limit,1),100);
$$;
revoke all on function public.list_due_camp_notification_jobs(integer) from public;
grant execute on function public.list_due_camp_notification_jobs(integer) to service_role;
