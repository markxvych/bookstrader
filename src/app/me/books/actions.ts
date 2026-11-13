"use server";

import { redirect } from "next/navigation";

import { requireUser } from "@/lib/auth";
import { coverBucket, coverPrefix, removeCover } from "@/lib/books";
import { createAdminClient } from "@/lib/supabase/admin";
import { isImageUrl, isUuid, text } from "@/lib/forms";

const path = "/me/books";
const extensions: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export async function saveBook(
  bookId: string | null,
  returnTo: "collection" | "catalog" | "details",
  form: FormData,
) {
  const { supabase, user, profile } = await requireUser();
  const name = text(form, "name");
  const author = text(form, "author");
  const url = text(form, "photo_url");
  const file = form.get("photo");

  if (!name || !author || name.length > 200 || author.length > 200) {
    return;
  }

  const admin =
    bookId && profile?.role === "Admin" && process.env.SUPABASE_SECRET_KEY
      ? createAdminClient()
      : null;
  const client = admin ?? supabase;
  let ownerId = user.id;
  let previousUrl = "";
  let previousSwappedCover: string | null = null;

  if (bookId) {
    if (!isUuid(bookId)) return;
    const query = client
      .from("books")
      .select("photo_url, owner_id, swapped_cover_path")
      .eq("id", bookId);
    const { data } = await (
      admin ? query : query.eq("owner_id", user.id)
    ).maybeSingle();
    if (!data) return;
    ownerId = data.owner_id;
    previousUrl = data.photo_url;
    previousSwappedCover = data.swapped_cover_path;
  }

  let photoUrl = url || previousUrl;
  let uploaded = false;
  if (file instanceof File && file.size > 0) {
    const extension = extensions[file.type];
    if (!extension || file.size > 2 * 1024 * 1024) {
      return;
    }

    const filePath = `${ownerId}/${crypto.randomUUID()}.${extension}`;
    const { error } = await client.storage
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
    ? client
        .from("books")
        .update(
          admin && photoUrl !== previousUrl
            ? {
                ...values,
                swapped_cover_path: uploaded
                  ? photoUrl.slice(coverPrefix.length)
                  : null,
              }
            : values,
        )
        .eq("id", bookId)
        .eq("owner_id", ownerId)
        .eq("photo_url", previousUrl)
    : supabase.from("books").insert({ ...values, owner_id: user.id });
  const { data, error, status } = await query.select("id").maybeSingle();

  if (error || !data) {
    if (uploaded && status > 0 && status < 500) {
      await removeCover(client, photoUrl, ownerId);
    }
    return;
  }

  if (previousUrl && previousUrl !== photoUrl) {
    if (
      admin &&
      previousSwappedCover &&
      previousUrl === coverPrefix + previousSwappedCover
    ) {
      const { error } = await admin.storage
        .from(coverBucket)
        .remove([previousSwappedCover]);
      if (error) console.error("Не вдалося видалити обкладинку", error.message);
    } else {
      await removeCover(client, previousUrl, ownerId);
    }
  }

  if (returnTo === "details" && bookId) redirect(`/books/${bookId}`);
  if (returnTo === "catalog") redirect("/books");
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
