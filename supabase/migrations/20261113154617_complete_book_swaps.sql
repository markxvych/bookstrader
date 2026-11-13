alter table public.exchange_notifications
  add column sender_id uuid references public.profiles (id) on delete cascade,
  add column offered_book_id uuid references public.books (id) on delete set null,
  add column offered_book_name text,
  add column status text not null default 'pending'
    check (status in ('pending', 'accepted', 'declined'));

create index exchange_notifications_sender_idx
  on public.exchange_notifications (sender_id);
create index exchange_notifications_offered_book_idx
  on public.exchange_notifications (offered_book_id);
create unique index exchange_notifications_pending_pair_idx
  on public.exchange_notifications (sender_id, recipient_id, book_id, offered_book_id)
  where status = 'pending';

alter table public.books add column swapped_cover_path text;

alter policy book_covers_read_catalog on storage.objects
  using (
    bucket_id = 'book-covers' and (
      (owner_id = (select auth.uid())::text and
        (storage.foldername(name)) = array[(select auth.uid())::text])
      or exists (
        select 1 from public.books b
        where split_part(b.photo_url, '/storage/v1/object/authenticated/book-covers/', 2)
                = storage.objects.name
          and (
            (b.owner_id::text = storage.objects.owner_id
              and (storage.foldername(storage.objects.name)) = array[b.owner_id::text])
            or b.swapped_cover_path = storage.objects.name
          )
      )
    )
  );

alter policy book_covers_delete_own on storage.objects
  using (
    bucket_id = 'book-covers'
    and owner_id = (select auth.uid())::text
    and (storage.foldername(name)) = array[(select auth.uid())::text]
    and not exists (
      select 1 from public.books b
      where b.swapped_cover_path = storage.objects.name
        and split_part(b.photo_url, '/storage/v1/object/authenticated/book-covers/', 2)
            = storage.objects.name
        and b.owner_id::text <> storage.objects.owner_id
    )
  );

create function public.request_book_swap(
  sender uuid, wanted_book uuid, offered_book uuid
)
returns boolean
language plpgsql
security invoker
set search_path = ''
as $$
declare
  wanted public.books%rowtype;
  offered public.books%rowtype;
  requester_name text;
begin
  perform id from public.books
    where id in (wanted_book, offered_book)
    order by id for update;

  select * into wanted from public.books where id = wanted_book;
  select * into offered from public.books where id = offered_book;
  select name into requester_name from public.profiles where id = sender;

  if wanted.id is null or offered.id is null or requester_name is null
    or wanted.owner_id = sender or offered.owner_id <> sender then
    return false;
  end if;

  insert into public.exchange_notifications (
    delivery_key, sender_id, recipient_id, book_id, book_name,
    sender_name, offered_book_id, offered_book_name
  ) values (
    gen_random_uuid(), sender, wanted.owner_id, wanted.id, wanted.name,
    requester_name, offered.id, offered.name
  )
  on conflict (sender_id, recipient_id, book_id, offered_book_id)
    where status = 'pending' do nothing;

  return true;
end;
$$;

create function public.respond_to_book_swap(
  recipient uuid, request_id uuid, accept_request boolean
)
returns boolean
language plpgsql
security invoker
set search_path = ''
as $$
declare
  request public.exchange_notifications%rowtype;
  wanted public.books%rowtype;
  offered public.books%rowtype;
begin
  if not accept_request then
    update public.exchange_notifications set status = 'declined'
      where id = request_id and recipient_id = recipient and status = 'pending';
    return found;
  end if;

  select * into request from public.exchange_notifications
    where id = request_id and recipient_id = recipient and status = 'pending';
  if not found then
    return false;
  end if;

  perform id from public.books
    where id in (request.book_id, request.offered_book_id)
    order by id for update;

  select * into request from public.exchange_notifications
    where id = request_id and recipient_id = recipient and status = 'pending'
    for update;
  if not found then
    return false;
  end if;

  select * into wanted from public.books where id = request.book_id;
  select * into offered from public.books where id = request.offered_book_id;

  if wanted.id is null or offered.id is null or request.sender_id is null
    or request.sender_id = recipient or wanted.owner_id <> recipient
    or offered.owner_id <> request.sender_id then
    return false;
  end if;

  update public.books b
    set owner_id = case when b.id = wanted.id then offered.owner_id else wanted.owner_id end,
        swapped_cover_path = (
          select obj.name from storage.objects obj
            where obj.bucket_id = 'book-covers'
              and obj.name = split_part(b.photo_url, '/storage/v1/object/authenticated/book-covers/', 2)
              and (
                (obj.owner_id = b.owner_id::text
                  and storage.foldername(obj.name) = array[b.owner_id::text])
                or obj.name = b.swapped_cover_path
              )
        )
    where b.id in (wanted.id, offered.id);

  update public.exchange_notifications set status = 'accepted' where id = request.id;
  return true;
end;
$$;

grant update (status) on public.exchange_notifications to service_role;
revoke all on function public.request_book_swap(uuid, uuid, uuid) from public, anon, authenticated;
revoke all on function public.respond_to_book_swap(uuid, uuid, boolean) from public, anon, authenticated;
grant execute on function public.request_book_swap(uuid, uuid, uuid) to service_role;
grant execute on function public.respond_to_book_swap(uuid, uuid, boolean) to service_role;

notify pgrst, 'reload schema';
