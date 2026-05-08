create table if not exists public.fishing_profiles (
  discord_id text primary key,
  display_name text not null default '',
  gold bigint not null default 0,
  total_caught bigint not null default 0,
  total_sold bigint not null default 0,
  legendary_caught bigint not null default 0,
  save_data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create index if not exists fishing_profiles_total_sold_idx
on public.fishing_profiles (total_sold desc);

create index if not exists fishing_profiles_total_caught_idx
on public.fishing_profiles (total_caught desc);

create index if not exists fishing_profiles_legendary_caught_idx
on public.fishing_profiles (legendary_caught desc);
