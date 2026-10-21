-- Reusable camp administration. Existing September camp and registrations remain in place.
alter table public.camps
  add column if not exists slug text,
  add column if not exists lifecycle text not null default 'draft' check (lifecycle in ('draft','published','closed','cancelled')),
  add column if not exists instructions text[] not null default '{}',
  add column if not exists image_url text,
  add column if not exists registration_opens_at timestamptz,
  add column if not exists registration_closes_at timestamptz,
  add column if not exists dates_reviewed boolean not null default false;
create unique index if not exists camps_slug_unique on public.camps(slug) where slug is not null;
update public.camps set lifecycle = case when active = false then 'cancelled' else 'closed' end
  where slug is null and end_date < (now() at time zone 'Asia/Kolkata')::date;

alter table public.camp_sessions
  add column if not exists slot_duration_minutes integer not null default 30 check (slot_duration_minutes between 5 and 240),
  add column if not exists capacity_per_slot integer not null default 10 check (capacity_per_slot > 0),
  add column if not exists breaks jsonb not null default '[]'::jsonb;

create table if not exists public.camp_slots (
  id uuid primary key default gen_random_uuid(),
  camp_id uuid not null references public.camps(id) on delete restrict,
  session_id uuid not null references public.camp_sessions(id) on delete restrict,
  start_time time not null,
  end_time time not null,
  capacity integer not null check (capacity > 0),
  active boolean not null default true,
  token_sequence integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(session_id, start_time),
  check (end_time > start_time)
);
create index if not exists camp_slots_camp_session_idx on public.camp_slots(camp_id, session_id, start_time);
create trigger camp_slots_updated before update on public.camp_slots for each row execute function public.set_updated_at();

alter table public.camp_registrations
  add column if not exists camp_slot_id uuid references public.camp_slots(id) on delete restrict,
  add column if not exists participant_name text,
  add column if not exists token text,
  add column if not exists booking_reference text,
  add column if not exists consent_at timestamptz,
  add column if not exists submission_key uuid,
  add column if not exists notification_status text not null default 'Not Sent';
update public.camp_registrations set notification_status='Sent' where confirmation_sent_at is not null and notification_status='Not Sent';
create unique index if not exists camp_registration_submission_key_unique on public.camp_registrations(submission_key) where submission_key is not null;
create unique index if not exists camp_registration_reference_unique on public.camp_registrations(booking_reference) where booking_reference is not null;
create unique index if not exists camp_registration_token_per_camp_unique on public.camp_registrations(camp_id,token) where token is not null;
create index if not exists camp_registration_slot_status_idx on public.camp_registrations(camp_slot_id, registration_status);

create table if not exists public.camp_registration_changes (
  id uuid primary key default gen_random_uuid(),
  registration_id uuid not null references public.camp_registrations(id) on delete restrict,
  actor_id uuid references auth.users(id) on delete set null,
  action text not null,
  old_slot_id uuid references public.camp_slots(id) on delete restrict,
  new_slot_id uuid references public.camp_slots(id) on delete restrict,
  old_token text,
  new_token text,
  created_at timestamptz not null default now()
);
create index if not exists camp_registration_changes_registration_idx on public.camp_registration_changes(registration_id, created_at);

alter table public.camp_slots enable row level security;
alter table public.camp_registration_changes enable row level security;
revoke all on public.camp_slots, public.camp_registration_changes from anon;
grant select on public.camp_slots, public.camp_registration_changes to authenticated;
create policy camp_slots_admin_read on public.camp_slots for select to authenticated using (public.is_active_admin());
create policy camp_changes_admin_read on public.camp_registration_changes for select to authenticated using (public.is_active_admin());

