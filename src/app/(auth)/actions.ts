"use server";

import { redirect } from "next/navigation";
import { text } from "@/lib/forms";
import { createClient } from "@/lib/supabase/server";

export async function register(form: FormData) {
  const username = text(form, "name");
  const email = text(form, "email");
  const password = form.get("password");
  if (
    !username ||
    username.length > 100 ||
    !email ||
    typeof password !== "string" ||
    password.length < 6
  ) {
    return;
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { username } },
  });
  if (error) return;
  redirect(data.session ? "/me/books" : "/login");
}

export async function login(form: FormData) {
  const email = text(form, "email");
  const password = form.get("password");
  if (!email || typeof password !== "string" || !password) {
    return;
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return;
  redirect("/me/books");
}

export async function logout() {
  const supabase = await createClient();
  const { error } = await supabase.auth.signOut({ scope: "local" });
  if (error) return;
  redirect("/");
}
