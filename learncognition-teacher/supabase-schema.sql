-- ============================================================
--  LearnCognition — Supabase Schema
--  Run this in the Supabase SQL Editor (Dashboard → SQL Editor)
-- ============================================================

-- ─────────────────────────────────────────────
-- 1. PROFILES  (auto-created on user sign-up)
-- ─────────────────────────────────────────────
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   text,
  school      text,
  avatar_url  text,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- Trigger: create profile row automatically when a new user signs up
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id) values (new.id) on conflict do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ─────────────────────────────────────────────
-- 2. MODULES
-- ─────────────────────────────────────────────
create table if not exists public.modules (
  id              uuid primary key default gen_random_uuid(),
  teacher_id      uuid not null references public.profiles(id) on delete cascade,
  title           text not null,
  description     text,
  subject         text,
  difficulty      text check (difficulty in ('beginner', 'intermediate', 'advanced')) default 'beginner',
  cover_image_url text,
  status          text check (status in ('draft', 'published', 'archived')) default 'draft',
  is_sequential   boolean default false,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

create index if not exists modules_teacher_id_idx on public.modules(teacher_id);

-- ─────────────────────────────────────────────
-- 3. OBJECTS  (items inside a module)
-- ─────────────────────────────────────────────
create table if not exists public.objects (
  id           uuid primary key default gen_random_uuid(),
  module_id    uuid not null references public.modules(id) on delete cascade,
  name         text not null,
  description  text not null,
  image_url    text,
  audio_url    text,
  order_index  integer default 0,
  created_at   timestamptz default now()
);

create index if not exists objects_module_id_idx on public.objects(module_id);

-- ─────────────────────────────────────────────
-- 4. STUDENT SESSIONS  (anonymous, created by Unity AR app)
-- ─────────────────────────────────────────────
create table if not exists public.student_sessions (
  id           uuid primary key default gen_random_uuid(),
  module_id    uuid not null references public.modules(id) on delete cascade,
  student_name text not null,
  started_at   timestamptz default now(),
  completed_at timestamptz,
  device_info  text
);

create index if not exists student_sessions_module_id_idx on public.student_sessions(module_id);

-- ─────────────────────────────────────────────
-- 5. OBJECT DISCOVERIES  (recorded by Unity AR app)
-- ─────────────────────────────────────────────
create table if not exists public.object_discoveries (
  id            uuid primary key default gen_random_uuid(),
  session_id    uuid not null references public.student_sessions(id) on delete cascade,
  object_id     uuid not null references public.objects(id) on delete cascade,
  discovered_at timestamptz default now(),
  attempts      integer default 1
);

create index if not exists object_discoveries_session_id_idx on public.object_discoveries(session_id);

-- ─────────────────────────────────────────────
-- 6. ROW LEVEL SECURITY
-- ─────────────────────────────────────────────

-- profiles: teachers see/edit only their own
alter table public.profiles enable row level security;
create policy "Own profile only" on public.profiles
  for all using (auth.uid() = id);

-- modules: teachers CRUD their own
alter table public.modules enable row level security;
create policy "Teacher owns module" on public.modules
  for all using (auth.uid() = teacher_id);

-- objects: teachers see objects belonging to their modules
alter table public.objects enable row level security;
create policy "Teacher owns objects" on public.objects
  for all using (
    exists (select 1 from public.modules where id = objects.module_id and teacher_id = auth.uid())
  );

-- student_sessions: anon can INSERT (Unity app uses anon key); teachers can SELECT their own
alter table public.student_sessions enable row level security;
create policy "Anon insert sessions" on public.student_sessions
  for insert with check (true);
create policy "Teacher reads own sessions" on public.student_sessions
  for select using (
    exists (select 1 from public.modules where id = student_sessions.module_id and teacher_id = auth.uid())
  );

-- object_discoveries: anon INSERT; teachers SELECT via session → module ownership
alter table public.object_discoveries enable row level security;
create policy "Anon insert discoveries" on public.object_discoveries
  for insert with check (true);
create policy "Teacher reads discoveries" on public.object_discoveries
  for select using (
    exists (
      select 1
      from public.student_sessions ss
      join public.modules m on m.id = ss.module_id
      where ss.id = object_discoveries.session_id
        and m.teacher_id = auth.uid()
    )
  );

-- ─────────────────────────────────────────────
-- 7. STORAGE BUCKETS
--    Create these in Supabase Dashboard → Storage, or via SQL below
-- ─────────────────────────────────────────────
-- All three buckets should be PUBLIC (allow unauthenticated reads)
-- Names: module-covers, object-images, object-audio

-- If using SQL insert approach:
insert into storage.buckets (id, name, public) values
  ('module-covers', 'module-covers', true),
  ('object-images', 'object-images', true),
  ('object-audio',  'object-audio',  true)
on conflict (id) do nothing;

-- Storage RLS: authenticated teachers can upload to their own folders
create policy "Authenticated upload module-covers" on storage.objects
  for insert to authenticated with check (bucket_id = 'module-covers');

create policy "Public read module-covers" on storage.objects
  for select using (bucket_id = 'module-covers');

create policy "Authenticated upload object-images" on storage.objects
  for insert to authenticated with check (bucket_id = 'object-images');

create policy "Public read object-images" on storage.objects
  for select using (bucket_id = 'object-images');

create policy "Authenticated upload object-audio" on storage.objects
  for insert to authenticated with check (bucket_id = 'object-audio');

create policy "Public read object-audio" on storage.objects
  for select using (bucket_id = 'object-audio');