-- Every edit (camp, sessions, slots) is one transaction. The function rejects edits
-- to booked windows and refuses to remove a booked session. No multi-request save.
create or replace function public.save_admin_camp(p_config jsonb)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  v_id uuid := nullif(p_config->>'id','')::uuid;
  v_actor uuid := auth.uid();
  v_title text := trim(coalesce(p_config->>'title',''));
  v_slug text := trim(coalesce(p_config->>'slug',''));
  v_desc text := trim(coalesce(p_config->>'description',''));
  v_venue text := trim(coalesce(p_config->>'venueName',''));
  v_address text := trim(coalesce(p_config->>'venueAddress',''));
  v_lifecycle text := coalesce(p_config->>'lifecycle','draft');
  v_open timestamptz := nullif(p_config->>'registrationOpensAt','')::timestamptz;
  v_close timestamptz := nullif(p_config->>'registrationClosesAt','')::timestamptz;
  v_reviewed boolean := coalesce((p_config->>'datesReviewed')::boolean,false);
  v_session jsonb;
  v_slot jsonb;
  v_sid uuid;
  v_slot_id uuid;
  v_day date;
  v_start time;
  v_end time;
  v_duration integer;
  v_capacity integer;
  v_booked integer;
  v_seen_sessions uuid[] := '{}';
  v_seen_slots uuid[] := '{}';
  v_previous_end time;
  v_previous_break_end time;
  v_break jsonb;
  v_break_start time;
  v_break_end time;
