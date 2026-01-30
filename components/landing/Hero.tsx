import Link from 'next/link'
import { Button } from "@/components/ui/button"
import { CheckCircle2 } from 'lucide-react'

export function LandingHero() {
  return (
    <section className="relative bg-[#F8F5E6] overflow-hidden pt-20 pb-16 md:pt-32 md:pb-24">
      {/* Dekorativní prvky (Hexagony) */}
      <div className="absolute top-20 right-0 w-64 h-64 bg-[#F4C430]/10 rounded-full blur-3xl -z-10" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-100/30 rounded-full blur-3xl -z-10" />

      <div className="container mx-auto px-4">
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
          
          {/* Levá strana - Text */}
          <div className="flex-1 text-center lg:text-left space-y-8 animate-in slide-in-from-left-4 duration-700">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-slate-200 shadow-sm text-sm font-medium text-slate-600">
              <span className="flex h-2 w-2 rounded-full bg-green-500" />
              Verze 1.0 je nyní veřejně dostupná
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-[#1A1A1A] leading-[1.1] tracking-tight">
              Váš salon, váš web,<br />
              <span className="text-[#F4C430]">vaše pravidla.</span>
            </h1>
            
            <p className="text-lg text-slate-600 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
              Kompletní rezervační systém a profesionální web v jednom balíčku. 
              Nejsme tržiště, které vám bere klienty. Budujeme vaši značku, ne naši.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Link href="/login?view=register">
                <Button className="w-full sm:w-auto h-12 px-8 bg-[#F4C430] hover:bg-[#E0B120] text-[#1A1A1A] text-lg font-bold rounded-xl shadow-lg shadow-yellow-500/20 transition-transform active:scale-95">
                  Vyzkoušet zdarma
                </Button>
              </Link>
              <Link href="#cenik">
                <Button variant="outline" className="w-full sm:w-auto h-12 px-8 border-2 border-slate-200 text-slate-700 hover:border-[#1A1A1A] hover:bg-transparent rounded-xl font-medium">
                  Zobrazit ceník
                </Button>
              </Link>
            </div>

            <div className="pt-4 flex items-center justify-center lg:justify-start gap-6 text-sm text-slate-500 font-medium">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-green-500" /> Bez provizí
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-green-500" /> Česká podpora
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-green-500" /> Web v ceně
              </span>
            </div>
          </div>

          {/* Pravá strana - Visual (Mockup) */}
          <div className="flex-1 w-full relative animate-in slide-in-from-right-4 duration-1000 delay-200">
            <div className="relative mx-auto w-full max-w-[500px]">
              {/* Hlavní karta (Admin) */}
              <div className="relative z-20 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden transform rotate-[-2deg] hover:rotate-0 transition-transform duration-500">
                <div className="h-8 bg-slate-50 border-b border-slate-100 flex items-center px-4 gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <div className="w-3 h-3 rounded-full bg-yellow-400" />
                  <div className="w-3 h-3 rounded-full bg-green-400" />
                </div>
                <div className="p-6 space-y-4">
                  <div className="flex justify-between items-center">
                    <div className="h-8 w-32 bg-slate-100 rounded animate-pulse" />
                    <div className="h-8 w-8 bg-slate-100 rounded-full animate-pulse" />
                  </div>
                  <div className="flex gap-4">
                    <div className="h-24 w-1/3 bg-yellow-50 rounded-xl border border-yellow-100 flex flex-col justify-center items-center gap-2">
                         <div className="h-4 w-12 bg-yellow-200/50 rounded" />
                         <div className="h-6 w-16 bg-yellow-300/50 rounded" />
                    </div>
                    <div className="h-24 w-1/3 bg-slate-50 rounded-xl flex flex-col justify-center items-center gap-2">
                         <div className="h-4 w-12 bg-slate-200 rounded" />
                         <div className="h-6 w-16 bg-slate-300 rounded" />
                    </div>
                    <div className="h-24 w-1/3 bg-slate-50 rounded-xl flex flex-col justify-center items-center gap-2">
                         <div className="h-4 w-12 bg-slate-200 rounded" />
                         <div className="h-6 w-16 bg-slate-300 rounded" />
                    </div>
                  </div>
                  <div className="space-y-2 pt-2">
                     <div className="h-12 w-full bg-slate-50 rounded-lg border border-slate-100" />
                     <div className="h-12 w-full bg-slate-50 rounded-lg border border-slate-100" />
                     <div className="h-12 w-full bg-slate-50 rounded-lg border border-slate-100" />
                  </div>
                </div>
              </div>

              {/* Sekundární karta (Mobile Booking) */}
              <div className="absolute -bottom-10 -right-8 z-30 w-48 bg-white rounded-2xl shadow-xl border border-slate-200 p-3 transform rotate-[5deg] animate-in zoom-in duration-500 delay-500 hidden sm:block">
                 <div className="flex items-center gap-3 mb-3 border-b border-slate-50 pb-2">
                    <div className="w-8 h-8 rounded-full bg-slate-100" />
                    <div className="space-y-1">
                        <div className="h-2 w-20 bg-slate-100 rounded" />
                        <div className="h-2 w-12 bg-slate-100 rounded" />
                    </div>
                 </div>
                 <div className="space-y-2">
                    <div className="h-8 w-full bg-[#F4C430] rounded-lg flex items-center justify-center text-[10px] font-bold">Rezervovat</div>
                 </div>
              </div>

            </div>
          </div>

        </div>
      </div>
    </section>
  )
}