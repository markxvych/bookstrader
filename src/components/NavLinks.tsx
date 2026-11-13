"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function NavLinks() {
  const pathname = usePathname();
  const links = [
    { href: "/books", label: "Усі книги" },
    { href: "/me/books", label: "Мої книги" },
  ];

  return (
    <nav
      aria-label="Основна навігація"
      className="order-last flex w-full flex-wrap gap-x-5 gap-y-2 sm:order-0 sm:w-auto"
    >
      {links.map(({ href, label }) => (
        <Link
          key={href}
          href={href}
          aria-current={pathname === href ? "page" : undefined}
          className={
            pathname === href || pathname.startsWith(`${href}/`)
              ? "text-sm font-semibold text-foreground"
              : "text-sm font-medium text-muted-foreground hover:text-foreground"
          }
        >
          {label}
        </Link>
      ))}
    </nav>
  );
}
