import { Globe, ShieldCheck, Heart, Zap } from 'lucide-react'

export const LandingUSP = () => {
  return (
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
  )
}