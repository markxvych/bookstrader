"use server";

import { requireUser } from "@/lib/auth";
import { isUuid } from "@/lib/forms";
import { createAdminClient } from "@/lib/supabase/admin";

type ExchangeResult = { error?: string; sent?: boolean };

const exchangeError = { error: "Сталася помилка." };

export async function requestExchange(bookId: string): Promise<ExchangeResult> {
  const { supabase, user, profile } = await requireUser();
  if (!isUuid(bookId)) return exchangeError;

  const { data: book, error: bookError } = await supabase
    .from("books")
    .select("name, owner_id")
    .eq("id", bookId)
    .maybeSingle();

  if (bookError || !book || book.owner_id === user.id || !profile?.name) {
    return exchangeError;
  }

  if (!process.env.SUPABASE_SECRET_KEY) return exchangeError;

  const admin = createAdminClient();
  const { error: notificationError } = await admin
    .from("exchange_notifications")
    .insert({
      delivery_key: crypto.randomUUID(),
      recipient_id: book.owner_id,
      book_id: bookId,
      book_name: book.name,
      sender_name: profile.name,
    });

  if (notificationError) return exchangeError;

  return { sent: true };
}
