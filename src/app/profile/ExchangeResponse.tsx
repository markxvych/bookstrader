"use client";

import { useActionState } from "react";
import Notice from "@/components/Notice";
import { Button } from "@/components/ui/button";
import { respondToExchange } from "./actions";

export default function ExchangeResponse({ requestId }: { requestId: string }) {
  const [result, submit, pending] = useActionState(
    respondToExchange.bind(null, requestId),
    {},
  );

  return (
    <form action={submit} className="mt-2 space-y-2">
      <div className="flex flex-wrap gap-2">
        <Button
          type="submit"
          size="sm"
          name="decision"
          value="accept"
          disabled={pending}
        >
          Прийняти
        </Button>
        <Button
          type="submit"
          size="sm"
          variant="outline"
          name="decision"
          value="decline"
          disabled={pending}
        >
          Відхилити
        </Button>
      </div>
      {result.error && <Notice error={result.error} />}
    </form>
  );
}
