// app/layout.tsx

import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css"; 
import { Toaster } from "@/components/ui/sonner";
import { Providers } from "@/components/providers"; 

// Nastavení fontu Poppins
const poppins = Poppins({ 
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-poppins",
});

export const metadata: Metadata = {
  title: "APIS - Systém pro moderní salony",
  description: "Vlastní web a rezervace pro kadeřnictví a beauty salony.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="cs">
      <body className={poppins.className} suppressHydrationWarning={true}>
        
        <Providers>
          {children}
        </Providers>
        
        <Toaster />
      </body>
    </html>
  );
}