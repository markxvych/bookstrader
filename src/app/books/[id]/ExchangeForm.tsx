"use client";

import { useActionState } from "react";
import { ArrowLeftRight } from "lucide-react";
import Notice from "@/components/Notice";
import { Button } from "@/components/ui/button";
import { requestExchange } from "./actions";

export default function ExchangeForm({ bookId }: { bookId: string }) {
  const [result, submit, pending] = useActionState(
    requestExchange.bind(null, bookId),
    {},
  );

  return (
    <form action={submit} className="space-y-3">
      <Button type="submit" disabled={pending || result.sent}>
        <ArrowLeftRight aria-hidden="true" />
        {pending ? "Надсилаємо…" : "Запросити обмін"}
      </Button>
      {result.error ? (
        <Notice error={result.error} />
      ) : result.sent ? (
        <p role="status" className="text-sm text-muted-foreground">
          Запит на обмін надіслано.
        </p>
      ) : null}
    </form>
  );
}
