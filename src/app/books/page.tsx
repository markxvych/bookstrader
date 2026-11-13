import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import BookActions from "@/components/BookActions";
import BookCard from "@/components/BookCard";
import Notice from "@/components/Notice";
import { requireUser } from "@/lib/auth";
import { prepareBookCovers, type Book } from "@/lib/books";
import { pageNumber } from "@/lib/forms";
import CatalogFilters from "./CatalogFilters";

export const metadata: Metadata = {
  title: "Усі книги",
};

async function BooksCatalog({ searchParams }: { searchParams: SearchParams }) {
  const { supabase, profile } = await requireUser();
  const params = await searchParams;
  const search =
    typeof params.q === "string" ? params.q.trim().slice(0, 200) : "";
  const sort = params.sort === "desc" ? "desc" : "asc";

  const { data, error } = await supabase.rpc("search_books", {
    search_term: search,
    sort_order: sort,
    requested_page: pageNumber(params.page),
  });

  if (error || !data)
    return (
      <main className="mx-auto max-w-7xl space-y-4 px-4 py-8 sm:px-6">
        <h1 className="text-2xl font-heading font-bold tracking-wide">
          Усі книги
        </h1>
        <Notice error="Не вдалося завантажити каталог." />
      </main>
    );
  const result = data as { books: Book[]; total: number; page: number };
  const books = await prepareBookCovers(supabase, result.books);
  const pages = Math.ceil(result.total / 12);

  function href(page: number) {
    return `/books?${new URLSearchParams({ q: search, sort, page: String(page) })}`;
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:py-10">
      <h1 className="text-3xl font-heading font-bold tracking-wide">
        Усі книги
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Знайдіть свою наступну історію.
      </p>
      <CatalogFilters search={search} sort={sort} />
      {books.length ? (
        <>
          <p className="mt-6 mb-3 text-sm text-muted-foreground">
            Знайдено книг: {result.total}
          </p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
            {books.map((book) => (
              <BookCard
                key={book.id}
                book={book}
                actions={
                  profile?.role === "Admin" && (
                    <BookActions book={book} returnTo="catalog" isAdmin />
                  )
                }
              />
            ))}
          </div>
          <nav
            className="mt-8 flex flex-wrap items-center justify-center gap-2"
            aria-label="Сторінки каталогу"
          >
            {result.page > 1 ? (
              <Link
                href={href(result.page - 1)}
                className={buttonVariants({ variant: "ghost" })}
              >
                <ChevronLeft aria-hidden="true" /> Попередня
              </Link>
            ) : (
              <Button variant="ghost" disabled>
                <ChevronLeft aria-hidden="true" /> Попередня
              </Button>
            )}
            <span
              className="grid size-8 place-items-center rounded-md border text-sm font-medium"
              aria-current="page"
            >
              {result.page}
            </span>
            {result.page < pages ? (
              <Link
                href={href(result.page + 1)}
                className={buttonVariants({ variant: "ghost" })}
              >
                Наступна <ChevronRight aria-hidden="true" />
              </Link>
            ) : (
              <Button variant="ghost" disabled>
                Наступна <ChevronRight aria-hidden="true" />
              </Button>
            )}
          </nav>
        </>
      ) : (
        <p className="mt-6 rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
          Книг не знайдено.
        </p>
      )}
    </main>
  );
}

type SearchParams = Promise<{
  q?: string | string[];
  sort?: string | string[];
  page?: string | string[];
}>;

export default function BooksPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  return (
    <Suspense
      fallback={
        <main className="mx-auto w-full max-w-7xl px-4 py-8 text-sm text-muted-foreground">
          Завантаження каталогу…
        </main>
      }
    >
      <BooksCatalog searchParams={searchParams} />
    </Suspense>
  );
}
