"use server";

import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { isImageUrl, text } from "@/lib/forms";
import { createAdminClient } from "@/lib/supabase/admin";

export async function saveProfile(form: FormData) {
  const { supabase, user } = await requireUser();
  const name = text(form, "name");
  const avatar = text(form, "avatar_url");
  if (!name || name.length > 100) return;
  if (
    avatar &&
    (!isImageUrl(avatar) ||
      !avatar.startsWith("https://") ||
      avatar.length > 2048)
  ) {
    return;
  }

  const { error } = await supabase
    .from("profiles")
    .update({ name, avatar_url: avatar || null })
    .eq("id", user.id);
  if (error) return;
  redirect("/profile");
}

export async function changeEmail(form: FormData) {
  const { user } = await requireUser();
  const email = text(form, "email");
  if (!email) return;
  if (email.toLowerCase() === user.email?.toLowerCase()) {
    return;
  }

  if (!process.env.SUPABASE_SECRET_KEY) return;

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.updateUserById(user.id, {
    email,
    email_confirm: true,
  });
  if (error) return;
  redirect("/profile");
}
