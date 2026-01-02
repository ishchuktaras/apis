import Link from 'next/link'
import { Button } from "@/components/ui/button"
import { LogoIcon } from "@/components/logo" // Předpokládám, že logo.tsx je v components/

export const LandingHeader = () => {
  return (
    <header className="px-4 lg:px-6 h-16 flex items-center border-b bg-white sticky top-0 z-50">
      <Link className="flex items-center justify-center gap-2" href="#">
        
          <LogoIcon className="h-12 w-12 text-white" />
      
        <span className="font-bold text-xl tracking-tight text-slate-900">APIS</span>
      </Link>
      <nav className="ml-auto flex gap-4 sm:gap-6 items-center">
        <Link className="text-sm font-medium hover:underline underline-offset-4 hidden sm:block" href="#funkce">
          Funkce
        </Link>
        <Link className="text-sm font-medium hover:underline underline-offset-4 hidden sm:block" href="#cenik">
          Ceník
        </Link>
        <Link href="/login">
          <Button variant="outline" className="mr-2">Přihlásit se</Button>
        </Link>
        <Link href="/login">
          <Button className="bg-slate-900 hover:bg-slate-800 text-white">Vyzkoušet zdarma</Button>
        </Link>
      </nav>
    </header>
  )
}