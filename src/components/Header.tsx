import Link from "next/link";
import { BookOpen, LogOut } from "lucide-react";
import { logout } from "@/app/(auth)/actions";
import { currentUser } from "@/lib/auth";
import NavLinks from "./NavLinks";
import { Button, buttonVariants } from "@/components/ui/button";

export default async function Header() {
  const session = await currentUser();

  return (
    <header className="border-b bg-background">
      <div className="mx-auto flex min-h-16 max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <Link
          href="/"
          className="inline-flex items-center gap-2.5 font-heading text-lg font-bold tracking-wide uppercase"
        >
          <BookOpen className="size-5" aria-hidden="true" /> Book Trader
        </Link>
        {session ? (
          <>
            <NavLinks isAdmin={session.profile?.role === "Admin"} />
            <form
              action={logout}
              className="ml-auto flex flex-wrap items-center gap-3"
            >
              <span className="text-sm text-muted-foreground">
                {session.profile?.name ?? session.user.email}
              </span>
              <Button type="submit" variant="outline" size="sm">
                <LogOut aria-hidden="true" /> Вийти
              </Button>
            </form>
          </>
        ) : (
          <nav aria-label="Авторизація" className="flex flex-wrap gap-2">
            <Link
              href="/login"
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              Увійти
            </Link>
            <Link href="/register" className={buttonVariants({ size: "sm" })}>
              Зареєструватися
            </Link>
          </nav>
        )}
      </div>
    </header>
  );
}
