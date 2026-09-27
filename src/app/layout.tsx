import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { DM_Sans, Nunito } from "next/font/google";
import "./globals.css";

const heading = Nunito({ variable: "--font-heading", subsets: ["latin"], weight: ["700", "800"] });
const body = DM_Sans({ variable: "--font-body", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Tripsy",
  description: "Get the group trip out of the chat and onto the calendar.",
};

export const viewport: Viewport = {
  themeColor: "#fff8f3",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${heading.variable} ${body.variable} antialiased`}>
      <body className="min-h-dvh font-sans">
        <header className="mx-auto flex max-w-xl items-center px-4 pt-5">
          <Link href="/" className="flex items-center gap-2 font-display text-xl font-extrabold text-coral-deep">
            <span
              aria-hidden
              className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blush to-sand text-base shadow-sm"
            >
              ✈
            </span>
            tripsy
          </Link>
        </header>
        <main className="mx-auto max-w-xl px-4 pb-16 pt-4">{children}</main>
      </body>
    </html>
  );
}
