import { Suspense } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Notice from "@/components/Notice";
import { requireAdmin } from "@/lib/auth";
import { pageNumber } from "@/lib/forms";
import { createAdminClient } from "@/lib/supabase/admin";
import AdminForm from "./AdminForm";
import { createAccount, deleteAccount, updateAccount } from "./actions";

type AdminProps = { searchParams: Promise<{ page?: string }> };

async function AdminUsers({ searchParams }: AdminProps) {
  const { user } = await requireAdmin();
  const params = await searchParams;
  const page = pageNumber(params.page);
  if (!process.env.SUPABASE_SECRET_KEY) {
    return (
      <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
        <Notice error="Сталася помилка." />
      </main>
    );
  }
  const admin = createAdminClient();
  const perPage = 20;
  const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
  if (error)
    return (
      <main className="mx-auto w-full max-w-6xl space-y-4 px-4 py-8 sm:px-6">
        <h1 className="font-heading text-2xl font-bold tracking-tight">
          Адмінка
        </h1>
        <Notice error="Не вдалося завантажити користувачів." />
      </main>
    );

  const ids = data.users.map((account) => account.id);
  const profiles = ids.length
    ? await admin.from("profiles").select("id, name, role").in("id", ids)
    : null;
  if (profiles?.error)
    return (
      <main className="mx-auto w-full max-w-6xl space-y-4 px-4 py-8 sm:px-6">
        <h1 className="font-heading text-2xl font-bold tracking-tight">
          Адмінка
        </h1>
        <Notice error="Не вдалося завантажити профілі." />
      </main>
    );

  const byId = new Map(profiles?.data?.map((profile) => [profile.id, profile]));
  const pages = Math.max(1, Math.ceil(data.total / perPage) || data.lastPage);

  return (
    <main className="mx-auto w-full max-w-6xl space-y-5 px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-heading text-2xl font-bold tracking-tight sm:text-3xl">
          Користувачі
        </h1>
        <Dialog
          title="Додати користувача"
          key={ids.join(",")}
          trigger={
            <button type="button" className={buttonVariants()}>
              <Plus aria-hidden="true" /> Додати користувача
            </button>
          }
        >
          <AdminForm action={createAccount} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-name">Ім’я</Label>
              <Input
                id="new-name"
                name="name"
                maxLength={100}
                required
                className="h-10"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-email">Пошта</Label>
              <Input
                id="new-email"
                type="email"
                name="email"
                required
                className="h-10"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-password">Пароль</Label>
              <Input
                id="new-password"
                type="password"
                name="password"
                autoComplete="new-password"
                minLength={6}
                required
                className="h-10"
              />
            </div>
            <Button type="submit">Створити</Button>
          </AdminForm>
        </Dialog>
      </div>
      <Card className="gap-0 py-0">
        {data.users.length ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b bg-muted/40">
                <tr>
                  <th scope="col" className="px-4 py-3 font-medium">
                    Ім’я
                  </th>
                  <th scope="col" className="px-4 py-3 font-medium">
                    Пошта
                  </th>
                  <th scope="col" className="px-4 py-3 font-medium">
                    Роль
                  </th>
                  <th scope="col" className="px-4 py-3 font-medium">
                    Дії
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {data.users.map((account) => {
                  const profile = byId.get(account.id);
                  return (
                    <tr key={account.id}>
                      <td className="px-4 py-3 font-medium">
                        {profile?.name ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {account.email ?? "—"}
                      </td>
                      <td className="px-4 py-3">{profile?.role ?? "—"}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-2">
                          {profile && (
                            <Dialog
                              key={`${profile.name}:${account.email}`}
                              title="Редагувати користувача"
                              trigger={
                                <button
                                  type="button"
                                  className={buttonVariants({
                                    variant: "outline",
                                    size: "sm",
                                  })}
                                >
                                  Редагувати
                                </button>
                              }
                            >
                              <AdminForm
                                action={updateAccount.bind(null, account.id)}
                                className="space-y-4"
                              >
                                <div className="space-y-2">
                                  <Label htmlFor="edit-name">Ім’я</Label>
                                  <Input
                                    id="edit-name"
                                    name="name"
                                    defaultValue={profile.name}
                                    maxLength={100}
                                    required
                                    className="h-10"
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor="edit-email">Пошта</Label>
                                  <Input
                                    id="edit-email"
                                    type="email"
                                    name="email"
                                    defaultValue={account.email}
                                    required
                                    className="h-10"
                                  />
                                </div>
                                <Button type="submit">Зберегти</Button>
                              </AdminForm>
                            </Dialog>
                          )}
                          {account.id !== user.id && (
                            <Dialog
                              title="Видалити користувача?"
                              description="Акаунт і його книги буде видалено."
                              trigger={
                                <button
                                  type="button"
                                  className={buttonVariants({
                                    variant: "outline",
                                    size: "sm",
                                  })}
                                >
                                  Видалити
                                </button>
                              }
                            >
                              <AdminForm
                                action={deleteAccount.bind(null, account.id)}
                              >
                                <Button type="submit" variant="destructive">
                                  Видалити акаунт і книги
                                </Button>
                              </AdminForm>
                            </Dialog>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="p-6 text-center text-sm text-muted-foreground">
            Користувачів не знайдено.
          </p>
        )}
      </Card>
      {(page > 1 || pages > 1) && (
        <nav
          className="flex flex-wrap items-center justify-center gap-2 text-sm"
          aria-label="Сторінки користувачів"
        >
          {page > 1 && (
            <Link
              href={`/admin?page=${page - 1}`}
              className={buttonVariants({ variant: "outline" })}
            >
              <ChevronLeft aria-hidden="true" /> Попередня
            </Link>
          )}
          <span>
            {page} / {pages}
          </span>
          {page < pages && (
            <Link
              href={`/admin?page=${page + 1}`}
              className={buttonVariants({ variant: "outline" })}
            >
              Наступна <ChevronRight aria-hidden="true" />
            </Link>
          )}
        </nav>
      )}
    </main>
  );
}

export default function AdminPage(props: AdminProps) {
  return (
    <Suspense
      fallback={
        <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
          Завантаження користувачів…
        </main>
      }
    >
      <AdminUsers {...props} />
    </Suspense>
  );
}
