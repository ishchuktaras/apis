import { ShieldCheck, Palette, Zap, XCircle, CheckCircle } from 'lucide-react'

export function LandingUSP() {
  return (
    <section className="py-24 bg-white">
      <div className="container mx-auto px-4">
        
        {/* Intro */}
        <div className="text-center max-w-3xl mx-auto mb-20 space-y-4">
          <h2 className="text-3xl md:text-4xl font-bold text-[#1A1A1A]">
            Proč přejít na <span className="text-[#F4C430]">APIS</span>?
          </h2>
          <p className="text-slate-600 text-lg">
            Český trh je plný extrémů. Buď platíte drahé provize, nebo dostanete ošklivou krabici. 
            My jsme našli zlatou střední cestu.
          </p>
        </div>

        {/* Srovnání */}
        <div className="grid md:grid-cols-2 gap-8 lg:gap-12 mb-24">
          
          {/* Konkurence */}
          <div className="bg-red-50/50 p-8 rounded-2xl border border-red-100">
            <h3 className="text-xl font-bold text-red-900 mb-6 flex items-center gap-2">
              <XCircle className="h-6 w-6" /> Běžné portály a katalogy
            </h3>
            <ul className="space-y-4">
              <li className="flex gap-3 text-red-800/80">
                <XCircle className="h-5 w-5 shrink-0 mt-0.5 opacity-60" />
                <span>Berou si <strong>20% provizi</strong> z každého nového klienta.</span>
              </li>
              <li className="flex gap-3 text-red-800/80">
                <XCircle className="h-5 w-5 shrink-0 mt-0.5 opacity-60" />
                <span>Váš salon je jen jedna položka v katalogu vedle konkurence.</span>
              </li>
              <li className="flex gap-3 text-red-800/80">
                <XCircle className="h-5 w-5 shrink-0 mt-0.5 opacity-60" />
                <span>Data klientů patří jim, ne vám.</span>
              </li>
            </ul>
          </div>

          {/* APIS */}
          <div className="bg-[#FFFDF5] p-8 rounded-2xl border border-[#F4C430]/30 shadow-lg shadow-yellow-500/5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-20 h-20 bg-[#F4C430]/10 rounded-bl-full" />
            
            <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
              <CheckCircle className="h-6 w-6 text-[#F4C430] fill-[#1A1A1A]" /> APIS Řešení
            </h3>
            <ul className="space-y-4">
              <li className="flex gap-3 text-slate-700">
                <CheckCircle className="h-5 w-5 shrink-0 mt-0.5 text-green-600" />
                <span><strong>Žádné provize.</strong> Platíte jen fixní měsíční paušál.</span>
              </li>
              <li className="flex gap-3 text-slate-700">
                <CheckCircle className="h-5 w-5 shrink-0 mt-0.5 text-green-600" />
                <span><strong>Vlastní web v ceně.</strong> Budujeme vaši značku na vaší doméně.</span>
              </li>
              <li className="flex gap-3 text-slate-700">
                <CheckCircle className="h-5 w-5 shrink-0 mt-0.5 text-green-600" />
                <span>Databáze klientů je 100% vaše a v bezpečí.</span>
              </li>
            </ul>
          </div>

        </div>

        {/* 3 Karty Funkcí */}
        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              icon: Palette,
              title: "Web v ceně",
              desc: "Už žádné drahé agentury. Dostanete moderní, responzivní web, který se automaticky aktualizuje podle vašeho nastavení."
            },
            {
              icon: ShieldCheck,
              title: "Stop No-Show",
              desc: "Automatické SMS připomínky 24h před termínem drasticky snižují počet zapomenutých rezervací."
            },
            {
              icon: Zap,
              title: "Lokální podpora",
              desc: "Jsme tým z Jihlavy. Když něco nefunguje, dovoláte se reálnému člověku, který zná české podnikatelské prostředí."
            }
          ].map((item, i) => (
            <div key={i} className="p-6 rounded-xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
              <div className="w-12 h-12 bg-[#F4C430]/10 rounded-lg flex items-center justify-center text-[#F4C430] mb-4">
                <item.icon size={24} />
              </div>
              <h4 className="text-lg font-bold text-slate-900 mb-2">{item.title}</h4>
              <p className="text-slate-600 leading-relaxed text-sm">{item.desc}</p>
            </div>
          ))}
        </div>

      </div>
    </section>
  )
}