import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Bell, BookOpen, UserRound } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Notice from "@/components/Notice";
import { requireUser } from "@/lib/auth";
import { isImageUrl } from "@/lib/forms";
import { changeEmail, saveProfile } from "./actions";
import ExchangeResponse from "./ExchangeResponse";

export const metadata: Metadata = {
  title: "Профіль",
  robots: { index: false, follow: false },
};

async function Profile() {
  const { supabase, user, profile } = await requireUser();
  if (!profile)
    return (
      <main className="mx-auto max-w-5xl space-y-4 px-4 py-8 sm:px-6">
        <h1 className="text-2xl font-heading font-bold tracking-wide">
          Мій профіль
        </h1>
        <Notice error="Профіль відсутній." />
      </main>
    );

  const [books, inbox] = await Promise.all([
    supabase
      .from("books")
      .select("id", { count: "exact", head: true })
      .eq("owner_id", user.id),
    supabase
      .from("exchange_notifications")
      .select(
        "id, book_id, book_name, sender_name, created_at, offered_book_name, status",
      )
      .eq("recipient_id", user.id)
      .order("created_at", { ascending: false }),
  ]);

  return (
    <main className="mx-auto max-w-5xl space-y-6 px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-4">
          {profile.avatar_url && isImageUrl(profile.avatar_url) ? (
            <img
              className="size-14 shrink-0 rounded-full bg-muted object-cover"
              src={profile.avatar_url}
              alt=""
              referrerPolicy="no-referrer"
            />
          ) : (
            <span className="grid size-14 shrink-0 place-items-center rounded-full bg-muted text-muted-foreground">
              <UserRound className="size-6" aria-hidden="true" />
            </span>
          )}
          <div className="min-w-0">
            <h1 className="text-2xl font-heading font-bold tracking-wide sm:text-3xl">
              Мій профіль
            </h1>
            <p className="text-sm wrap-break-word text-muted-foreground">
              @{profile.name}
            </p>
          </div>
        </div>
        <Link
          href="/me/books"
          className={buttonVariants({ variant: "outline" })}
        >
          <BookOpen aria-hidden="true" />{" "}
          {books.error ? "Мої книги" : `Книг у колекції: ${books.count ?? 0}`}
        </Link>
      </div>
      <div className="grid items-start gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <h2 className="font-heading text-lg font-semibold">
              Особисті дані
            </h2>
          </CardHeader>
          <CardContent>
            <form action={saveProfile} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="profile-name">Ім’я</Label>
                <Input
                  id="profile-name"
                  name="name"
                  defaultValue={profile.name}
                  maxLength={100}
                  required
                  className="h-10"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="profile-avatar">Аватар (HTTPS URL)</Label>
                <Input
                  id="profile-avatar"
                  type="url"
                  name="avatar_url"
                  defaultValue={profile.avatar_url ?? ""}
                  maxLength={2048}
                  className="h-10"
                />
              </div>
              <Button type="submit">Зберегти профіль</Button>
            </form>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <h2 className="font-heading text-lg font-semibold">
              Електронна пошта
            </h2>
          </CardHeader>
          <CardContent>
            <form action={changeEmail} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="profile-email">Адреса</Label>
                <Input
                  id="profile-email"
                  type="email"
                  name="email"
                  defaultValue={user.email}
                  required
                  className="h-10"
                />
              </div>
              <Button type="submit" variant="outline">
                Змінити пошту
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <h2 className="flex items-center gap-2 font-heading text-lg font-semibold">
            <Bell className="size-5" aria-hidden="true" /> Запити на обмін
          </h2>
        </CardHeader>
        <CardContent>
          {inbox.error ? (
            <Notice error="Не вдалося завантажити запити." />
          ) : inbox.data.length ? (
            <ul className="divide-y text-sm">
              {inbox.data.map((item) => (
                <li
                  className="py-3 wrap-break-word first:pt-0 last:pb-0"
                  key={item.id}
                >
                  <strong>{item.sender_name}</strong>{" "}
                  {item.offered_book_name ? (
                    <>пропонує «{item.offered_book_name}» за </>
                  ) : (
                    <>запитував обмін на </>
                  )}
                  {item.book_id ? (
                    <Link
                      className="font-medium underline underline-offset-4"
                      href={`/books/${item.book_id}`}
                    >
                      {item.book_name}
                    </Link>
                  ) : (
                    item.book_name
                  )}
                  <time
                    className="mt-1 block text-xs text-muted-foreground"
                    dateTime={item.created_at}
                  >
                    {new Date(item.created_at).toLocaleDateString("uk-UA")}
                  </time>
                  {item.status === "pending" && item.offered_book_name && (
                    <ExchangeResponse requestId={item.id} />
                  )}
                  {item.status === "accepted" && (
                    <p className="mt-2 text-muted-foreground">
                      Обмін завершено.
                    </p>
                  )}
                  {item.status === "declined" && (
                    <p className="mt-2 text-muted-foreground">
                      Запит відхилено.
                    </p>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">Запитів поки немає.</p>
          )}
        </CardContent>
      </Card>
    </main>
  );
}

export default function ProfilePage() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto w-full max-w-5xl px-4 py-8 text-sm text-muted-foreground sm:px-6">
          Завантаження профілю…
        </main>
      }
    >
      <Profile />
    </Suspense>
  );
}
