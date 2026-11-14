-- Apply after 202611110001 and 202611110002.
-- Gmail messages.send has no provider idempotency key. Once a send may have
-- reached Gmail, an uncertain or expired processing attempt must be reviewed,
-- never automatically claimed a second time.
begin;

create or replace function public.claim_regular_appointment_digest(p_id uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_delivery public.regular_appointment_digest_deliveries%rowtype;
  v_run public.regular_appointment_digest_runs%rowtype;
  v_claim uuid := pg_catalog.gen_random_uuid();
begin
  if auth.role() <> 'service_role' then raise exception 'Unauthorized' using errcode = '42501'; end if;
  select * into v_delivery from public.regular_appointment_digest_deliveries where id=p_id for update;
  if not found then return null; end if;
  if v_delivery.status = 'processing' then
    if v_delivery.lease_until <= now() then
      update public.regular_appointment_digest_deliveries
        set status='uncertain',error_code='gmail_lease_expired',claim_token=null,lease_until=null
        where id=p_id;
    end if;
    return null;
  end if;
  if v_delivery.status not in ('pending','failed') or v_delivery.attempts >= 5 then return null; end if;
  select * into v_run from public.regular_appointment_digest_runs where digest_date=v_delivery.digest_date;
  if not found or (v_delivery.attempts > 0 and now() > v_run.cutoff_at + interval '23 hours') then return null; end if;
  if not exists (select 1 from public.admin_profiles p join auth.users u on u.id=p.id
      where p.id=v_delivery.recipient_user_id and p.active and u.email_confirmed_at is not null
        and lower(trim(u.email))=v_delivery.recipient_email) then
    update public.regular_appointment_digest_deliveries
      set status='failed',attempts=5,error_code='recipient_inactive',claim_token=null,lease_until=null
      where id=p_id;
    return null;
  end if;
  update public.regular_appointment_digest_deliveries
    set status='processing',attempts=attempts+1,claim_token=v_claim,
      lease_until=now()+interval '2 minutes',last_attempt_at=now(),error_code=null where id=p_id;
  return jsonb_build_object('id',v_delivery.id,'claimToken',v_claim,
    'date',v_run.digest_date,'cutoffAt',v_run.cutoff_at,'senderEmail',v_run.sender_email,
    'todayRequests',v_run.today_requests,'tomorrowRequests',v_run.tomorrow_requests,
    'recipientEmail',v_delivery.recipient_email);
end;
$$;
revoke all on function public.claim_regular_appointment_digest(uuid) from public,anon,authenticated;
grant execute on function public.claim_regular_appointment_digest(uuid) to service_role;

create or replace function public.claim_regular_patient_reminder(p_id uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_delivery public.regular_appointment_patient_reminder_deliveries%rowtype;
  v_run public.regular_appointment_digest_runs%rowtype;
  v_claim uuid := pg_catalog.gen_random_uuid();
begin
  if auth.role() <> 'service_role' then raise exception 'Unauthorized' using errcode = '42501'; end if;
  select * into v_delivery from public.regular_appointment_patient_reminder_deliveries
    where id = p_id for update;
  if not found then return null; end if;
  if v_delivery.status = 'processing' then
    if v_delivery.lease_until <= now() then
      update public.regular_appointment_patient_reminder_deliveries
        set status='uncertain',error_code='gmail_lease_expired',claim_token=null,lease_until=null
        where id=p_id;
    end if;
    return null;
  end if;
  if v_delivery.status not in ('pending','failed') or v_delivery.attempts >= 5 then return null; end if;
  select * into v_run from public.regular_appointment_digest_runs
    where digest_date = v_delivery.digest_date;
  if not found or (now() at time zone 'Asia/Kolkata')::date <> v_delivery.digest_date
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
      set status='skipped',error_code='booking_changed',claim_token=null,lease_until=null
      where id=p_id;
    return null;
  end if;
  update public.regular_appointment_patient_reminder_deliveries
    set status='processing',attempts=attempts+1,claim_token=v_claim,
        lease_until=now()+interval '2 minutes',last_attempt_at=now(),error_code=null
    where id=p_id;
  return jsonb_build_object('id',v_delivery.id,'claimToken',v_claim,
    'date',v_delivery.digest_date,'cutoffAt',v_run.cutoff_at,
    'recipientEmail',v_delivery.recipient_email,'recipientName',v_delivery.recipient_name,
    'appointmentDate',v_delivery.appointment_date,
    'appointmentTime',v_delivery.appointment_time,
    'appointmentTimeWindow',v_delivery.appointment_time_window,
    'senderEmail',v_run.sender_email);
end;
$$;
revoke all on function public.claim_regular_patient_reminder(uuid) from public,anon,authenticated;
grant execute on function public.claim_regular_patient_reminder(uuid) to service_role;

create or replace function public.claim_marketing_email_delivery(p_id uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_delivery public.marketing_email_campaign_deliveries%rowtype;
  v_campaign public.marketing_email_campaigns%rowtype;
  v_claim uuid := pg_catalog.gen_random_uuid();
begin
  if auth.role() <> 'service_role' then raise exception 'Unauthorized' using errcode = '42501'; end if;
  select * into v_delivery from public.marketing_email_campaign_deliveries where id=p_id for update;
  if not found then return null; end if;
  if v_delivery.status = 'processing' then
    if v_delivery.lease_until <= now() then
      update public.marketing_email_campaign_deliveries
        set status='uncertain',error_code='gmail_lease_expired',claim_token=null,lease_until=null
        where id=p_id;
    end if;
    return null;
  end if;
  if v_delivery.status not in ('pending','failed') or v_delivery.attempts >= 5
    or (v_delivery.first_attempt_at is not null
      and now() > v_delivery.first_attempt_at + interval '23 hours') then return null; end if;
  select * into v_campaign from public.marketing_email_campaigns where id=v_delivery.campaign_id;
  if v_campaign.status not in ('sending','partial') then return null; end if;
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
commit;
