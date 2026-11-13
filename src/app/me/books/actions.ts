"use server";

import { redirect } from "next/navigation";

import { requireUser } from "@/lib/auth";
import { coverBucket, coverPrefix, removeCover } from "@/lib/books";
import { isImageUrl, isUuid, text } from "@/lib/forms";

const path = "/me/books";
const extensions: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export async function saveBook(bookId: string | null, form: FormData) {
  const { supabase, user } = await requireUser();
  const name = text(form, "name");
  const author = text(form, "author");
  const url = text(form, "photo_url");
  const file = form.get("photo");

  if (!name || !author || name.length > 200 || author.length > 200) {
    return;
  }

  let previousUrl = "";
  if (bookId) {
    if (!isUuid(bookId)) return;
    const { data } = await supabase
      .from("books")
      .select("photo_url")
      .eq("id", bookId)
      .eq("owner_id", user.id)
      .maybeSingle();
    if (!data) return;
    previousUrl = data.photo_url;
  }

  let photoUrl = url || previousUrl;
  let uploaded = false;
  if (file instanceof File && file.size > 0) {
    const extension = extensions[file.type];
    if (!extension || file.size > 2 * 1024 * 1024) {
      return;
    }

    const filePath = `${user.id}/${crypto.randomUUID()}.${extension}`;
    const { error } = await supabase.storage
      .from(coverBucket)
      .upload(filePath, file);
    if (error) return;
    photoUrl = coverPrefix + filePath;
    uploaded = true;
  } else if (
    (url && (url.startsWith(coverPrefix) || url.length > 2048)) ||
    !isImageUrl(photoUrl)
  ) {
    return;
  }

  const values = { name, author, photo_url: photoUrl };
  const query = bookId
    ? supabase
        .from("books")
        .update(values)
        .eq("id", bookId)
        .eq("owner_id", user.id)
        .eq("photo_url", previousUrl)
    : supabase.from("books").insert({ ...values, owner_id: user.id });
  const { data, error, status } = await query.select("id").maybeSingle();

  if (error || !data) {
    if (uploaded && status > 0 && status < 500) {
      await removeCover(supabase, photoUrl, user.id);
    }
    return;
  }

  if (previousUrl && previousUrl !== photoUrl)
    await removeCover(supabase, previousUrl, user.id);
  redirect(path);
}

export async function deleteBook(bookId: string) {
  const { supabase, user } = await requireUser();
  if (!isUuid(bookId)) return;

  const { data, error } = await supabase
    .from("books")
    .delete()
    .eq("id", bookId)
    .eq("owner_id", user.id)
    .select("photo_url")
    .maybeSingle();
  if (error || !data) return;

  await removeCover(supabase, data.photo_url, user.id);
  redirect(path);
}
