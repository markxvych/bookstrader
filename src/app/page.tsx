import Link from "next/link";
import { Suspense } from "react";
import { BookOpen } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { currentUser } from "@/lib/auth";

async function Welcome() {
  const session = await currentUser();

  if (session) {
    return (
      <div className="flex flex-wrap gap-2">
        <Link href="/books" className={buttonVariants()}>
          Усі книги
        </Link>
        <Link
          href="/me/books"
          className={buttonVariants({ variant: "outline" })}
        >
          Мої книги
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Link href="/register" className={buttonVariants()}>
        Зареєструватися
      </Link>
      <Link href="/login" className={buttonVariants({ variant: "outline" })}>
        Увійти
      </Link>
    </div>
  );
}

export default function Home() {
  return (
    <main className="grid flex-1 place-items-center px-4 py-12">
      <Card className="w-full max-w-lg">
        <CardContent className="space-y-5">
          <BookOpen className="size-8" aria-hidden="true" />
          <div className="space-y-2">
            <h1 className="font-heading text-3xl font-bold tracking-wide uppercase">
              Book Trader
            </h1>
            <p className="text-muted-foreground">Сервіс для обміну книгами.</p>
          </div>
          <Suspense fallback={<div className="h-10" />}>
            <Welcome />
          </Suspense>
        </CardContent>
      </Card>
    </main>
  );
}
