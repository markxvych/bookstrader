"use client";

import Link from "next/link";
import { useActionState } from "react";
import { ArrowLeftRight } from "lucide-react";
import Notice from "@/components/Notice";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { requestExchange } from "./actions";

type BookOption = { id: string; name: string; author: string };

export default function ExchangeForm({
  bookId,
  myBooks,
}: {
  bookId: string;
  myBooks: BookOption[];
}) {
  const [result, submit, pending] = useActionState(
    requestExchange.bind(null, bookId),
    {},
  );

  return (
    <Dialog
      title="Запропонувати обмін"
      trigger={
        <Button type="button">
          <ArrowLeftRight aria-hidden="true" />
          Запросити обмін
        </Button>
      }
    >
      {result.sent ? (
        <p role="status" className="text-sm">
          Запит на обмін надіслано.
        </p>
      ) : myBooks.length === 0 ? (
        <p className="text-sm">
          <Link className="underline" href="/me/books">
            Додайте книгу до своєї колекції
          </Link>
          , щоб запропонувати обмін.
        </p>
      ) : (
        <form action={submit} className="space-y-3">
          <Label htmlFor="offered-book">Яку книгу пропонуєте?</Label>
          <Select
            name="offered_book_id"
            required
            items={myBooks.map((book) => ({
              value: book.id,
              label: `${book.name} — ${book.author}`,
            }))}
          >
            <SelectTrigger id="offered-book" className="w-full">
              <SelectValue
                placeholder="Виберіть книгу"
                className="min-w-0 truncate"
              />
            </SelectTrigger>
            <SelectContent alignItemWithTrigger={false} className="max-h-64">
              {myBooks.map((book) => (
                <SelectItem key={book.id} value={book.id}>
                  <span className="whitespace-normal wrap-anywhere">
                    {book.name} — {book.author}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button type="submit" disabled={pending}>
            {pending ? "Надсилаємо…" : "Надіслати запит"}
          </Button>
          {result.error && <Notice error={result.error} />}
        </form>
      )}
    </Dialog>
  );
}
