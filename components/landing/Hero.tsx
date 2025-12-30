import Link from 'next/link'
import { Button } from "@/components/ui/button"

export const LandingHero = () => {
  return (
    <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48 bg-slate-50">
      <div className="container px-4 md:px-6 mx-auto">
        <div className="flex flex-col items-center space-y-4 text-center">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl/none text-slate-900">
              Vlastní web a rezervace <br className="hidden sm:inline" />
              pro váš salon v jednom.
            </h1>
            <p className="mx-auto max-w-[700px] text-slate-500 md:text-xl dark:text-slate-400">
              Neplaťte agenturám za web a dalším za systém. Salonio vám dá profesionální prezentaci i chytrý kalendář za jeden férový paušál.
            </p>
          </div>
          <div className="space-x-4 pt-4">
            <Link href="/login">
              <Button size="lg" className="bg-slate-900 text-white hover:bg-slate-800 h-12 px-8 text-lg">
                Začít zdarma
              </Button>
            </Link>
            <Link href="#funkce">
              <Button variant="outline" size="lg" className="h-12 px-8 text-lg">
                Zjistit více
              </Button>
            </Link>
          </div>
          <p className="text-xs text-slate-400 pt-2">
            Bez nutnosti zadávat kartu. 14 dní na vyzkoušení zdarma.
          </p>
        </div>
      </div>
    </section>
  )
}