import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { login, register } from "./actions";
import PasswordInput from "./PasswordInput";

export default function AuthForm({ signup }: { signup?: boolean }) {
  return (
    <main className="grid min-h-[calc(100dvh-4rem)] place-items-center px-4 py-10 sm:px-6">
      <Card className="w-full max-w-md gap-6 py-8">
        <CardHeader className="gap-1.5 px-6">
          <h1 className="font-heading text-2xl font-semibold tracking-wide uppercase">
            {signup ? "Створити акаунт" : "Увійти"}
          </h1>
          <CardDescription>
            {signup
              ? "Зареєструйтесь, щоб додавати свої книги."
              : "Увійдіть, щоб переглянути свої книги."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5 px-6">
          <form action={signup ? register : login} className="space-y-4">
            {signup && (
              <div className="space-y-2">
                <Label htmlFor="name">Ім’я користувача</Label>
                <Input
                  id="name"
                  name="name"
                  required
                  maxLength={100}
                  autoComplete="nickname"
                  placeholder="Ваш нікнейм"
                  className="h-10"
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Електронна пошта</Label>
              <Input
                id="email"
                type="email"
                name="email"
                required
                autoComplete="email"
                placeholder="name@example.com"
                className="h-10"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Пароль</Label>
              <PasswordInput signup={signup} />
              {signup && (
                <p id="password-hint" className="text-xs text-muted-foreground">
                  Щонайменше 6 символів.
                </p>
              )}
            </div>
            <Button type="submit" className="h-10 w-full">
              {signup ? "Зареєструватися" : "Увійти"}
            </Button>
          </form>
          <p className="text-center text-sm text-muted-foreground">
            {signup ? "Уже є акаунт? " : "Ще немає акаунта? "}
            <Link
              className="font-medium text-foreground underline underline-offset-4"
              href={signup ? "/login" : "/register"}
            >
              {signup ? "Увійти" : "Зареєструватися"}
            </Link>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
