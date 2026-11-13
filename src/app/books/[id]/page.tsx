import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { ArrowLeft, UserRound } from "lucide-react";
import BookCover from "@/components/BookCover";
import Notice from "@/components/Notice";
import { requireUser } from "@/lib/auth";
import { prepareBookCovers } from "@/lib/books";
import { isUuid } from "@/lib/forms";

import ExchangeForm from "./ExchangeForm";

type BookParams = Promise<{ id: string }>;

async function BookDetails({ params }: { params: BookParams }) {
  const { supabase, user, profile } = await requireUser();
  const { id } = await params;
  if (!isUuid(id)) notFound();

  const { data, error } = await supabase
    .from("books")
    .select("id, name, author, photo_url, owner_id")
    .eq("id", id)
    .maybeSingle();

  if (error)
    return (
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <Notice error="Не вдалося завантажити книгу." />
      </main>
    );
  if (!data) notFound();

  const isOwner = data.owner_id === user.id;
  const ownerName = isOwner
    ? profile?.name
    : (await supabase.rpc("book_owner_name", { book_id: id })).data;
  const myBooks = isOwner
    ? null
    : await supabase
        .from("books")
        .select("id, name, author")
        .eq("owner_id", user.id)
        .order("name");
  const [book] = await prepareBookCovers(supabase, [data]);

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
      <Link
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        href="/books"
      >
        <ArrowLeft className="size-4" aria-hidden="true" /> До каталогу
      </Link>
      <article className="mt-6 grid gap-6 sm:grid-cols-[minmax(0,19rem)_minmax(0,1fr)] sm:gap-8">
        <div className="w-full max-w-xs">
          <BookCover url={book.photo_url} />
        </div>
        <div className="min-w-0 space-y-5">
          <div className="space-y-2">
            <h1 className="font-heading text-3xl font-bold wrap-break-word sm:text-4xl">
              {book.name}
            </h1>
            <p className="text-lg wrap-break-word text-muted-foreground">
              {book.author}
            </p>
          </div>
          {typeof ownerName === "string" && ownerName && (
            <div className="space-y-2 border-t pt-5">
              <p className="text-sm text-muted-foreground">Власник</p>
              <p className="flex items-center gap-2 text-sm font-medium">
                <UserRound className="size-4 shrink-0" aria-hidden="true" />
                <span className="wrap-break-word">
                  {ownerName}
                  {isOwner && " (це ви)"}
                </span>
              </p>
            </div>
          )}
          {isOwner ? (
            <Link
              href="/me/books"
              className="text-sm underline underline-offset-4"
            >
              Керувати книгою
            </Link>
          ) : myBooks?.error ? (
            <Notice error="Не вдалося завантажити ваші книги." />
          ) : (
            <ExchangeForm
              key={book.id}
              bookId={book.id}
              myBooks={myBooks?.data ?? []}
            />
          )}
        </div>
      </article>
    </main>
  );
}

export default function BookPage({ params }: { params: BookParams }) {
  return (
    <Suspense
      fallback={
        <main className="mx-auto w-full max-w-6xl px-4 py-8 text-sm text-muted-foreground">
          Завантаження книги…
        </main>
      }
    >
      <BookDetails params={params} />
    </Suspense>
  );
}
