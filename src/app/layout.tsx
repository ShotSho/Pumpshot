import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Pumpshot",
  description: "Track the wallet. Watch every trade. Replay the pump.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col">
        <main className="mx-auto w-full max-w-[1200px] flex-1 px-4 sm:px-6">
          {children}
        </main>
        <footer className="mt-8 border-t border-line/50">
          <div className="mx-auto flex w-full max-w-[1200px] items-center justify-between px-4 py-6 sm:px-6">
            <p className="font-mono text-[12px] text-tx3">
              &copy; {new Date().getFullYear()} Pumpshot
            </p>
            <a
              href="https://x.com/pumpshot25"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-tx2 transition-colors hover:text-tx"
              title="Follow on X"
            >
              <span className="font-mono text-[12px]">Follow us</span>
              <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4 fill-current">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 22.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </a>
          </div>
        </footer>
        <Analytics />
      </body>
    </html>
  );
}
