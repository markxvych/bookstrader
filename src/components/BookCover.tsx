import { BookOpen } from "lucide-react";

export default function BookCover({ url }: { url: string }) {
  if (!url)
    return (
      <div className="grid aspect-[3/4] w-full place-items-center bg-muted text-muted-foreground">
        <BookOpen aria-label="Без обкладинки" className="size-7" />
      </div>
    );

  return (
    <img
      className="aspect-[3/4] w-full bg-muted object-cover"
      src={url}
      alt=""
      loading="lazy"
      referrerPolicy="no-referrer"
    />
  );
}
