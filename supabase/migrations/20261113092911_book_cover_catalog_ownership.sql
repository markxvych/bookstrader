-- A book can only authorize signing an object uploaded by that book's owner.
alter policy book_covers_read_catalog on storage.objects
  using (
    bucket_id = 'book-covers' and (
      (owner_id = (select auth.uid())::text and
        (storage.foldername(name)) = array[(select auth.uid())::text])
      or exists (
        select 1 from public.books b
        where b.owner_id::text = storage.objects.owner_id
          and (storage.foldername(storage.objects.name)) = array[b.owner_id::text]
          and split_part(b.photo_url, '/storage/v1/object/authenticated/book-covers/', 2)
              = storage.objects.name
      )
    )
  );
