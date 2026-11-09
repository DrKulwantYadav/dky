-- Apply after 202611060001_findrisc_leads.sql. Do not backfill older leads:
-- they did not explicitly request an emailed report.
begin;
alter table public.findrisc_leads
  add column report_status text not null default 'not_requested'
    check (report_status in ('not_requested','pending','processing','accepted','failed')),
  add column report_attempts integer not null default 0 check (report_attempts between 0 and 5),
  add column report_next_attempt_at timestamptz,
  add column report_claim_token uuid,
  add column report_lease_until timestamptz,
  add column report_provider_id text,
  add column report_error_code text,
  add column report_accepted_at timestamptz,
  add constraint findrisc_report_recipient_required check
    (report_status = 'not_requested' or contact_email is not null),
  add constraint findrisc_report_due_required check
    (report_status <> 'pending' or report_next_attempt_at is not null);

create index findrisc_reports_due_idx on public.findrisc_leads(report_next_attempt_at)
  where report_status in ('pending','processing');

-- A newly inserted lead is the durable email job. Its pending state is committed
-- atomically with the score and contact details; older leads stay not_requested.
create or replace function public.list_due_findrisc_reports(p_limit integer default 20)
returns uuid[] language plpgsql security definer set search_path = '' as $$
declare v_ids uuid[];
begin
  if auth.role() <> 'service_role' then raise exception 'Unauthorized' using errcode = '42501'; end if;
  if p_limit not between 1 and 100 then raise exception 'Invalid limit' using errcode = '22023'; end if;
  -- Resend only deduplicates for 24 hours. Do not automatically retry an
  -- uncertain request beyond 20 hours; leave it for staff review.
  update public.findrisc_leads set report_status = 'failed',
    report_error_code = 'retry_window_expired', report_next_attempt_at = null,
    report_claim_token = null, report_lease_until = null
  where report_status in ('pending','processing') and created_at <= now() - interval '20 hours';
  update public.findrisc_leads set report_status = 'failed',
    report_error_code = 'attempts_exhausted', report_next_attempt_at = null,
    report_claim_token = null, report_lease_until = null
  where report_status in ('pending','processing') and report_attempts >= 5
    and (report_status = 'pending' or report_lease_until < now());
  select coalesce(array_agg(id), '{}'::uuid[]) into v_ids from (
    select id from public.findrisc_leads
    where report_status in ('pending','processing') and report_attempts < 5
      and created_at > now() - interval '20 hours'
      and report_next_attempt_at <= now()
      and (report_status = 'pending' or report_lease_until < now())
    order by report_next_attempt_at, created_at limit p_limit
  ) due;
  return v_ids;
end;
$$;

create or replace function public.claim_findrisc_report(p_id uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_row public.findrisc_leads%rowtype; v_claim uuid;
begin
  if auth.role() <> 'service_role' then raise exception 'Unauthorized' using errcode = '42501'; end if;
  select * into v_row from public.findrisc_leads where id = p_id
    and report_status in ('pending','processing') and report_attempts < 5
    and created_at > now() - interval '20 hours'
    and report_next_attempt_at <= now()
    and (report_status = 'pending' or report_lease_until < now())
    for update skip locked;
  if not found then return null; end if;
  v_claim := gen_random_uuid();
  update public.findrisc_leads set report_status = 'processing',
    report_attempts = report_attempts + 1, report_claim_token = v_claim,
    report_lease_until = now() + interval '2 minutes'
  where id = p_id;
  return jsonb_build_object('id',v_row.id,'claimToken',v_claim,'name',v_row.attendee_name,
    'email',v_row.contact_email,'score',v_row.score,'tier',v_row.risk_tier);
end;
$$;

create or replace function public.finish_findrisc_report(
  p_id uuid, p_claim_token uuid, p_accepted boolean,
  p_provider_id text default null, p_error_code text default null, p_retryable boolean default false)
returns boolean language plpgsql security definer set search_path = '' as $$
declare v_attempts integer; v_created timestamptz;
begin
  if auth.role() <> 'service_role' then raise exception 'Unauthorized' using errcode = '42501'; end if;
  if p_accepted and (p_provider_id is null or char_length(p_provider_id) > 200) then
    raise exception 'Invalid provider id' using errcode = '22023';
  end if;
  if p_error_code is not null and char_length(p_error_code) > 80 then
    raise exception 'Invalid error code' using errcode = '22023';
  end if;
  select report_attempts, created_at into v_attempts, v_created
    from public.findrisc_leads where id = p_id and report_status = 'processing'
      and report_claim_token = p_claim_token for update;
  if not found then return false; end if;
  if p_accepted then
    update public.findrisc_leads set report_status = 'accepted', report_accepted_at = now(),
      report_provider_id = p_provider_id, report_error_code = null,
      report_next_attempt_at = null, report_claim_token = null, report_lease_until = null
    where id = p_id;
  elsif p_retryable and v_attempts < 5 and v_created > now() - interval '20 hours' then
    update public.findrisc_leads set report_status = 'pending',
      report_error_code = coalesce(p_error_code,'delivery_retry'),
      report_next_attempt_at = now() + make_interval(secs => least(3600, 60 * (4 ^ (v_attempts - 1))::integer)),
      report_claim_token = null, report_lease_until = null
    where id = p_id;
  else
    update public.findrisc_leads set report_status = 'failed',
      report_error_code = coalesce(p_error_code,'delivery_failed'),
      report_next_attempt_at = null, report_claim_token = null, report_lease_until = null
    where id = p_id;
  end if;
  return true;
end;
$$;

revoke all on function public.list_due_findrisc_reports(integer) from public, anon, authenticated;
revoke all on function public.claim_findrisc_report(uuid) from public, anon, authenticated;
revoke all on function public.finish_findrisc_report(uuid,uuid,boolean,text,text,boolean) from public, anon, authenticated;
grant execute on function public.list_due_findrisc_reports(integer) to service_role;
grant execute on function public.claim_findrisc_report(uuid) to service_role;
grant execute on function public.finish_findrisc_report(uuid,uuid,boolean,text,text,boolean) to service_role;
commit;
