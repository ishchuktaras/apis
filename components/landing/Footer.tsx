import Link from 'next/link'
import { LogoIcon } from "@/components/logo"
import { Facebook, Instagram, Linkedin, Mail, MapPin, Phone } from 'lucide-react'

export const LandingFooter = () => {
  return (
    <footer className="bg-[#1A1A1A] text-slate-300 py-16 border-t border-white/5 font-sans">
      <div className="container mx-auto px-4">
        
        {/* Hlavní Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          
          {/* 1. Brand */}
          <div className="space-y-6">
            <Link href="/" className="flex items-center gap-2">
              <LogoIcon className="h-8 w-8 text-[#F4C430]" />
              <span className="font-bold text-xl text-white tracking-tight">APIS</span>
            </Link>
            <p className="text-sm leading-relaxed text-slate-400">
              Kompletní operační systém pro moderní salony a studia. 
              Vlastní web, rezervace a CRM v jedné aplikaci.
            </p>
            <div className="flex gap-4">
              <Link href="#" className="p-2 bg-white/5 rounded-full hover:bg-[#F4C430] hover:text-[#1A1A1A] transition-colors">
                <Instagram size={18} />
              </Link>
              <Link href="#" className="p-2 bg-white/5 rounded-full hover:bg-[#F4C430] hover:text-[#1A1A1A] transition-colors">
                <Facebook size={18} />
              </Link>
              <Link href="#" className="p-2 bg-white/5 rounded-full hover:bg-[#F4C430] hover:text-[#1A1A1A] transition-colors">
                <Linkedin size={18} />
              </Link>
            </div>
          </div>

          {/* 2. Produkt */}
          <div>
            <h4 className="font-bold text-white mb-6">Produkt</h4>
            <ul className="space-y-4 text-sm">
              <li><Link href="#funkce" className="hover:text-[#F4C430] transition-colors">Funkce</Link></li>
              <li><Link href="#cenik" className="hover:text-[#F4C430] transition-colors">Ceník</Link></li>
              <li><Link href="/login" className="hover:text-[#F4C430] transition-colors">Přihlášení</Link></li>
              <li><Link href="/login?view=register" className="hover:text-[#F4C430] transition-colors">Registrace</Link></li>
            </ul>
          </div>

          {/* 3. Právní */}
          <div>
            <h4 className="font-bold text-white mb-6">Informace</h4>
            <ul className="space-y-4 text-sm">
              <li><Link href="/obchodni-podminky" className="hover:text-[#F4C430] transition-colors">Obchodní podmínky</Link></li>
              <li><Link href="#" className="hover:text-[#F4C430] transition-colors">Ochrana soukromí</Link></li>
              <li><Link href="#" className="hover:text-[#F4C430] transition-colors">Cookies</Link></li>
            </ul>
          </div>

          {/* 4. Kontakt */}
          <div>
            <h4 className="font-bold text-white mb-6">Kontakt</h4>
            <ul className="space-y-4 text-sm">
              <li className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-[#F4C430] shrink-0" />
                <span>Rantířovská 123/36<br />586 01 Jihlava</span>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-[#F4C430] shrink-0" />
                <a href="mailto:info@saas-apis.cz" className="hover:text-white">info@saas-apis.cz</a>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-[#F4C430] shrink-0" />
                <a href="tel:+420777596216" className="hover:text-white">+420 777 596 216</a>
              </li>
            </ul>
          </div>

        </div>

        {/* Spodní lišta */}
        <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-slate-500">
          <p>&copy; {new Date().getFullYear()} APIS SaaS. Všechna práva vyhrazena.</p>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            <span>Všechny systémy funkční</span>
          </div>
        </div>
      </div>
    </footer>
  )
}