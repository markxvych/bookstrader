create schema if not exists private;

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 100),
  role text not null default 'User' check (role in ('User', 'Admin')),
  created_at timestamptz not null default now()
);

create table public.books (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 200),
  author text not null check (char_length(trim(author)) between 1 and 200),
  photo_url text not null check (char_length(photo_url) <= 2048 and photo_url ~* '^https?://[^[:space:]]+$'),
  created_at timestamptz not null default now()
);

create index books_owner_id_idx on public.books (owner_id);

alter table public.profiles enable row level security;
alter table public.books enable row level security;

revoke all on public.profiles, public.books from public, anon, authenticated;
grant all on public.profiles, public.books to service_role;
grant select on public.profiles to authenticated;
grant select on public.books to anon, authenticated;
grant delete on public.books to authenticated;
grant insert (name, author, photo_url, owner_id) on public.books to authenticated;
grant update (name, author, photo_url) on public.books to authenticated;

create policy profiles_select_own on public.profiles
  for select to authenticated using ((select auth.uid()) = id);

create policy profiles_insert_own on public.profiles
  for insert to authenticated with check ((select auth.uid()) = id and role = 'User');

create policy books_select_all on public.books
  for select to anon, authenticated using (true);

create policy books_insert_own on public.books
  for insert to authenticated with check ((select auth.uid()) = owner_id);

create policy books_update_own on public.books
  for update to authenticated using ((select auth.uid()) = owner_id)
  with check ((select auth.uid()) = owner_id);

create policy books_delete_own on public.books
  for delete to authenticated using ((select auth.uid()) = owner_id);

create function private.create_user_profile()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, name)
  values (new.id, new.raw_user_meta_data ->> 'username');
  return new;
end;
$$;

revoke execute on function private.create_user_profile() from public, anon, authenticated;

create trigger create_profile_after_signup
  after insert on auth.users for each row execute function private.create_user_profile();
