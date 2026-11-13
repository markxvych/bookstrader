create function public.search_books(search_term text, sort_order text, requested_page integer)
returns jsonb
language sql
stable
security invoker
set search_path = ''
as $$
  with options as (
    select lower(left(btrim(coalesce(search_term, '')), 200) collate pg_catalog."uk-x-icu") as term
  ),
  matches as (
    select b.id, b.name, b.author, b.photo_url,
           lower(b.name collate pg_catalog."uk-x-icu") as sort_name
    from public.books b cross join options o
    where o.term = ''
       or strpos(lower(b.name collate pg_catalog."uk-x-icu"), o.term) > 0
       or strpos(lower(b.author collate pg_catalog."uk-x-icu"), o.term) > 0
  ),
  metadata as (
    select count(*) as total,
           greatest(1, least(coalesce(requested_page, 1)::bigint, (count(*) + 11) / 12)) as page
    from matches
  ),
  page_rows as (
    select * from matches
    order by
      case when sort_order is distinct from 'desc' then sort_name end asc,
      case when sort_order = 'desc' then sort_name end desc,
      id
    limit 12 offset (select (page - 1) * 12 from metadata)
  )
  select jsonb_build_object(
    'books', coalesce((
      select jsonb_agg(to_jsonb(p) - 'sort_name' order by
        case when sort_order is distinct from 'desc' then p.sort_name end asc,
        case when sort_order = 'desc' then p.sort_name end desc,
        p.id)
      from page_rows p
    ), '[]'::jsonb),
    'total', total,
    'page', page
  )
  from metadata;
$$;

revoke all on function public.search_books(text, text, integer) from public, anon, authenticated;
grant execute on function public.search_books(text, text, integer) to authenticated;

-- Only expose the display name of the owner of a specific catalog book.
create schema book_trader_private;
revoke all on schema book_trader_private from public, anon, authenticated;
grant usage on schema book_trader_private to authenticated;

create function book_trader_private.book_owner_name(book_id uuid)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select p.name
  from public.books b join public.profiles p on p.id = b.owner_id
  where b.id = book_id and (select auth.uid()) is not null;
$$;

revoke all on function book_trader_private.book_owner_name(uuid) from public, anon, authenticated;
grant execute on function book_trader_private.book_owner_name(uuid) to authenticated;

create function public.book_owner_name(book_id uuid)
returns text
language sql
stable
security invoker
set search_path = ''
as $$
  select book_trader_private.book_owner_name(book_id);
$$;

revoke all on function public.book_owner_name(uuid) from public, anon, authenticated;
grant execute on function public.book_owner_name(uuid) to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('book-covers', 'book-covers', false, 2097152, array['image/jpeg', 'image/png', 'image/webp']);

create policy book_covers_insert_own on storage.objects
  for insert to authenticated with check (
    bucket_id = 'book-covers'
    and (storage.foldername(name)) = array[(select auth.uid())::text]
    and storage.filename(name) ~ '^[0-9a-f-]{36}\.(jpg|png|webp)$'
  );

create policy book_covers_read_catalog on storage.objects
  for select to authenticated using (
    bucket_id = 'book-covers' and (
      (owner_id = (select auth.uid())::text and
        (storage.foldername(name)) = array[(select auth.uid())::text])
      or exists (
        select 1 from public.books b
        where split_part(b.photo_url, '/storage/v1/object/authenticated/book-covers/', 2)
              = storage.objects.name
      )
    )
  );

create policy book_covers_delete_own on storage.objects
  for delete to authenticated using (
    bucket_id = 'book-covers' and owner_id = (select auth.uid())::text
    and (storage.foldername(name)) = array[(select auth.uid())::text]
  );

notify pgrst, 'reload schema';