begin
  if not public.is_active_admin(array['super_admin','admin']::public.admin_role[]) then
    raise exception 'Administrator permission required' using errcode = '42501';
  end if;
  if length(v_title) not between 3 and 160 or v_slug !~ '^[a-z0-9]+(-[a-z0-9]+)*$' or length(v_slug) > 100
    or length(v_desc) not between 10 and 2000 or v_venue = '' or v_address = ''
    or v_lifecycle not in ('draft','published','closed','cancelled')
    or jsonb_typeof(p_config->'sessions') is distinct from 'array' or jsonb_array_length(p_config->'sessions') < 1 then
    raise exception 'Invalid camp content' using errcode = '22023';
  end if;
  if v_open is not null and v_close is not null and v_close <= v_open then
    raise exception 'Registration closing time must follow opening time' using errcode = '22023';
  end if;
  if v_lifecycle = 'published' and (not v_reviewed or v_open is null or v_close is null or v_close <= now()) then
    raise exception 'Review dates and set registration times before publishing' using errcode = '22023';
  end if;
  if exists(select 1 from public.camps where slug = v_slug and id is distinct from v_id) then
    raise exception 'Camp URL slug is already in use' using errcode = '23505';
  end if;
  if v_id is not null then
    perform 1 from public.camps where id = v_id for update;
    if not found then raise exception 'Camp not found' using errcode = 'P0002'; end if;
  else v_id := gen_random_uuid(); end if;

  -- Insert or update the parent first; the function rolls it back on any later error.
  insert into public.camps(id,name,slug,description,instructions,hospital_name,address,image_url,
    start_date,end_date,registration_opens_at,registration_closes_at,dates_reviewed,lifecycle,registration_open,active)
  values(v_id,v_title,v_slug,v_desc,
    coalesce((select array_agg(instruction) from jsonb_array_elements_text(coalesce(p_config->'instructions','[]'::jsonb)) as items(instruction)),'{}'::text[]),
    v_venue,v_address,nullif(p_config->>'imageUrl',''),
    (select min((element->>'date')::date) from jsonb_array_elements(p_config->'sessions') as x(element)),
    (select max((element->>'date')::date) from jsonb_array_elements(p_config->'sessions') as x(element)),
    v_open,v_close,v_reviewed,v_lifecycle,v_lifecycle='published',v_lifecycle<>'cancelled')
  on conflict(id) do update set name=excluded.name,slug=excluded.slug,description=excluded.description,
    instructions=excluded.instructions,hospital_name=excluded.hospital_name,address=excluded.address,
    image_url=excluded.image_url,start_date=excluded.start_date,end_date=excluded.end_date,
    registration_opens_at=excluded.registration_opens_at,registration_closes_at=excluded.registration_closes_at,
    dates_reviewed=excluded.dates_reviewed,lifecycle=excluded.lifecycle,
    registration_open=excluded.registration_open,active=excluded.active;

  for v_session in select element from jsonb_array_elements(p_config->'sessions') as x(element) loop
    v_sid := nullif(v_session->>'id','')::uuid;
    v_day := (v_session->>'date')::date;
    v_start := (v_session->>'startTime')::time;
    v_end := (v_session->>'endTime')::time;
    v_duration := (v_session->>'slotDurationMinutes')::integer;
    v_capacity := (v_session->>'capacityPerSlot')::integer;
    if v_day is null or v_start is null or v_end is null or v_end <= v_start
      or v_duration is null or v_capacity is null
      or v_duration not between 5 and 240 or v_capacity not between 1 and 10000
      or jsonb_typeof(v_session->'slots') is distinct from 'array' then
      raise exception 'Invalid session settings' using errcode = '22023';
    end if;
    v_previous_break_end := null;
    for v_break in select element from jsonb_array_elements(coalesce(v_session->'breaks','[]'::jsonb)) as x(element) order by element->>'startTime' loop
      v_break_start := (v_break->>'startTime')::time; v_break_end := (v_break->>'endTime')::time;
      if v_break_start is null or v_break_end is null or v_break_start < v_start or v_break_end > v_end or v_break_end <= v_break_start
        or (v_previous_break_end is not null and v_break_start < v_previous_break_end) then
        raise exception 'Invalid session break' using errcode = '22023';
      end if;
      v_previous_break_end := v_break_end;
    end loop;
    if v_sid is not null then
      perform 1 from public.camp_sessions where id=v_sid and camp_id=v_id for update;
      if not found then raise exception 'Session does not belong to this camp' using errcode='22023'; end if;
      if exists(select 1 from public.camp_registrations r where r.camp_session_id=v_sid)
        and exists(select 1 from public.camp_sessions s where s.id=v_sid and
          (s.session_date<>v_day or s.start_time<>v_start or s.end_time<>v_end)) then
        raise exception 'Booked session schedule cannot be changed' using errcode='22023';
      end if;
    else
      select id into v_sid from public.camp_sessions where camp_id=v_id and session_date=v_day for update;
      if v_sid is null then v_sid := gen_random_uuid(); end if;
    end if;
    if v_sid = any(v_seen_sessions) then raise exception 'Repeated session' using errcode='22023'; end if;
    v_seen_sessions := array_append(v_seen_sessions,v_sid);
    insert into public.camp_sessions(id,camp_id,session_date,start_time,end_time,slot_duration_minutes,capacity_per_slot,breaks,active)
    values(v_sid,v_id,v_day,v_start,v_end,v_duration,v_capacity,coalesce(v_session->'breaks','[]'::jsonb),coalesce((v_session->>'active')::boolean,true))
    on conflict(id) do update set session_date=excluded.session_date,start_time=excluded.start_time,end_time=excluded.end_time,
      slot_duration_minutes=excluded.slot_duration_minutes,capacity_per_slot=excluded.capacity_per_slot,
      breaks=excluded.breaks,active=excluded.active;
    v_previous_end := null;
    for v_slot in select element from jsonb_array_elements(v_session->'slots') as x(element) order by element->>'startTime' loop
      v_slot_id := nullif(v_slot->>'id','')::uuid;
      if (v_slot->>'startTime')::time < v_start or (v_slot->>'endTime')::time > v_end
        or (v_slot->>'endTime')::time <= (v_slot->>'startTime')::time
        or v_slot->>'capacity' is null or (v_slot->>'capacity')::integer not between 1 and 10000
        or (v_previous_end is not null and (v_slot->>'startTime')::time < v_previous_end) then
        raise exception 'Invalid or overlapping arrival windows' using errcode='22023';
      end if;
      for v_break in select element from jsonb_array_elements(coalesce(v_session->'breaks','[]'::jsonb)) as x(element) loop
        if (v_slot->>'startTime')::time < (v_break->>'endTime')::time
           and (v_slot->>'endTime')::time > (v_break->>'startTime')::time then
          raise exception 'Arrival window overlaps a break' using errcode='22023';
        end if;
      end loop;
      v_previous_end := (v_slot->>'endTime')::time;
      if v_slot_id is not null then
        perform 1 from public.camp_slots where id=v_slot_id and camp_id=v_id and session_id=v_sid for update;
        if not found then raise exception 'Slot does not belong to this session' using errcode='22023'; end if;
      else
        select id into v_slot_id from public.camp_slots where session_id=v_sid and start_time=(v_slot->>'startTime')::time for update;
        if v_slot_id is null then v_slot_id := gen_random_uuid(); end if;
      end if;
      if v_slot_id = any(v_seen_slots) then raise exception 'Repeated slot' using errcode='22023'; end if;
      v_seen_slots := array_append(v_seen_slots,v_slot_id);
      select count(*) into v_booked from public.camp_registrations
        where camp_slot_id=v_slot_id and registration_status <> 'Cancelled';
      if exists(select 1 from public.camp_registrations where camp_slot_id=v_slot_id) and
        exists(select 1 from public.camp_slots where id=v_slot_id and
          (start_time <> (v_slot->>'startTime')::time or end_time <> (v_slot->>'endTime')::time)) then
        raise exception 'Booked slot times cannot be changed' using errcode='22023';
      end if;
      if (v_slot->>'capacity')::integer < v_booked then
        raise exception 'Capacity cannot be lower than active bookings' using errcode='22023';
      end if;
      insert into public.camp_slots(id,camp_id,session_id,start_time,end_time,capacity,active)
      values(v_slot_id,v_id,v_sid,(v_slot->>'startTime')::time,(v_slot->>'endTime')::time,
        (v_slot->>'capacity')::integer,coalesce((v_slot->>'active')::boolean,true))
      on conflict(id) do update set start_time=excluded.start_time,end_time=excluded.end_time,
        capacity=excluded.capacity,active=excluded.active;
    end loop;
  end loop;
  if exists(select 1 from public.camp_registrations r join public.camp_slots s on s.id=r.camp_slot_id
      where s.camp_id=v_id and not (s.id = any(v_seen_slots))) then
    raise exception 'Booked slots must be retained; use an explicit rescheduling operation' using errcode='22023';
  end if;
  if exists(select 1 from public.camp_registrations r where r.camp_id=v_id
      and r.camp_session_id is not null and not (r.camp_session_id = any(v_seen_sessions))) then
    raise exception 'Booked sessions must be retained' using errcode='22023';
  end if;
  delete from public.camp_slots where camp_id=v_id and not (id = any(v_seen_slots));
  delete from public.camp_sessions where camp_id=v_id and not (id = any(v_seen_sessions));
  if v_lifecycle='published' and not exists(
    select 1 from public.camp_slots s join public.camp_sessions cs on cs.id=s.session_id
    where s.camp_id=v_id and s.active and cs.active and cs.session_date >= (now() at time zone 'Asia/Kolkata')::date
      and (select count(*) from public.camp_registrations r where r.camp_slot_id=s.id and r.registration_status<>'Cancelled') < s.capacity) then
    raise exception 'Publishing requires a future bookable slot' using errcode='22023';
  end if;
  insert into public.admin_activity_logs(admin_id,action,metadata)
    values(v_actor,'Camp configuration saved',jsonb_build_object('camp_id',v_id,'lifecycle',v_lifecycle));
  return v_id;
