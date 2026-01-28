import React from "react"
import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: 'Salonio - Rezervační systém pro salony',
    template: '%s | Salonio'
  },
  description: 'Moderní rezervační systém pro kadeřnictví, kosmetiku, wellness a další služby. Spravujte rezervace, zákazníky a platby na jednom místě.',
  keywords: ['rezervační systém', 'salon', 'kadeřnictví', 'kosmetika', 'wellness', 'booking', 'SaaS'],
  authors: [{ name: 'Web Na Míru', url: 'https://webnamiru.site' }],
  creator: 'Web Na Míru',
  publisher: 'Web Na Míru',
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://app.salonio.cz'),
  openGraph: {
    type: 'website',
    locale: 'cs_CZ',
    siteName: 'Salonio',
    title: 'Salonio - Rezervační systém pro salony',
    description: 'Moderní rezervační systém pro kadeřnictví, kosmetiku, wellness a další služby.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Salonio - Rezervační systém pro salony',
    description: 'Moderní rezervační systém pro kadeřnictví, kosmetiku, wellness a další služby.',
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
    generator: 'v0.app'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="cs">
      <body className={`font-sans antialiased`}>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
