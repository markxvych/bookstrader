import { Suspense } from "react";
import { BookOpen, Plus } from "lucide-react";
import BookCard from "@/components/BookCard";
import Notice from "@/components/Notice";
import { buttonVariants } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { requireUser } from "@/lib/auth";
import { prepareBookCovers } from "@/lib/books";
import BookForm from "./BookForm";
import BookActions from "@/components/BookActions";

async function MyBooks() {
  const { supabase, user } = await requireUser();
  const { data, error } = await supabase
    .from("books")
    .select("id, name, author, photo_url")
    .eq("owner_id", user.id)
    .order("name");

  if (error)
    return (
      <main className="mx-auto w-full max-w-6xl space-y-4 px-4 py-8 sm:px-6">
        <h1 className="text-2xl font-heading font-bold tracking-wide">
          Мої книги
        </h1>
        <Notice error="Не вдалося завантажити книги." />
      </main>
    );

  const books = await prepareBookCovers(supabase, data);
  const addBook = (
    <Dialog
      key={books.length}
      title="Додати книгу"
      description="Заповніть інформацію про книгу."
      trigger={
        books.length ? (
          <button
            type="button"
            className="flex flex-col items-center justify-center gap-2 rounded-md border border-dashed bg-muted/40 px-2 text-sm text-muted-foreground hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Plus aria-hidden="true" className="size-7" /> Додати книгу
          </button>
        ) : (
          <button type="button" className={buttonVariants({ size: "lg" })}>
            <Plus aria-hidden="true" /> Додати книгу
          </button>
        )
      }
    >
      <BookForm />
    </Dialog>
  );

  if (!books.length)
    return (
      <main className="grid min-h-[calc(100dvh-4rem)] place-items-center px-4 py-12">
        <section className="flex w-full max-w-sm flex-col items-center gap-3 text-center">
          <div className="mb-1 rounded-lg bg-muted p-4 text-muted-foreground">
            <BookOpen className="size-7" aria-hidden="true" />
          </div>
          <h1 className="text-2xl font-heading font-bold tracking-wide">
            Ваш список порожній
          </h1>
          <p className="text-sm text-muted-foreground">
            Додайте книгу, щоб почати свою колекцію.
          </p>
          {addBook}
        </section>
      </main>
    );

  return (
    <main className="mx-auto w-full max-w-6xl space-y-5 px-4 py-8 sm:px-6">
      <div>
        <h1 className="text-2xl font-heading font-bold tracking-wide">
          Мої книги
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Книг у колекції: {books.length}
        </p>
      </div>
      <div className="grid auto-rows-fr grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {books.map((book) => (
          <BookCard
            key={book.id}
            book={book}
            actions={<BookActions book={book} returnTo="collection" />}
          />
        ))}
        {addBook}
      </div>
    </main>
  );
}

export default function MyBooksPage() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto w-full max-w-6xl px-4 py-8 text-sm text-muted-foreground">
          Завантаження книг…
        </main>
      }
    >
      <MyBooks />
    </Suspense>
  );
}