end;
$$;
revoke all on function public.save_admin_camp(jsonb) from public;
grant execute on function public.save_admin_camp(jsonb) to authenticated;

create or replace function public.duplicate_admin_camp(p_camp_id uuid, p_slug text)
returns uuid language plpgsql security definer set search_path = '' as $$
declare v_new uuid := gen_random_uuid(); v_old public.camps%rowtype; v_session record; v_sid uuid;
begin
  if not public.is_active_admin(array['super_admin','admin']::public.admin_role[]) then
    raise exception 'Administrator permission required' using errcode='42501';
  end if;
  if p_slug !~ '^[a-z0-9]+(-[a-z0-9]+)*$' or length(p_slug)>100 then
    raise exception 'Invalid slug' using errcode='22023';
  end if;
  select * into v_old from public.camps where id=p_camp_id;
  if not found then raise exception 'Camp not found' using errcode='P0002'; end if;
  insert into public.camps(id,name,slug,description,instructions,hospital_name,address,image_url,start_date,end_date,
    registration_opens_at,registration_closes_at,dates_reviewed,lifecycle,registration_open,active)
  values(v_new,v_old.name,p_slug,v_old.description,v_old.instructions,v_old.hospital_name,v_old.address,v_old.image_url,
    v_old.start_date,v_old.end_date,null,null,false,'draft',false,true);
  for v_session in select * from public.camp_sessions where camp_id=p_camp_id loop
    v_sid := gen_random_uuid();
    insert into public.camp_sessions(id,camp_id,session_date,start_time,end_time,maximum_capacity,active,slot_duration_minutes,capacity_per_slot,breaks)
    values(v_sid,v_new,v_session.session_date,v_session.start_time,v_session.end_time,v_session.maximum_capacity,
      v_session.active,v_session.slot_duration_minutes,v_session.capacity_per_slot,v_session.breaks);
    insert into public.camp_slots(camp_id,session_id,start_time,end_time,capacity,active)
      select v_new,v_sid,start_time,end_time,capacity,active from public.camp_slots where session_id=v_session.id;
  end loop;
  insert into public.admin_activity_logs(admin_id,action,metadata)
    values(auth.uid(),'Camp duplicated',jsonb_build_object('source_camp_id',p_camp_id,'camp_id',v_new));
  return v_new;
