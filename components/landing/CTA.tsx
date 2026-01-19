import Link from 'next/link'
import { Button } from "@/components/ui/button"

export const LandingCTA = () => {
  return (
    <section className="w-full py-12 md:py-24 bg-slate-900 text-white">
      <div className="container px-4 md:px-6 mx-auto text-center">
        <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl mb-4">
          Připraveni modernizovat svůj salon?
        </h2>
        <p className="mx-auto max-w-[600px] text-slate-400 mb-8 text-lg">
          Přidejte se k salonům, které šetří čas a vydělávají více díky chytrým rezervacím.
        </p>
        <Link href="/login">
          <Button size="lg" className="bg-yellow-400 text-yellow-900 hover:bg-yellow-500 h-14 px-10 text-xl font-bold">
            Vyzkoušet Salonio zdarma
          </Button>
        </Link>
      </div>
    </section>
  )
}
