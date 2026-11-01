import type { Metadata, Viewport } from "next";
import "./globals.css";
import DemoBanner from "@/components/DemoBanner";
import Header from "@/components/Header";

export const metadata: Metadata = {
  title: "stockaria.gr",
  description: "Καινούρια ρούχα και παπούτσια από καταστήματα, σε τιμές outlet.",
};

export const viewport: Viewport = { width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="el" className="h-full antialiased">
      <body className="flex min-h-full flex-col">
        <DemoBanner />
        <Header />
        <main className="flex-1">{children}</main>
        <footer className="border-t border-line px-4 py-6 text-center text-sm text-muted">
          stockaria.gr, δοκιμαστική έκδοση. Οι τιμές και τα καταστήματα είναι φανταστικά.
        </footer>
      </body>
    </html>
  );
}
