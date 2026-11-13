"use client";

import { useActionState, type ReactNode } from "react";
import Notice from "@/components/Notice";

export default function AdminForm({
  action,
  children,
  className,
}: {
  action: (previous: string, form: FormData) => Promise<string>;
  children: ReactNode;
  className?: string;
}) {
  const [error, submit, pending] = useActionState(action, "");

  return (
    <form action={submit}>
      <fieldset disabled={pending} className={className}>
        {children}
      </fieldset>
      {error && (
        <div className="mt-3">
          <Notice error={error} />
        </div>
      )}
    </form>
  );
}
