import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

export type Book = {
  id: string;
  name: string;
  author: string;
  photo_url: string;
};

export const coverBucket = "book-covers";
export const coverPrefix = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/authenticated/${coverBucket}/`;

export async function prepareBookCovers(
  supabase: SupabaseClient,
  books: Book[],
) {
  const filePaths: string[] = [];

  for (const book of books) {
    if (book.photo_url.startsWith(coverPrefix)) {
      filePaths.push(book.photo_url.slice(coverPrefix.length));
    }
  }

  if (filePaths.length === 0) return books;

  const { data: files } = await supabase.storage
    .from(coverBucket)
    .createSignedUrls(filePaths, 3600);

  const urlsByPath = new Map<string, string>();
  for (const file of files ?? []) {
    if (file.path && file.signedUrl) {
      urlsByPath.set(file.path, file.signedUrl);
    }
  }

  return books.map((book) => {
    if (!book.photo_url.startsWith(coverPrefix)) return book;

    const filePath = book.photo_url.slice(coverPrefix.length);
    return { ...book, photo_url: urlsByPath.get(filePath) ?? "" };
  });
}

export async function removeCover(
  supabase: SupabaseClient,
  url: string,
  ownerId: string,
) {
  const ownerPrefix = `${coverPrefix}${ownerId}/`;
  if (!url.startsWith(ownerPrefix)) return;

  const filePath = url.slice(coverPrefix.length);
  const { error } = await supabase.storage.from(coverBucket).remove([filePath]);
  if (error) console.error("Не вдалося видалити обкладинку", error.message);
}
