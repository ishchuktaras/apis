import Link from 'next/link'
import { Button } from "@/components/ui/button"
import { Check } from 'lucide-react'

export function LandingPricing() {
  return (
    <section id="cenik" className="py-24 bg-[#F8F5E6]">
      <div className="container mx-auto px-4">
        
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <h2 className="text-3xl md:text-4xl font-bold text-[#1A1A1A]">
            Férová cena bez skrytých poplatků
          </h2>
          <p className="text-slate-600">
            Vyberte si tarif, který sedí vaší velikosti. Žádné provize z obratu, žádné závazky.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          
          {/* SOLO */}
          <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
            <div className="mb-6">
              <h3 className="text-lg font-medium text-slate-500 uppercase tracking-widest">SOLO</h3>
              <div className="mt-4 flex items-baseline">
                <span className="text-4xl font-bold text-[#1A1A1A]">490 Kč</span>
                <span className="ml-1 text-slate-500">/ měsíc</span>
              </div>
              <p className="mt-2 text-sm text-slate-400">Pro jednotlivce (křeslo)</p>
            </div>
            
            <ul className="space-y-4 mb-8 flex-1">
              <li className="flex items-start gap-3">
                <Check className="h-5 w-5 text-green-500 shrink-0" />
                <span className="text-slate-600 text-sm">Webová vizitka</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="h-5 w-5 text-green-500 shrink-0" />
                <span className="text-slate-600 text-sm">Online rezervace</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="h-5 w-5 text-green-500 shrink-0" />
                <span className="text-slate-600 text-sm">1 uživatel</span>
              </li>
            </ul>

            <Link href="/login?view=register&plan=solo">
              <Button variant="outline" className="w-full h-12 border-slate-300 hover:border-[#1A1A1A] hover:bg-transparent text-slate-900">
                Začít zdarma
              </Button>
            </Link>
          </div>

          {/* SALON (Featured) */}
          <div className="bg-[#1A1A1A] p-8 rounded-2xl border border-[#1A1A1A] shadow-2xl relative transform md:-translate-y-4 flex flex-col">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#F4C430] text-[#1A1A1A] px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
              Doporučeno
            </div>
            <div className="mb-6">
              <h3 className="text-lg font-medium text-[#F4C430] uppercase tracking-widest">SALON</h3>
              <div className="mt-4 flex items-baseline">
                <span className="text-5xl font-bold text-white">990 Kč</span>
                <span className="ml-1 text-gray-400">/ měsíc</span>
              </div>
              <p className="mt-2 text-sm text-gray-400">Pro zavedené salony</p>
            </div>
            
            <ul className="space-y-4 mb-8 flex-1">
              <li className="flex items-start gap-3">
                <Check className="h-5 w-5 text-[#F4C430] shrink-0" />
                <span className="text-gray-300 text-sm">Vše ze SOLO</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="h-5 w-5 text-[#F4C430] shrink-0" />
                <span className="text-gray-300 text-sm"><strong>Web na míru</strong></span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="h-5 w-5 text-[#F4C430] shrink-0" />
                <span className="text-gray-300 text-sm">SMS připomínky</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="h-5 w-5 text-[#F4C430] shrink-0" />
                <span className="text-gray-300 text-sm">Až 5 zaměstnanců</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="h-5 w-5 text-[#F4C430] shrink-0" />
                <span className="text-gray-300 text-sm">Migrace dat zdarma</span>
              </li>
            </ul>

            <Link href="/login?view=register&plan=salon">
              <Button className="w-full h-12 bg-[#F4C430] hover:bg-[#E0B120] text-[#1A1A1A] font-bold text-lg">
                Vybrat SALON
              </Button>
            </Link>
          </div>

          {/* PRO */}
          <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
            <div className="mb-6">
              <h3 className="text-lg font-medium text-slate-500 uppercase tracking-widest">PRO</h3>
              <div className="mt-4 flex items-baseline">
                <span className="text-4xl font-bold text-[#1A1A1A]">1990 Kč</span>
                <span className="ml-1 text-slate-500">/ měsíc</span>
              </div>
              <p className="mt-2 text-sm text-slate-400">Pro velká centra</p>
            </div>
            
            <ul className="space-y-4 mb-8 flex-1">
              <li className="flex items-start gap-3">
                <Check className="h-5 w-5 text-green-500 shrink-0" />
                <span className="text-slate-600 text-sm">Vše ze SALON</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="h-5 w-5 text-green-500 shrink-0" />
                <span className="text-slate-600 text-sm">Neomezeně zaměstnanců</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="h-5 w-5 text-green-500 shrink-0" />
                <span className="text-slate-600 text-sm">Prioritní podpora</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="h-5 w-5 text-green-500 shrink-0" />
                <span className="text-slate-600 text-sm">API přístup</span>
              </li>
            </ul>

            <Link href="/login?view=register&plan=pro">
              <Button variant="outline" className="w-full h-12 border-slate-300 hover:border-[#1A1A1A] hover:bg-transparent text-slate-900">
                Kontaktovat pro demo
              </Button>
            </Link>
          </div>

        </div>

        <div className="mt-12 text-center text-sm text-slate-500">
          <p>Ceny jsou konečné (nejsem plátce DPH). Fakturace probíhá měsíčně.</p>
        </div>

      </div>
    </section>
  )
}