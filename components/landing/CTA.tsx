import Link from 'next/link'
import { Button } from "@/components/ui/button"
import { ArrowRight } from 'lucide-react'

export const LandingCTA = () => {
  return (
    <section className="py-20 md:py-32 bg-[#1A1A1A] relative overflow-hidden">
      {/* Abstraktní pozadí */}
      <div className="absolute top-0 left-0 w-full h-full opacity-10">
         <div className="absolute right-0 top-0 w-96 h-96 bg-[#F4C430] rounded-full blur-[120px]" />
         <div className="absolute left-0 bottom-0 w-64 h-64 bg-blue-500 rounded-full blur-[100px]" />
      </div>

      <div className="container mx-auto px-4 relative z-10 text-center">
        <h2 className="text-3xl md:text-5xl font-bold text-white mb-6 tracking-tight">
          Připraveni modernizovat svůj salon?
        </h2>
        <p className="mx-auto max-w-2xl text-slate-400 mb-10 text-lg md:text-xl leading-relaxed">
          Přidejte se k salonům, které šetří čas a vydělávají více díky chytrým rezervacím. 
          Prvních 14 dní máte zcela zdarma.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link href="/login?view=register">
            <Button size="lg" className="bg-[#F4C430] text-[#1A1A1A] hover:bg-[#E0B120] h-14 px-8 text-lg font-bold rounded-xl shadow-lg shadow-yellow-500/20 group">
              Vytvořit účet zdarma
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
          <p className="text-xs text-slate-500 mt-4 sm:mt-0">
            Bez nutnosti zadávat kartu.
          </p>
        </div>
      </div>
    </section>
  )
}