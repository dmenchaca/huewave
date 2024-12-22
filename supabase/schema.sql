-- Enable Row Level Security
alter table public.palettes enable row level security;

-- Drop existing policies if any
drop policy if exists "Enable read access for authenticated users" on public.palettes;
drop policy if exists "Enable insert access for authenticated users" on public.palettes;
drop policy if exists "Enable update access for users based on user_id" on public.palettes;
drop policy if exists "Enable delete access for users based on user_id" on public.palettes;

-- Create new policies
create policy "Enable read access for authenticated users"
  on public.palettes
  for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Enable insert access for authenticated users"
  on public.palettes
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Enable update access for users based on user_id"
  on public.palettes
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Enable delete access for users based on user_id"
  on public.palettes
  for delete
  to authenticated
  using (auth.uid() = user_id);