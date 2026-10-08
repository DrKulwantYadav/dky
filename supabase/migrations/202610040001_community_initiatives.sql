create table public.community_initiatives (
  id uuid primary key default gen_random_uuid(),
  title text not null check (length(trim(title)) between 3 and 180),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  summary text not null default '',
  purpose text not null default '',
  highlights text not null default '',
  topic text not null default '',
  status text not null default 'Draft' check (status in ('Draft','Upcoming','Completed','Archived')),
  start_date date,
  end_date date,
  venue text not null default '',
  cover_media_id uuid,
  original_campaign_url text,
  registration_url text,
  appointment_url text not null default '/book-appointment',
  seo_title text,
  seo_description text,
  is_published boolean not null default false,
  published_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (end_date is null or start_date is null or end_date >= start_date),
  check (not is_published or (status in ('Upcoming','Completed') and start_date is not null and length(trim(venue)) > 0 and length(trim(summary)) > 0))
);

create table public.initiative_services (
  id uuid primary key default gen_random_uuid(),
  initiative_id uuid not null references public.community_initiatives(id) on delete cascade,
  title text not null,
  description text not null default '',
  is_delivered boolean not null default false,
  sort_order integer not null default 0
);

create table public.initiative_statistics (
  id uuid primary key default gen_random_uuid(),
  initiative_id uuid not null references public.community_initiatives(id) on delete cascade,
  label text not null,
  value text not null,
  is_public boolean not null default false,
  sort_order integer not null default 0
);

create table public.initiative_media (
  id uuid primary key default gen_random_uuid(),
  initiative_id uuid not null references public.community_initiatives(id) on delete cascade,
  public_id text not null unique,
  secure_url text not null,
  resource_type text not null check (resource_type in ('image','video','raw')),
  width integer,
  height integer,
  format text,
  bytes bigint,
  caption text not null default '',
  alt_text text not null default '',
  group_label text not null default '',
  sort_order integer not null default 0,
  is_cover boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.community_initiatives add constraint community_cover_media_fk
  foreign key (cover_media_id) references public.initiative_media(id) on delete set null deferrable initially deferred;

create table public.initiative_coverage (
  id uuid primary key default gen_random_uuid(),
  initiative_id uuid not null references public.community_initiatives(id) on delete cascade,
  coverage_type text not null check (coverage_type in ('Newspaper Clipping','Online Article','Video','Social Update')),
  publication_name text not null,
  headline text not null,
  published_date date,
  source_url text,
  media_id uuid references public.initiative_media(id) on delete set null,
  summary text not null default '',
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index community_initiatives_published_idx on public.community_initiatives(is_published, status, start_date desc);
create index community_initiatives_topic_idx on public.community_initiatives(topic);
create index community_initiatives_created_idx on public.community_initiatives(created_at desc);
create index community_initiatives_creator_idx on public.community_initiatives(created_by);
create index community_initiatives_cover_idx on public.community_initiatives(cover_media_id);
create index initiative_services_parent_idx on public.initiative_services(initiative_id, sort_order);
create index initiative_statistics_parent_idx on public.initiative_statistics(initiative_id, sort_order);
create index initiative_media_parent_idx on public.initiative_media(initiative_id, sort_order);
create index initiative_coverage_parent_idx on public.initiative_coverage(initiative_id, sort_order);
create index initiative_coverage_media_idx on public.initiative_coverage(media_id);
create trigger community_initiatives_updated before update on public.community_initiatives
  for each row execute function public.set_updated_at();

alter table public.community_initiatives enable row level security;
alter table public.initiative_services enable row level security;
alter table public.initiative_statistics enable row level security;
alter table public.initiative_media enable row level security;
alter table public.initiative_coverage enable row level security;

create policy community_public_read on public.community_initiatives for select to anon, authenticated
  using (is_published);
create policy community_admin_read on public.community_initiatives for select to authenticated
  using (public.is_active_admin(array['super_admin','admin']::public.admin_role[]));
create policy community_admin_insert on public.community_initiatives for insert to authenticated
  with check (public.is_active_admin(array['super_admin','admin']::public.admin_role[]) and created_by = auth.uid());
create policy community_admin_update on public.community_initiatives for update to authenticated
  using (public.is_active_admin(array['super_admin','admin']::public.admin_role[]))
  with check (public.is_active_admin(array['super_admin','admin']::public.admin_role[]));
create policy community_admin_delete on public.community_initiatives for delete to authenticated
  using (public.is_active_admin(array['super_admin','admin']::public.admin_role[]));

create policy services_read on public.initiative_services for select to anon, authenticated
  using (is_delivered and exists (select 1 from public.community_initiatives i where i.id = initiative_id and i.is_published));
create policy services_admin_read on public.initiative_services for select to authenticated
  using (public.is_active_admin(array['super_admin','admin']::public.admin_role[]));
create policy services_write on public.initiative_services for all to authenticated
  using (public.is_active_admin(array['super_admin','admin']::public.admin_role[]))
  with check (public.is_active_admin(array['super_admin','admin']::public.admin_role[]));
create policy statistics_read on public.initiative_statistics for select to anon, authenticated
  using (is_public and exists (select 1 from public.community_initiatives i where i.id = initiative_id and i.is_published));
create policy statistics_admin_read on public.initiative_statistics for select to authenticated
  using (public.is_active_admin(array['super_admin','admin']::public.admin_role[]));
create policy statistics_write on public.initiative_statistics for all to authenticated
  using (public.is_active_admin(array['super_admin','admin']::public.admin_role[]))
  with check (public.is_active_admin(array['super_admin','admin']::public.admin_role[]));
create policy media_read on public.initiative_media for select to anon, authenticated
  using (exists (select 1 from public.community_initiatives i where i.id = initiative_id and i.is_published));
create policy media_admin_read on public.initiative_media for select to authenticated
  using (public.is_active_admin(array['super_admin','admin']::public.admin_role[]));
create policy media_write on public.initiative_media for all to authenticated
  using (public.is_active_admin(array['super_admin','admin']::public.admin_role[]))
  with check (public.is_active_admin(array['super_admin','admin']::public.admin_role[]));
create policy coverage_read on public.initiative_coverage for select to anon, authenticated
  using (exists (select 1 from public.community_initiatives i where i.id = initiative_id and i.is_published));
create policy coverage_admin_read on public.initiative_coverage for select to authenticated
  using (public.is_active_admin(array['super_admin','admin']::public.admin_role[]));
create policy coverage_write on public.initiative_coverage for all to authenticated
  using (public.is_active_admin(array['super_admin','admin']::public.admin_role[]))
  with check (public.is_active_admin(array['super_admin','admin']::public.admin_role[]));

insert into public.community_initiatives
  (title, slug, summary, topic, status, start_date, end_date, venue, original_campaign_url, is_published)
values
  ('September Heart Health Initiative 2026', 'heart-health-september-2026',
   'A month-long community initiative offering free ECG and heart checkups at Gopinath Hospital, Bhiwadi.',
   'Heart Health', 'Completed', null, null, 'Gopinath Hospital, Bhiwadi, Rajasthan',
   'https://www.drkulwantyadav.com/world-heart-day-free-ecg-camp', false),
  ('Fatty Liver & FibroScan Camp — 2026', 'fatty-liver-fibroscan-camp-2026',
   'A community screening initiative focused on fatty liver awareness and FibroScan assessment at Gopinath Hospital, Bhiwadi.',
   'Liver Health', 'Completed', null, null, 'Gopinath Hospital, Bhiwadi, Rajasthan', null, false)
on conflict (slug) do nothing;
