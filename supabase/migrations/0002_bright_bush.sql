/*
  # Ensure palettes table exists
  
  This migration is idempotent and only creates the table if it doesn't already exist.
  Policies are handled in the initial migration.
*/

-- Create palettes table if it doesn't exist
create table if not exists public.palettes (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  colors jsonb not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Ensure RLS is enabled
alter table public.palettes enable row level security;