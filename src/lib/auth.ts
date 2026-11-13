import "server-only";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function currentUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("name, role")
    .eq("id", user.id)
    .maybeSingle();
  if (error) throw error;

  return { supabase, user, profile };
}

export async function requireUser() {
  const session = await currentUser();
  if (!session) redirect("/login");
  return session;
}
