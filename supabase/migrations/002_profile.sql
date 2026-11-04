-- ChefSync profile preferences (dietary, allergens, avoid list, servings,
-- heat, learned substitutions). Run after 001_init.sql.
-- No public users table is needed: rows key off Supabase Auth users.

create table if not exists public.user_preferences (
  user_id uuid primary key references auth.users (id) on delete cascade,
  prefs jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.user_preferences enable row level security;

create policy "own preferences" on public.user_preferences
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
