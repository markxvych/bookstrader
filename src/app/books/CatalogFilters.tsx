"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { ArrowDownUp, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function CatalogFilters({
  search,
  sort,
}: {
  search: string;
  sort: "asc" | "desc";
}) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    function restoreFilters() {
      clearTimeout(timer.current);
      const params = new URLSearchParams(window.location.search);
      const input = formRef.current?.querySelector("input");
      const select = formRef.current?.querySelector("select");
      if (input) input.value = (params.get("q") ?? "").trim().slice(0, 200);
      if (select) select.value = params.get("sort") === "desc" ? "desc" : "asc";
    }

    window.addEventListener("popstate", restoreFilters);
    return () => {
      clearTimeout(timer.current);
      window.removeEventListener("popstate", restoreFilters);
    };
  }, []);

  function updateCatalog(form: HTMLFormElement) {
    clearTimeout(timer.current);
    const fields = new FormData(form);
    const query = new URLSearchParams({
      q: String(fields.get("q") ?? "").trim(),
      sort: String(fields.get("sort") ?? "asc"),
      page: "1",
    });
    router.replace(`/books?${query}`, { scroll: false });
  }

  return (
    <form
      action="/books"
      ref={formRef}
      onSubmit={(event) => {
        event.preventDefault();
        updateCatalog(event.currentTarget);
      }}
      className="mt-5 grid items-end gap-3 sm:grid-cols-[minmax(0,1.6fr)_minmax(11rem,1fr)]"
    >
      <div className="relative">
        <Label className="sr-only" htmlFor="catalog-search">
          Пошук за назвою або автором
        </Label>
        <Search
          className="pointer-events-none absolute top-3 left-3 size-4 text-muted-foreground"
          aria-hidden="true"
        />
        <Input
          id="catalog-search"
          name="q"
          type="search"
          defaultValue={search}
          onChange={(event) => {
            const form = event.currentTarget.form;
            if (!form) return;
            clearTimeout(timer.current);
            timer.current = setTimeout(() => updateCatalog(form), 300);
          }}
          maxLength={200}
          placeholder="Пошук за назвою або автором"
          className="h-10 pl-9"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="catalog-sort" className="text-muted-foreground">
          Сортування
        </Label>
        <div className="relative">
          <ArrowDownUp
            className="pointer-events-none absolute top-3 left-3 size-4"
            aria-hidden="true"
          />
          <select
            id="catalog-sort"
            name="sort"
            defaultValue={sort}
            onChange={(event) => {
              if (event.currentTarget.form)
                updateCatalog(event.currentTarget.form);
            }}
            className="h-10 w-full border border-transparent border-b-input bg-background pr-3 pl-9 text-sm focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="asc">За назвою: А–Я</option>
            <option value="desc">За назвою: Я–А</option>
          </select>
        </div>
      </div>
      <button type="submit" hidden />
    </form>
  );
}
