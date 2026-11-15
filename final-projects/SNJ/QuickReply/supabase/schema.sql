create table if not exists public.reply_rules (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  question text not null check (char_length(question) between 1 and 500),
  response text not null check (char_length(response) between 1 and 5000),
  enabled boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.reply_rules enable row level security;

create policy "Users can read their own reply rules" on public.reply_rules
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "Users can create their own reply rules" on public.reply_rules
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Users can update their own reply rules" on public.reply_rules
  for update to authenticated using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy "Users can delete their own reply rules" on public.reply_rules
  for delete to authenticated using ((select auth.uid()) = user_id);
