alter table public.profiles add column avatar_url text
  check (avatar_url is null or (
    char_length(avatar_url) <= 2048 and avatar_url ~ '^https://[^[:space:]]+$'
  ));

grant update (name, avatar_url) on public.profiles to authenticated;

create policy profiles_update_own on public.profiles
  for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

create table public.exchange_notifications (
  id uuid primary key default gen_random_uuid(),
  delivery_key text not null unique,
  recipient_id uuid not null references public.profiles (id) on delete cascade,
  book_id uuid references public.books (id) on delete set null,
  book_name text not null,
  sender_name text not null,
  created_at timestamptz not null default now(),
  read_at timestamptz
);

create index exchange_notifications_inbox_idx
  on public.exchange_notifications (recipient_id, created_at desc, id desc);
create index exchange_notifications_book_idx on public.exchange_notifications (book_id);

alter table public.exchange_notifications enable row level security;
revoke all on public.exchange_notifications from public, anon, authenticated;
grant select on public.exchange_notifications to authenticated;
grant update (read_at) on public.exchange_notifications to authenticated;
grant select, insert on public.exchange_notifications to service_role;

create policy exchange_notifications_read_own on public.exchange_notifications
  for select to authenticated using ((select auth.uid()) = recipient_id);

create policy exchange_notifications_mark_read_own on public.exchange_notifications
  for update to authenticated using ((select auth.uid()) = recipient_id)
  with check ((select auth.uid()) = recipient_id);

notify pgrst, 'reload schema';
