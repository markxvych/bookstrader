import type { Metadata } from "next";
import { Suspense } from "react";
import Header from "@/components/Header";
import { Geist, DM_Sans, Raleway } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";

const ralewayHeading = Raleway({
  subsets: ["latin"],
  variable: "--font-heading",
});

const dmSans = DM_Sans({ subsets: ["latin"], variable: "--font-sans" });

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Головна",
  description: "Сервіс для обміну книгами",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="uk"
      className={cn(
        "h-full",
        "antialiased",
        geistSans.variable,
        "font-sans",
        dmSans.variable,
        ralewayHeading.variable,
      )}
    >
      <body className="min-h-full flex flex-col">
        <Suspense fallback={<div className="h-16 border-b" />}>
          <Header />
        </Suspense>
        {children}
      </body>
    </html>
  );
}
