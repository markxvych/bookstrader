"use client";

import { useState } from "react";
import type { Book } from "@/lib/books";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { saveBook } from "./actions";

export default function BookForm({ book }: { book?: Book }) {
  const [source, setSource] = useState<"url" | "file">("url");

  return (
    <form className="space-y-4" action={saveBook.bind(null, book?.id ?? null)}>
      <div className="space-y-2">
        <Label htmlFor="book-name">Назва книги</Label>
        <Input
          id="book-name"
          name="name"
          defaultValue={book?.name}
          maxLength={200}
          required
          placeholder="Введіть назву книги"
          className="h-10"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="book-author">Автор</Label>
        <Input
          id="book-author"
          name="author"
          defaultValue={book?.author}
          maxLength={200}
          required
          placeholder="Введіть ім’я автора"
          className="h-10"
        />
      </div>
      <fieldset className="space-y-2">
        <legend className="mb-2 text-sm font-medium">Фото обкладинки</legend>
        <div className="grid grid-cols-2 gap-1 bg-muted p-1">
          <Button
            type="button"
            size="sm"
            className="px-1"
            variant={source === "url" ? "outline" : "ghost"}
            aria-pressed={source === "url"}
            onClick={() => setSource("url")}
          >
            За URL
          </Button>
          <Button
            type="button"
            size="sm"
            className="px-1"
            variant={source === "file" ? "outline" : "ghost"}
            aria-pressed={source === "file"}
            onClick={() => setSource("file")}
          >
            Завантажити файл
          </Button>
        </div>
        {source === "url" ? (
          <Input
            key="url"
            aria-label="Посилання на обкладинку"
            type="url"
            name="photo_url"
            maxLength={2048}
            required={!book}
            placeholder="https://example.com/cover.jpg"
            className="h-10"
          />
        ) : (
          <Input
            key="file"
            aria-label="Файл обкладинки"
            type="file"
            name="photo"
            required={!book}
            accept="image/jpeg,image/png,image/webp"
            className="h-10"
          />
        )}
        <p className="text-xs text-muted-foreground">
          {book
            ? "Залиште поле порожнім, щоб зберегти поточну обкладинку."
            : source === "url"
              ? "Вставте посилання на зображення."
              : "JPEG, PNG або WebP, до 2 МБ."}
        </p>
      </fieldset>
      <Button type="submit" className="h-10 w-full">
        {book ? "Зберегти" : "Додати"}
      </Button>
    </form>
  );
}
