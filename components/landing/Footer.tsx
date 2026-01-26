import Link from 'next/link'

export const LandingFooter = () => {
  return (
    <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t">
      <p className="text-xs text-slate-500">
        &copy; 2026 APIS (APIS SaaS). Všechna práva vyhrazena.
      </p>
      <nav className="sm:ml-auto flex gap-4 sm:gap-6">
        <Link className="text-xs hover:underline underline-offset-4 text-slate-500" href="#">
          Obchodní podmínky
        </Link>
        <Link className="text-xs hover:underline underline-offset-4 text-slate-500" href="#">
          Ochrana soukromí
        </Link>
      </nav>
    </footer>
  )
}
