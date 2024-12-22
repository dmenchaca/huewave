/*
  # Create palettes table
  
  1. New Tables
    - `palettes`
      - `id` (uuid, primary key)
      - `name` (text, required)
      - `colors` (jsonb, required)
      - `user_id` (uuid, required, references auth.users)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
  
  2. Security
    - Enable RLS on `palettes` table
    - Add policies for CRUD operations:
      - Users can only read their own palettes
      - Users can only insert palettes they own
      - Users can only update their own palettes
      - Users can only delete their own palettes
*/

-- Create palettes table
create table if not exists public.palettes (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  colors jsonb not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable RLS
alter table public.palettes enable row level security;

-- Create policies
create policy "Users can read own palettes"
  on public.palettes
  for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can create own palettes"
  on public.palettes
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users can update own palettes"
  on public.palettes
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own palettes"
  on public.palettes
  for delete
  to authenticated
  using (auth.uid() = user_id);