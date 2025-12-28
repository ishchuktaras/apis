import Link from 'next/link'
import { Button } from "@/components/ui/button"
import { Check, Scissors, Calendar, Globe, ShieldCheck, Heart, Zap } from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen">
      
      {/* --- NAVBAR --- */}
      <header className="px-4 lg:px-6 h-16 flex items-center border-b bg-white sticky top-0 z-50">
        <Link className="flex items-center justify-center gap-2" href="#">
          <div className="bg-slate-900 text-white p-1.5 rounded-full">
            <Scissors className="h-5 w-5" />
          </div>
          <span className="font-bold text-xl tracking-tight text-slate-900">Salonio</span>
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

      <main className="flex-1">
        
        {/* --- HERO SEKCE --- */}
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

        {/* --- USP (PROČ MY) --- */}
        <section id="funkce" className="w-full py-12 md:py-24 lg:py-32 bg-white">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl text-slate-900">Proč si salony vybírají Salonio?</h2>
              <p className="text-slate-500 mt-2">Protože rozumíme vašim potřebám a nehrajeme nefér hru.</p>
            </div>
            <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
              
              <div className="flex flex-col items-center text-center space-y-3">
                <div className="p-3 bg-blue-100 rounded-full text-blue-600">
                  <Globe className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-bold">Web v ceně</h3>
                <p className="text-slate-500 text-sm">
                  Už žádné tisíce za tvorbu webu. Získáte moderní profil salonu s vaší URL adresou, který si sami snadno upravíte.
                </p>
              </div>

              <div className="flex flex-col items-center text-center space-y-3">
                <div className="p-3 bg-green-100 rounded-full text-green-600">
                  <ShieldCheck className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-bold">Stop No-Show</h3>
                <p className="text-slate-500 text-sm">
                  Automatické SMS připomínky a chytrý kalendář eliminují klienty, kteří zapomínají přijít.
                </p>
              </div>

              <div className="flex flex-col items-center text-center space-y-3">
                <div className="p-3 bg-purple-100 rounded-full text-purple-600">
                  <Heart className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-bold">Férová cena</h3>
                <p className="text-slate-500 text-sm">
                  Žádné provize za nové klienty. Vaše databáze je jen vaše. Platíte fixní měsíční částku, ať vyděláte cokoliv.
                </p>
              </div>

              <div className="flex flex-col items-center text-center space-y-3">
                <div className="p-3 bg-yellow-100 rounded-full text-yellow-600">
                  <Zap className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-bold">Lokální podpora</h3>
                <p className="text-slate-500 text-sm">
                  Jsme česká firma z Jihlavy. Žádný robot na chatu, ale reálný člověk, který vám pomůže nastavit systém.
                </p>
              </div>

            </div>
          </div>
        </section>

        {/* --- CENÍK --- */}
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

        {/* --- CTA BOTTOM --- */}
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

      </main>

      {/* --- FOOTER --- */}
      <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t">
        <p className="text-xs text-slate-500">
          &copy; 2024 Salonio (Wellio SaaS). Všechna práva vyhrazena.
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
    </div>
  )
}