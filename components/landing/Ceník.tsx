import Link from 'next/link'
import { Button } from "@/components/ui/button"
import { Check } from 'lucide-react'

export const LandingPricing = () => {
  return (
    <section id="cenik" className="w-full py-12 md:py-24 lg:py-32 bg-slate-50">
      <div className="container px-4 md:px-6 mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl text-slate-900">Vyberte si svůj plán</h2>
          <p className="text-slate-500 mt-2">Jednoduché ceny bez skrytých poplatků.</p>
        </div>
        
        <div className="grid gap-6 lg:grid-cols-3 lg:gap-8 max-w-5xl mx-auto">
          
          {/* SOLO */}
          <div className="flex flex-col p-6 bg-white rounded-xl shadow-sm border hover:border-slate-400 transition-colors">
            <div className="mb-4">
              <h3 className="text-2xl font-bold">SOLO</h3>
              <p className="text-slate-500 text-sm">Pro IČaře a pronájem křesla</p>
            </div>
            <div className="mb-6">
              <span className="text-4xl font-bold">490 Kč</span>
              <span className="text-slate-500"> / měsíc</span>
            </div>
            <ul className="space-y-3 mb-6 flex-1">
              <li className="flex items-center gap-2 text-sm"><Check className="h-4 w-4 text-green-500"/> Webová vizitka</li>
              <li className="flex items-center gap-2 text-sm"><Check className="h-4 w-4 text-green-500"/> Online rezervace</li>
              <li className="flex items-center gap-2 text-sm"><Check className="h-4 w-4 text-green-500"/> 1 Kalendář</li>
              <li className="flex items-center gap-2 text-sm"><Check className="h-4 w-4 text-green-500"/> Správa klientů</li>
            </ul>
            <Link href="/login">
              <Button className="w-full bg-slate-100 text-slate-900 hover:bg-slate-200">Vybrat SOLO</Button>
            </Link>
          </div>

          {/* SALON (Featured) */}
          <div className="flex flex-col p-6 bg-slate-900 text-white rounded-xl shadow-lg border-2 border-slate-900 relative">
            <div className="absolute top-0 right-0 bg-yellow-400 text-yellow-900 text-xs font-bold px-3 py-1 rounded-bl-lg rounded-tr-lg">
              NEJOBLÍBENĚJŠÍ
            </div>
            <div className="mb-4">
              <h3 className="text-2xl font-bold">SALON</h3>
              <p className="text-slate-400 text-sm">Pro menší tým (2-3 lidi)</p>
            </div>
            <div className="mb-6">
              <span className="text-4xl font-bold">990 Kč</span>
              <span className="text-slate-400"> / měsíc</span>
            </div>
            <ul className="space-y-3 mb-6 flex-1">
              <li className="flex items-center gap-2 text-sm"><Check className="h-4 w-4 text-yellow-400"/> Vše ze SOLO</li>
              <li className="flex items-center gap-2 text-sm"><Check className="h-4 w-4 text-yellow-400"/> Až 3 Kalendáře</li>
              <li className="flex items-center gap-2 text-sm"><Check className="h-4 w-4 text-yellow-400"/> SMS připomínky</li>
              <li className="flex items-center gap-2 text-sm"><Check className="h-4 w-4 text-yellow-400"/> Pokročilé statistiky</li>
            </ul>
            <Link href="/login">
              <Button className="w-full bg-yellow-400 text-yellow-900 hover:bg-yellow-500 font-bold">Vybrat SALON</Button>
            </Link>
          </div>

          {/* PRO */}
          <div className="flex flex-col p-6 bg-white rounded-xl shadow-sm border hover:border-slate-400 transition-colors">
            <div className="mb-4">
              <h3 className="text-2xl font-bold">PRO</h3>
              <p className="text-slate-500 text-sm">Pro větší studia a sítě</p>
            </div>
            <div className="mb-6">
              <span className="text-4xl font-bold">1990 Kč</span>
              <span className="text-slate-500"> / měsíc</span>
            </div>
            <ul className="space-y-3 mb-6 flex-1">
              <li className="flex items-center gap-2 text-sm"><Check className="h-4 w-4 text-green-500"/> Neomezeně kalendářů</li>
              <li className="flex items-center gap-2 text-sm"><Check className="h-4 w-4 text-green-500"/> Vlastní doména (cz)</li>
              <li className="flex items-center gap-2 text-sm"><Check className="h-4 w-4 text-green-500"/> Prioritní podpora</li>
              <li className="flex items-center gap-2 text-sm"><Check className="h-4 w-4 text-green-500"/> API přístup</li>
            </ul>
            <Link href="/login">
              <Button className="w-full bg-slate-100 text-slate-900 hover:bg-slate-200">Vybrat PRO</Button>
            </Link>
          </div>

        </div>
      </div>
    </section>
  )
}