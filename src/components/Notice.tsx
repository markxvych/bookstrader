import { CircleAlert } from "lucide-react";

export default function Notice({ error }: { error: string }) {
  return (
    <p
      role="alert"
      className="flex items-start gap-2.5 rounded-md border bg-muted/40 p-3 text-sm text-destructive"
    >
      <CircleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
      <span>{error}</span>
    </p>
  );
}
