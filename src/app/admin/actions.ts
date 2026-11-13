"use server";

import { redirect } from "next/navigation";

import { requireAdmin } from "@/lib/auth";
import { coverBucket, coverPrefix } from "@/lib/books";
import { isUuid, text } from "@/lib/forms";
import { createAdminClient } from "@/lib/supabase/admin";

const failure = "Сталася помилка.";

export async function createAccount(_previous: string, form: FormData) {
  await requireAdmin();
  const name = text(form, "name");
  const email = text(form, "email");
  const password = form.get("password");
  if (
    !name ||
    name.length > 100 ||
    !email ||
    typeof password !== "string" ||
    password.length < 6
  ) {
    return failure;
  }

  if (!process.env.SUPABASE_SECRET_KEY) return failure;
  const admin = createAdminClient();
  const { error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { username: name },
  });
  if (error) return failure;
  redirect("/admin");
}

export async function updateAccount(
  id: string,
  _previous: string,
  form: FormData,
) {
  await requireAdmin();
  const name = text(form, "name");
  const email = text(form, "email");
  if (!isUuid(id) || !name || name.length > 100 || !email) {
    return failure;
  }

  if (!process.env.SUPABASE_SECRET_KEY) return failure;
  const admin = createAdminClient();
  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .select("id")
    .eq("id", id)
    .maybeSingle();
  if (profileError || !profile) return failure;

  const { error: emailError } = await admin.auth.admin.updateUserById(id, {
    email,
    email_confirm: true,
  });
  if (emailError) return failure;
  const { data, error } = await admin
    .from("profiles")
    .update({ name })
    .eq("id", id)
    .select("id")
    .maybeSingle();
  if (error || !data) {
    console.error("Пошту збережено, але ім’я оновити не вдалося.");
    return failure;
  }
  redirect("/admin");
}

export async function deleteAccount(id: string) {
  const { user } = await requireAdmin();
  if (!isUuid(id) || id === user.id) return failure;

  if (!process.env.SUPABASE_SECRET_KEY) return failure;
  const admin = createAdminClient();
  const covers = admin.storage.from(coverBucket);
  const limit = 100;
  let offset = 0;

  while (true) {
    const { data: files, error } = await covers.list(id, {
      limit,
      offset,
      sortBy: { column: "name", order: "asc" },
    });
    if (error) return failure;
    if (!files.length) break;

    const paths = files.map((file) => `${id}/${file.name}`);
    const { data: transferred, error: lookupError } = await admin
      .from("books")
      .select("swapped_cover_path")
      .in("swapped_cover_path", paths)
      .neq("owner_id", id);
    if (lookupError) return failure;

    const retained = new Set(
      transferred.map((book) => book.swapped_cover_path),
    );
    const removable = paths.filter((path) => !retained.has(path));
    if (removable.length) {
      const { error: removeError } = await covers.remove(removable);
      if (removeError) return failure;
    }
    if (files.length < limit) break;
    offset += paths.length - removable.length;
  }

  const { error } = await admin.auth.admin.deleteUser(id);
  if (error) return failure;
  redirect("/admin");
}

export async function deleteAnyBook(id: string) {
  await requireAdmin();
  if (!isUuid(id)) return failure;

  if (!process.env.SUPABASE_SECRET_KEY) return failure;
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("books")
    .delete()
    .eq("id", id)
    .select("photo_url, owner_id, swapped_cover_path")
    .maybeSingle();
  if (error || !data) return failure;

  if (data.photo_url.startsWith(coverPrefix)) {
    const path = data.photo_url.slice(coverPrefix.length);
    if (
      path.startsWith(`${data.owner_id}/`) ||
      path === data.swapped_cover_path
    ) {
      const { error } = await admin.storage.from(coverBucket).remove([path]);
      if (error) console.error("Не вдалося видалити обкладинку", error.message);
    }
  }
  redirect("/books");
}
