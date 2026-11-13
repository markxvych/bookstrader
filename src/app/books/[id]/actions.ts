"use server";

import { requireUser } from "@/lib/auth";
import { isUuid, text } from "@/lib/forms";
import { createAdminClient } from "@/lib/supabase/admin";

type ExchangeResult = { error?: string; sent?: boolean };

export async function requestExchange(
  bookId: string,
  _previous: ExchangeResult,
  form: FormData,
): Promise<ExchangeResult> {
  const { user } = await requireUser();
  const offeredBookId = text(form, "offered_book_id");
  const failure = { error: "Сталася помилка." };
  if (
    !isUuid(bookId) ||
    !isUuid(offeredBookId) ||
    !process.env.SUPABASE_SECRET_KEY
  ) {
    return failure;
  }

  const { data, error } = await createAdminClient().rpc("request_book_swap", {
    sender: user.id,
    wanted_book: bookId,
    offered_book: offeredBookId,
  });

  return error || !data ? failure : { sent: true };
}
