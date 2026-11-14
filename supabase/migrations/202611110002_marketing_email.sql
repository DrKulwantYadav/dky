-- Apply after the regular appointment migrations. No existing patient is opted in.
begin;

create table public.marketing_email_subscribers (
  email text primary key check (email = lower(trim(email)) and email ~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'),
  display_name text not null check (char_length(display_name) between 2 and 120),
  consent_source text not null check (consent_source = 'appointment_form'),
  consent_at timestamptz not null,
  unsubscribed_at timestamptz,
  unsubscribe_token uuid not null default gen_random_uuid() unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger marketing_email_subscribers_updated before update on public.marketing_email_subscribers
  for each row execute function public.set_updated_at();

-- Booking and optional, separate marketing consent commit in one transaction.
create function public.book_public_appointment_slot_with_marketing(
  p_slot_id uuid, p_full_name text, p_phone text, p_email text,
  p_age_group text, p_patient_type text, p_reason text,
  p_consent boolean, p_marketing_consent boolean
) returns uuid language plpgsql security definer set search_path = '' as $$
declare v_registration_id uuid; v_email text := lower(trim(coalesce(p_email,'')));
begin
  if p_marketing_consent is true and
     (v_email !~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' or char_length(v_email) > 254) then
    raise exception 'Email is required for marketing opt-in' using errcode = '22023';
  end if;
  v_registration_id := public.book_public_appointment_slot(p_slot_id,p_full_name,p_phone,p_email,
    p_age_group,p_patient_type,p_reason,p_consent);
  if p_marketing_consent is true then
    insert into public.marketing_email_subscribers
      (email,display_name,consent_source,consent_at)
    values (v_email,trim(p_full_name),'appointment_form',now())
    on conflict (email) do update set display_name = excluded.display_name,
      consent_source = excluded.consent_source, consent_at = excluded.consent_at,
      unsubscribed_at = null, unsubscribe_token = gen_random_uuid();
  end if;
  return v_registration_id;
end;
$$;
revoke all on function public.book_public_appointment_slot_with_marketing(uuid,text,text,text,text,text,text,boolean,boolean)
  from public, anon, authenticated;
grant execute on function public.book_public_appointment_slot_with_marketing(uuid,text,text,text,text,text,text,boolean,boolean)
  to anon, authenticated;

create function public.unsubscribe_marketing_email(p_token uuid)
returns boolean language plpgsql security definer set search_path = '' as $$
begin
  if auth.role() <> 'service_role' then raise exception 'Unauthorized' using errcode = '42501'; end if;
  update public.marketing_email_subscribers set unsubscribed_at = coalesce(unsubscribed_at,now())
    where unsubscribe_token = p_token;
  return found;
end;
$$;
revoke all on function public.unsubscribe_marketing_email(uuid) from public, anon, authenticated;
grant execute on function public.unsubscribe_marketing_email(uuid) to service_role;

create table public.marketing_email_campaigns (
  id uuid primary key default gen_random_uuid(),
  subject text not null check (char_length(subject) between 3 and 150),
  body text not null check (char_length(body) between 10 and 10000),
  cta_label text check (cta_label is null or char_length(cta_label) between 2 and 60),
  cta_url text check (cta_url is null or char_length(cta_url) <= 1000),
  sender_email text,
  status text not null default 'draft' check (status in ('draft','sending','sent','partial')),
  recipient_count integer not null default 0,
  created_by uuid not null references public.admin_profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  queued_at timestamptz,
  finished_at timestamptz,
  constraint marketing_cta_both check ((cta_label is null) = (cta_url is null))
);
create trigger marketing_email_campaigns_updated before update on public.marketing_email_campaigns
  for each row execute function public.set_updated_at();

create table public.marketing_email_campaign_deliveries (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.marketing_email_campaigns(id) on delete restrict,
  recipient_email text not null,
  recipient_name text not null,
  unsubscribe_token uuid not null,
  status text not null default 'pending'
    check (status in ('pending','processing','sent','failed','uncertain','skipped')),
  attempts integer not null default 0 check (attempts between 0 and 5),
  claim_token uuid,
  lease_until timestamptz,
  first_attempt_at timestamptz,
  provider_id text,
  error_code text,
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  unique (campaign_id,recipient_email)
);
create index marketing_campaign_delivery_status_idx
  on public.marketing_email_campaign_deliveries(campaign_id,status);

alter table public.marketing_email_subscribers enable row level security;
alter table public.marketing_email_campaigns enable row level security;
alter table public.marketing_email_campaign_deliveries enable row level security;
revoke all on public.marketing_email_subscribers,public.marketing_email_campaigns,
  public.marketing_email_campaign_deliveries from public,anon,authenticated;
grant select (email,display_name,consent_source,consent_at,unsubscribed_at,created_at)
  on public.marketing_email_subscribers to authenticated;
grant select on public.marketing_email_campaigns to authenticated;
grant select (id,campaign_id,recipient_email,recipient_name,status,attempts,error_code,sent_at,created_at)
  on public.marketing_email_campaign_deliveries to authenticated;
grant insert,update on public.marketing_email_campaigns to authenticated;
grant select,insert,update on public.marketing_email_subscribers,public.marketing_email_campaigns,
  public.marketing_email_campaign_deliveries to service_role;
create policy marketing_subscribers_admin_read on public.marketing_email_subscribers
  for select to authenticated using (public.is_active_admin(array['super_admin','admin']::public.admin_role[]));
create policy marketing_campaigns_admin_read on public.marketing_email_campaigns
  for select to authenticated using (public.is_active_admin(array['super_admin','admin']::public.admin_role[]));
create policy marketing_campaigns_admin_insert on public.marketing_email_campaigns
  for insert to authenticated with check (public.is_active_admin(array['super_admin','admin']::public.admin_role[])
    and created_by = auth.uid() and status = 'draft');
create policy marketing_campaigns_admin_update on public.marketing_email_campaigns
  for update to authenticated using (status = 'draft' and public.is_active_admin(array['super_admin','admin']::public.admin_role[]))
  with check (status = 'draft' and public.is_active_admin(array['super_admin','admin']::public.admin_role[])
    and created_by = auth.uid());
create policy marketing_deliveries_admin_read on public.marketing_email_campaign_deliveries
  for select to authenticated using (public.is_active_admin(array['super_admin','admin']::public.admin_role[]));

-- Freeze the general opt-in list at send time; no patient records are swept in.
create function public.queue_marketing_email_campaign(p_id uuid,p_sender_email text)
returns integer language plpgsql security definer set search_path = '' as $$
declare v_campaign public.marketing_email_campaigns%rowtype; v_count integer;
begin
  if not public.is_active_admin(array['super_admin','admin']::public.admin_role[]) then
    raise exception 'Unauthorized' using errcode = '42501'; end if;
  if p_sender_email is null or p_sender_email !~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' then
    raise exception 'Invalid sender' using errcode = '22023'; end if;
  select * into v_campaign from public.marketing_email_campaigns where id=p_id for update;
  if not found then raise exception 'Campaign not found' using errcode = '22023'; end if;
  if v_campaign.status <> 'draft' then return v_campaign.recipient_count; end if;
  insert into public.marketing_email_campaign_deliveries
    (campaign_id,recipient_email,recipient_name,unsubscribe_token)
  select p_id,s.email,s.display_name,s.unsubscribe_token
  from public.marketing_email_subscribers s
  where s.consent_at is not null and s.unsubscribed_at is null
  on conflict (campaign_id,recipient_email) do nothing;
  get diagnostics v_count = row_count;
  if v_count = 0 then raise exception 'No opted-in recipients' using errcode = '22023'; end if;
  update public.marketing_email_campaigns set status='sending',recipient_count=v_count,
    sender_email=lower(trim(p_sender_email)),queued_at=now() where id=p_id;
  insert into public.admin_activity_logs(admin_id,action,metadata)
    values (auth.uid(),'Marketing email campaign queued',jsonb_build_object('campaign_id',p_id,'recipients',v_count));
  return v_count;
end;
$$;
revoke all on function public.queue_marketing_email_campaign(uuid,text) from public,anon,authenticated;
grant execute on function public.queue_marketing_email_campaign(uuid,text) to authenticated;

create function public.claim_marketing_email_delivery(p_id uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_delivery public.marketing_email_campaign_deliveries%rowtype;
  v_campaign public.marketing_email_campaigns%rowtype; v_claim uuid := gen_random_uuid();
begin
  if auth.role() <> 'service_role' then raise exception 'Unauthorized' using errcode = '42501'; end if;
  select * into v_delivery from public.marketing_email_campaign_deliveries where id=p_id for update;
  if not found then return null; end if;
  select * into v_campaign from public.marketing_email_campaigns where id=v_delivery.campaign_id;
  if v_campaign.status not in ('sending','partial') or v_delivery.status in ('sent','skipped')
    or v_delivery.attempts >= 5
    or (v_delivery.status='processing' and v_delivery.lease_until > now())
    or (v_delivery.first_attempt_at is not null and now() > v_delivery.first_attempt_at + interval '23 hours')
    then return null; end if;
  if not exists (select 1 from public.marketing_email_subscribers s
      where s.email=v_delivery.recipient_email and s.consent_at is not null
        and s.unsubscribed_at is null and s.unsubscribe_token=v_delivery.unsubscribe_token) then
    update public.marketing_email_campaign_deliveries
      set status='skipped',error_code='unsubscribed',claim_token=null,lease_until=null where id=p_id;
    return null;
  end if;
  update public.marketing_email_campaign_deliveries set status='processing',
    attempts=attempts+1,claim_token=v_claim,lease_until=now()+interval '2 minutes',
    first_attempt_at=coalesce(first_attempt_at,now()),error_code=null where id=p_id;
  return jsonb_build_object('id',v_delivery.id,'claimToken',v_claim,'campaignId',v_campaign.id,
    'recipientEmail',v_delivery.recipient_email,'recipientName',v_delivery.recipient_name,
    'unsubscribeToken',v_delivery.unsubscribe_token,'senderEmail',v_campaign.sender_email,
    'subject',v_campaign.subject,'body',v_campaign.body,'ctaLabel',v_campaign.cta_label,
    'ctaUrl',v_campaign.cta_url);
end;
$$;
revoke all on function public.claim_marketing_email_delivery(uuid) from public,anon,authenticated;
grant execute on function public.claim_marketing_email_delivery(uuid) to service_role;

create function public.finish_marketing_email_delivery(p_id uuid,p_claim_token uuid,
  p_status text,p_provider_id text default null,p_error_code text default null)
returns boolean language plpgsql security definer set search_path = '' as $$
begin
  if auth.role() <> 'service_role' then raise exception 'Unauthorized' using errcode = '42501'; end if;
  if p_status not in ('sent','failed','uncertain') then raise exception 'Invalid status' using errcode='22023'; end if;
  update public.marketing_email_campaign_deliveries
    set status=p_status,provider_id=case when p_status='sent' then p_provider_id else null end,
      error_code=case when p_status='sent' then null else left(coalesce(p_error_code,'unknown'),80) end,
      sent_at=case when p_status='sent' then now() else null end,
      claim_token=null,lease_until=null
    where id=p_id and status='processing' and claim_token=p_claim_token;
  return found;
end;
$$;
revoke all on function public.finish_marketing_email_delivery(uuid,uuid,text,text,text) from public,anon,authenticated;
grant execute on function public.finish_marketing_email_delivery(uuid,uuid,text,text,text) to service_role;

create function public.finalize_marketing_email_campaign(p_id uuid)
returns text language plpgsql security definer set search_path = '' as $$
declare v_pending integer; v_unfinished integer; v_status text;
begin
  if auth.role() <> 'service_role' then raise exception 'Unauthorized' using errcode = '42501'; end if;
  select count(*) into v_pending from public.marketing_email_campaign_deliveries
    where campaign_id=p_id and status='pending';
  select count(*) into v_unfinished from public.marketing_email_campaign_deliveries
    where campaign_id=p_id and status in ('processing','failed','uncertain');
  v_status := case when v_pending=0 and v_unfinished=0 then 'sent' else 'partial' end;
  update public.marketing_email_campaigns set status=v_status,
    finished_at=case when v_status='sent' then now() else null end
    where id=p_id and status in ('sending','partial');
  return v_status;
end;
$$;
revoke all on function public.finalize_marketing_email_campaign(uuid) from public,anon,authenticated;
grant execute on function public.finalize_marketing_email_campaign(uuid) to service_role;
commit;
