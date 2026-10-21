-- Apply after 202610210002. Existing registrations and issued tokens are unchanged.
-- A place prefix is chosen by an administrator for each camp, not inferred from an address.
alter table public.camps add column if not exists token_prefix text;
alter table public.camps add constraint camps_token_prefix_three_letters
  check (token_prefix is null or token_prefix ~ '^[A-Z]{3}$') not valid;

create function public.camp_token_format_ready()
returns boolean language sql stable security definer set search_path = '' as $$
  select auth.role()='service_role' or public.is_active_admin();
$$;
revoke all on function public.camp_token_format_ready() from public, anon;
grant execute on function public.camp_token_format_ready() to authenticated, service_role;

-- Keep the original configuration save in the same transaction as the new prefix.
alter function public.save_admin_camp(jsonb) rename to save_admin_camp_configuration;
revoke all on function public.save_admin_camp_configuration(jsonb) from public, anon, authenticated;
create function public.save_admin_camp(p_config jsonb)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  v_prefix text := nullif(p_config->>'tokenPrefix','');
  v_existing text;
  v_id uuid;
  v_requested_id uuid := nullif(p_config->>'id','')::uuid;
begin
  if not public.is_active_admin(array['super_admin','admin']::public.admin_role[]) then
    raise exception 'Administrator permission required' using errcode='42501';
  end if;
  if (v_prefix is not null and v_prefix !~ '^[A-Z]{3}$')
     or (p_config->>'lifecycle' = 'published' and v_prefix is null) then
    raise exception 'Choose a three-letter queue token place code before publishing' using errcode='22023';
  end if;
  if v_requested_id is not null then
    select token_prefix into v_existing from public.camps where id=v_requested_id for update;
    if v_existing is not null and v_existing is distinct from v_prefix
       and exists(select 1 from public.camp_registrations where camp_id=v_requested_id) then
      raise exception 'The place code cannot change after registrations exist' using errcode='22023';
    end if;
  end if;
  v_id := public.save_admin_camp_configuration(p_config);
  update public.camps set token_prefix=v_prefix where id=v_id;
  return v_id;
end;
$$;
revoke all on function public.save_admin_camp(jsonb) from public, anon;
grant execute on function public.save_admin_camp(jsonb) to authenticated;

alter function public.get_admin_camp(uuid) rename to get_admin_camp_configuration;
revoke all on function public.get_admin_camp_configuration(uuid) from public, anon, authenticated;
create function public.get_admin_camp(p_id uuid)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare v_config jsonb; v_prefix text;
begin
  v_config := public.get_admin_camp_configuration(p_id);
  if v_config is null then return null; end if;
  select token_prefix into v_prefix from public.camps where id=p_id;
  return v_config || jsonb_build_object('tokenPrefix',coalesce(v_prefix,''));
end;
$$;
revoke all on function public.get_admin_camp(uuid) from public, anon;
grant execute on function public.get_admin_camp(uuid) to authenticated;

-- A short human token identifies queue position only within its camp/date/window.
-- Booking reference remains globally unique. Two dates may legitimately show the
-- same human token, so the old camp-wide token index must become slot-scoped.
drop index if exists public.camp_registration_token_per_camp_unique;
create unique index if not exists camp_registration_token_per_slot_unique
  on public.camp_registrations(camp_slot_id,token)
  where camp_slot_id is not null and token is not null;

create function public.assign_short_camp_queue_token()
returns trigger language plpgsql security definer set search_path = '' as $$
declare v_prefix text; v_start time; v_hour integer; v_minute integer; v_clock text; v_number text;
begin
  if new.camp_slot_id is null or new.token_number is null then return new; end if;
  select c.token_prefix, sl.start_time into v_prefix,v_start
    from public.camp_slots sl join public.camps c on c.id=sl.camp_id
    where sl.id=new.camp_slot_id and c.id=new.camp_id;
  if v_prefix is null then return new; end if;
  v_hour := extract(hour from v_start)::integer;
  v_minute := extract(minute from v_start)::integer;
  v_clock := case when v_hour % 12 = 0 then '12' else (v_hour % 12)::text end
    || case when v_minute = 0 then '' else lpad(v_minute::text,2,'0') end
    || case when v_hour < 12 then 'AM' else 'PM' end;
  v_number := new.token_number::text;
  new.token := v_prefix || '-' || v_clock || '-' ||
    case when length(v_number)<3 then lpad(v_number,3,'0') else v_number end;
  return new;
end;
$$;
revoke all on function public.assign_short_camp_queue_token() from public, anon, authenticated;
create trigger camp_short_queue_token before insert or update of camp_slot_id,token_number,token
  on public.camp_registrations for each row execute function public.assign_short_camp_queue_token();

-- The existing admin move/reactivation function records an audit row immediately
-- after updating the registration. Capture the actual trigger-assigned short token.
create function public.audit_short_camp_queue_token()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.action in ('move','reactivate') then
    select token into new.new_token from public.camp_registrations where id=new.registration_id;
  end if;
  return new;
end;
$$;
revoke all on function public.audit_short_camp_queue_token() from public, anon, authenticated;
create trigger camp_change_short_queue_token before insert on public.camp_registration_changes
  for each row execute function public.audit_short_camp_queue_token();
