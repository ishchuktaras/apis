import { LandingHeader } from "@/components/landing/Header"
import { LandingHero } from "@/components/landing/Hero"
import { LandingUSP } from "@/components/landing/USP"
import { LandingPricing } from "@/components/landing/Ceník"
import { LandingCTA } from "@/components/landing/CTA"
import { LandingFooter } from "@/components/landing/Footer"

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* 1. Hlavička (Menu, Logo) */}
      <LandingHeader />

      <main className="flex-1">
        {/* 2. Hero Sekce (Nadpis, Tlačítka) */}
        <LandingHero />

        {/* 3. USP (Proč my, výhody) */}
        <LandingUSP />

        {/* 4. Ceník (Balíčky) */}
        <LandingPricing />

        {/* 5. CTA (Výzva k akci) */}
        <LandingCTA />
      </main>

      {/* 6. Patička (Copyright, Odkazy) */}
      <LandingFooter />
    </div>
  )
}