end;
$$;
revoke all on function public.duplicate_admin_camp(uuid,text) from public;
grant execute on function public.duplicate_admin_camp(uuid,text) to authenticated;

create or replace function public.close_admin_camp(p_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_active_admin(array['super_admin','admin']::public.admin_role[]) then
    raise exception 'Administrator permission required' using errcode='42501';
  end if;
  update public.camps set lifecycle='closed',registration_open=false where id=p_id and lifecycle='published';
  if not found then raise exception 'Only a published camp can be closed' using errcode='P0002'; end if;
  insert into public.admin_activity_logs(admin_id,action,metadata)
    values(auth.uid(),'Camp registration closed',jsonb_build_object('camp_id',p_id));
end;
$$;
revoke all on function public.close_admin_camp(uuid) from public;
grant execute on function public.close_admin_camp(uuid) to authenticated;

create or replace function public.change_admin_camp_registration(p_registration_id uuid, p_action text, p_destination_slot uuid default null)
returns void language plpgsql security definer set search_path = '' as $$
declare v_row public.camp_registrations%rowtype; v_dest public.camp_slots%rowtype; v_old_token text; v_new_token text;
begin
  if not public.is_active_admin(array['super_admin','admin']::public.admin_role[]) then
    raise exception 'Administrator permission required' using errcode='42501';
  end if;
  select * into v_row from public.camp_registrations where id=p_registration_id for update;
  if not found then raise exception 'Registration not found' using errcode='P0002'; end if;
  v_old_token := v_row.token;
  if p_action='cancel' then
    if v_row.registration_status='Cancelled' then return; end if;
    update public.camp_registrations set registration_status='Cancelled',attendance_status='Cancelled' where id=p_registration_id;
  elsif p_action='attend' or p_action='no_show' then
    if v_row.registration_status='Cancelled' then raise exception 'Cancelled registration cannot be checked in' using errcode='22023'; end if;
    update public.camp_registrations set attendance_status=case when p_action='attend' then 'Attended'::public.attendance_status else 'No-show'::public.attendance_status end,
      attended_at=case when p_action='attend' then now() else null end where id=p_registration_id;
  elsif p_action='move' then
    if v_row.registration_status='Cancelled' then raise exception 'Cancelled registration cannot move' using errcode='22023'; end if;
    if p_destination_slot is null or p_destination_slot=v_row.camp_slot_id then raise exception 'Choose another slot' using errcode='22023'; end if;
    select * into v_dest from public.camp_slots where id=p_destination_slot and camp_id=v_row.camp_id for update;
    if not found or not v_dest.active then raise exception 'Destination slot unavailable' using errcode='P0002'; end if;
    if not exists(select 1 from public.camp_sessions where id=v_dest.session_id and active
      and session_date + v_dest.start_time > (now() at time zone 'Asia/Kolkata')) then
      raise exception 'Destination slot has passed' using errcode='P0002';
    end if;
    if (select count(*) from public.camp_registrations where camp_slot_id=p_destination_slot and registration_status <> 'Cancelled') >= v_dest.capacity then
      raise exception 'Destination slot is full' using errcode='P0002';
    end if;
    update public.camp_slots set token_sequence=token_sequence+1 where id=p_destination_slot returning token_sequence into v_dest.token_sequence;
    v_new_token := upper(substr(replace(p_destination_slot::text,'-',''),1,8)) || '-' || lpad(v_dest.token_sequence::text,3,'0');
    update public.camp_registrations set camp_slot_id=p_destination_slot,camp_session_id=v_dest.session_id,token=v_new_token,
      notification_status='Not Sent' where id=p_registration_id;
  else raise exception 'Unsupported action' using errcode='22023'; end if;
  insert into public.camp_registration_changes(registration_id,actor_id,action,old_slot_id,new_slot_id,old_token,new_token)
    values(p_registration_id,auth.uid(),p_action,v_row.camp_slot_id,
      case when p_action='move' then p_destination_slot else v_row.camp_slot_id end,v_old_token,coalesce(v_new_token,v_old_token));
  insert into public.admin_activity_logs(admin_id,action,registration_id,metadata)
    values(auth.uid(),'Camp registration ' || p_action,p_registration_id,jsonb_build_object('destination_slot',p_destination_slot));
end;
$$;
revoke all on function public.change_admin_camp_registration(uuid,text,uuid) from public;
grant execute on function public.change_admin_camp_registration(uuid,text,uuid) to authenticated;

create or replace function public.list_admin_camps()
returns jsonb language sql stable security definer set search_path = '' as $$
  select case when not public.is_active_admin() then null else coalesce(jsonb_agg(to_jsonb(c) order by c."firstDate" desc),'[]'::jsonb) end
  from (
    select c.id,c.name as title,c.slug,c.description,c.hospital_name as "venueName",c.address as "venueAddress",
      c.lifecycle,c.start_date as "firstDate",c.end_date as "lastDate",c.registration_opens_at as "registrationOpensAt",
      c.registration_closes_at as "registrationClosesAt",c.dates_reviewed as "datesReviewed",
      (select count(*) from public.camp_sessions s where s.camp_id=c.id) as "sessionCount",
      (select count(*) from public.camp_registrations r where r.camp_id=c.id and r.registration_status<>'Cancelled') as "registrationCount",
      (select coalesce(sum(s.capacity),0) from public.camp_slots s join public.camp_sessions cs on cs.id=s.session_id
        where s.camp_id=c.id and s.active and cs.active) as "capacity",
      (select coalesce(sum(greatest(s.capacity - (select count(*) from public.camp_registrations r
        where r.camp_slot_id=s.id and r.registration_status<>'Cancelled'),0)),0)
        from public.camp_slots s join public.camp_sessions cs on cs.id=s.session_id
        where s.camp_id=c.id and s.active and cs.active and cs.session_date + s.start_time > (now() at time zone 'Asia/Kolkata')) as "remainingUpcoming",
      (select coalesce(jsonb_agg(jsonb_build_object('id',s.id,'date',s.session_date,'startTime',s.start_time,'endTime',s.end_time,'active',s.active) order by s.session_date,s.start_time),'[]'::jsonb)
        from public.camp_sessions s where s.camp_id=c.id) as sessions
    from public.camps c
  ) c;
$$;
revoke all on function public.list_admin_camps() from public;
grant execute on function public.list_admin_camps() to authenticated;

create or replace function public.get_admin_camp(p_id uuid)
returns jsonb language sql stable security definer set search_path = '' as $$
  select case when not public.is_active_admin() then null else (
    select jsonb_build_object(
      'id',c.id,'title',c.name,'slug',c.slug,'description',c.description,
      'instructions',c.instructions,'venueName',c.hospital_name,'venueAddress',c.address,'imageUrl',c.image_url,
      'lifecycle',c.lifecycle,'registrationOpensAt',c.registration_opens_at,
      'registrationClosesAt',c.registration_closes_at,'datesReviewed',c.dates_reviewed,
      'sessions',coalesce((
        select jsonb_agg(jsonb_build_object(
          'id',s.id,'date',s.session_date,'startTime',s.start_time,'endTime',s.end_time,
          'active',s.active,'slotDurationMinutes',s.slot_duration_minutes,
          'capacityPerSlot',s.capacity_per_slot,'breaks',s.breaks,
          'slots',coalesce((
            select jsonb_agg(jsonb_build_object(
              'id',sl.id,'startTime',sl.start_time,'endTime',sl.end_time,
              'capacity',sl.capacity,'active',sl.active,
              'bookedCount',(select count(*) from public.camp_registrations r
                where r.camp_slot_id=sl.id and r.registration_status<>'Cancelled')
            ) order by sl.start_time)
            from public.camp_slots sl where sl.session_id=s.id
          ),'[]'::jsonb)
        ) order by s.session_date)
        from public.camp_sessions s where s.camp_id=c.id
      ),'[]'::jsonb)
    )
    from public.camps c where c.id=p_id
  ) end;
$$;
revoke all on function public.get_admin_camp(uuid) from public;
grant execute on function public.get_admin_camp(uuid) to authenticated;

create or replace function public.list_admin_camp_registrations(
  p_camp_id uuid default null,p_session_id uuid default null,p_slot_id uuid default null,
  p_registration_status text default null,p_attendance_status text default null,p_search text default null,
  p_page integer default 1,p_size integer default 20)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare v_result jsonb;
begin
  if not public.is_active_admin() then raise exception 'Unauthorized' using errcode='42501'; end if;
  if p_page<1 or p_size<1 or p_size>100 or length(coalesce(p_search,''))>120 then
    raise exception 'Invalid filters' using errcode='22023';
  end if;
  with filtered as (
    select r.id,r.camp_id,r.camp_session_id,r.camp_slot_id,r.participant_name,r.token,r.booking_reference,
      r.registration_status,r.attendance_status,r.confirmation_status,r.notification_status,r.created_at,
      p.full_name,p.phone,c.name as camp_name,cs.session_date,sl.start_time,sl.end_time
    from public.camp_registrations r
    join public.patients p on p.id=r.patient_id
    join public.camps c on c.id=r.camp_id
    left join public.camp_sessions cs on cs.id=r.camp_session_id
    left join public.camp_slots sl on sl.id=r.camp_slot_id
    where (p_camp_id is null or r.camp_id=p_camp_id)
      and (p_session_id is null or r.camp_session_id=p_session_id)
      and (p_slot_id is null or r.camp_slot_id=p_slot_id)
      and (p_registration_status is null or r.registration_status::text=p_registration_status)
      and (p_attendance_status is null or r.attendance_status::text=p_attendance_status)
      and (nullif(trim(p_search),'') is null or coalesce(r.participant_name,p.full_name) ilike '%' || trim(p_search) || '%'
        or p.phone ilike '%' || trim(p_search) || '%' or r.token ilike '%' || trim(p_search) || '%')
  )
  select jsonb_build_object('total',(select count(*) from filtered),
    'rows',coalesce((select jsonb_agg(to_jsonb(x) order by x.created_at desc)
      from (select * from filtered order by created_at desc,id desc limit p_size offset (p_page-1)*p_size) x),'[]'::jsonb))
  into v_result;
  return v_result;
end;
$$;
revoke all on function public.list_admin_camp_registrations(uuid,uuid,uuid,text,text,text,integer,integer) from public;
grant execute on function public.list_admin_camp_registrations(uuid,uuid,uuid,text,text,text,integer,integer) to authenticated;
