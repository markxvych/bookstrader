import { Pencil, Trash2 } from "lucide-react";
import AdminForm from "@/app/admin/AdminForm";
import { deleteAnyBook } from "@/app/admin/actions";
import BookForm from "@/app/me/books/BookForm";
import { deleteBook } from "@/app/me/books/actions";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import type { Book } from "@/lib/books";

export default function BookActions({
  book,
  returnTo,
  isAdmin = false,
}: {
  book: Book;
  returnTo: "collection" | "catalog" | "details";
  isAdmin?: boolean;
}) {
  const showLabels = returnTo === "details";
  const size = showLabels ? "sm" : "icon-sm";
  const buttonClass = showLabels ? undefined : "bg-background hover:bg-muted";
  const deleteButton = (
    <Button
      type={isAdmin ? "button" : "submit"}
      variant="outline"
      size={size}
      className={buttonClass}
      title="Видалити"
      aria-label={`Видалити «${book.name}»`}
    >
      <Trash2 aria-hidden="true" />
      {showLabels && "Видалити"}
    </Button>
  );

  return (
    <>
      <Dialog
        key={`${book.name}:${book.author}:${book.photo_url}`}
        title="Редагувати книгу"
        trigger={
          <Button
            type="button"
            variant="outline"
            size={size}
            className={buttonClass}
            title="Редагувати"
            aria-label={`Редагувати «${book.name}»`}
          >
            <Pencil aria-hidden="true" />
            {showLabels && "Редагувати"}
          </Button>
        }
      >
        <BookForm book={book} returnTo={returnTo} />
      </Dialog>
      {isAdmin ? (
        <Dialog
          title="Видалити книгу?"
          description={book.name}
          trigger={deleteButton}
        >
          <AdminForm action={deleteAnyBook.bind(null, book.id)}>
            <Button type="submit" variant="destructive">
              Видалити
            </Button>
          </AdminForm>
        </Dialog>
      ) : (
        <form action={deleteBook.bind(null, book.id)}>{deleteButton}</form>
      )}
    </>
  );
}
