import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export default function BookNotFound() {
  return (
    <main className="mx-auto max-w-6xl space-y-4 px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-semibold tracking-tight">
        Книгу не знайдено
      </h1>
      <Link href="/books" className={buttonVariants({ variant: "outline" })}>
        До каталогу
      </Link>
    </main>
  );
}
