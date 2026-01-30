import Link from 'next/link'
import { Button } from "@/components/ui/button"
import { LogoIcon } from "@/components/logo"

export const LandingHeader = () => {
  return (
    <header className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-slate-100 transition-all">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        
        {/* Logo */}
        <Link className="flex items-center gap-2 group" href="/">
          <LogoIcon className="h-8 w-8 text-[#F4C430] transition-transform group-hover:scale-110" />
          <span className="font-bold text-xl tracking-tight text-slate-900">APIS</span>
        </Link>

        {/* Desktop Navigace */}
        <nav className="hidden md:flex gap-8 items-center">
          <Link className="text-sm font-medium text-slate-600 hover:text-[#1A1A1A] transition-colors" href="#funkce">
            Funkce
          </Link>
          <Link className="text-sm font-medium text-slate-600 hover:text-[#1A1A1A] transition-colors" href="#cenik">
            Ceník
          </Link>
          <div className="h-4 w-px bg-slate-200 mx-2" />
          <Link href="/login" className="text-sm font-medium text-slate-900 hover:text-[#F4C430] transition-colors">
            Přihlásit se
          </Link>
          <Link href="/login?view=register">
            <Button className="bg-[#1A1A1A] hover:bg-slate-800 text-white font-bold rounded-lg shadow-md hover:shadow-lg transition-all">
              Vyzkoušet zdarma
            </Button>
          </Link>
        </nav>

        {/* Mobile Menu Placeholder (pro jednoduchost jen tlačítko) */}
        <div className="md:hidden">
          <Link href="/login">
            <Button size="sm" variant="outline" className="border-[#F4C430] text-[#1A1A1A]">
              Vstoupit
            </Button>
          </Link>
        </div>

      </div>
    </header>
  )
}