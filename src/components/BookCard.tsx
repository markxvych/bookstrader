import type { ReactNode } from "react";
import Link from "next/link";
import type { Book } from "@/lib/books";
import { Card } from "@/components/ui/card";
import BookCover from "./BookCover";

export default function BookCard({
  book,
  actions,
}: {
  book: Book;
  actions?: ReactNode;
}) {
  return (
    <Card className="group relative min-w-0 gap-0 border p-2 transition-shadow hover:shadow-sm">
      <Link
        href={`/books/${book.id}`}
        className="block rounded-sm focus-visible:ring-2 focus-visible:ring-ring"
      >
        <BookCover url={book.photo_url} />
        <h2 className="mt-2 truncate text-sm font-semibold" title={book.name}>
          {book.name}
        </h2>
        <p
          className="truncate text-xs text-muted-foreground"
          title={book.author}
        >
          {book.author}
        </p>
      </Link>
      {actions && (
        <div className="absolute top-4 right-4 flex gap-1 pointer-fine:opacity-0 group-focus-within:opacity-100 group-hover:opacity-100">
          {actions}
        </div>
      )}
    </Card>
  );
}
