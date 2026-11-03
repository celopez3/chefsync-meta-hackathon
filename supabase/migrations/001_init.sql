-- ChefSync: run this once in your Supabase project (SQL Editor -> New query).
-- Then set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY (see .env.example).

create table if not exists public.pantry_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  unique (user_id, name)
);

create table if not exists public.saved_recipes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  plan jsonb not null,
  created_at timestamptz not null default now()
);

alter table public.pantry_items enable row level security;
alter table public.saved_recipes enable row level security;

create policy "own pantry" on public.pantry_items
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own recipes" on public.saved_recipes
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
