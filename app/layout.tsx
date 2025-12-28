import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Salonio - SaaS pro Beauty Salony",
  description: "Moderní rezervační systém pro kadeřnictví a kosmetiku.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="cs">
      {/* PŘIDÁNO: suppressHydrationWarning ignoruje změny od doplňků prohlížeče */}
      <body className={inter.className} suppressHydrationWarning={true}>
        {children}
      </body>
    </html>
  );
}