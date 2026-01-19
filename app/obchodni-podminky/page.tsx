'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, ShieldCheck, Scale, FileText } from 'lucide-react'
import Link from 'next/link'

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Navigace zpět */}
        <Link href="/" className="inline-flex items-center text-sm text-slate-500 hover:text-slate-900 transition-colors mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" /> Zpět na hlavní stránku
        </Link>

        {/* Hlavička */}
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-extrabold text-slate-900 sm:text-4xl">
            Obchodní podmínky a GDPR
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Transparentní pravidla pro používání rezervačního systému APIS a ochranu vašich osobních údajů.
          </p>
        </div>

        {/* Hlavní karta s obsahem */}
        <Card className="shadow-lg border-slate-200">
          <CardHeader className="bg-white border-b border-slate-100 p-8">
            <div className="flex items-center gap-3 mb-2">
              <Scale className="h-6 w-6 text-primary" />
              <CardTitle>Všeobecné obchodní podmínky</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-8 prose prose-slate max-w-none text-slate-700">
            <h3>1. Úvodní ustanovení</h3>
            <p>
              Tyto obchodní podmínky upravují vztahy mezi provozovatelem platformy APIS (technický zprostředkovatel), 
              poskytovatelem služeb (jednotlivé salony) a koncovým zákazníkem (uživatel provádějící rezervaci).
            </p>
            <p className="bg-yellow-50 p-4 rounded-md border border-yellow-100 text-sm">
              <strong>Důležité upozornění:</strong> Platforma APIS slouží pouze jako technický nástroj pro rezervaci. 
              Samotnou službu (kadeřnictví, kosmetika atd.) poskytuje a fakturuje konkrétní salon, u kterého si termín rezervujete.
            </p>

            <h3>2. Rezervace a storno podmínky</h3>
            <ul>
              <li>Odesláním rezervačního formuláře vzniká závazná objednávka termínu u vybraného poskytovatele.</li>
              <li>Zákazník je povinen dostavit se včas. V případě zpoždění delšího než 15 minut může být rezervace bez náhrady zrušena.</li>
              <li>Zrušení rezervace je možné provést prostřednictvím odkazu v potvrzovacím e-mailu nebo telefonicky přímo v salonu.</li>
            </ul>

            <h3>3. Odpovědnost</h3>
            <p>
              Provozovatel platformy APIS nenese odpovědnost za kvalitu poskytnutých služeb v salonech, případné škody na zdraví či majetku vzniklé v provozovnách, 
              ani za správnost ceníků uvedených jednotlivými salony. Veškeré reklamace služeb řeší zákazník přímo s daným salonem.
            </p>
          </CardContent>
        </Card>

        {/* Karta GDPR */}
        <Card className="shadow-lg border-slate-200">
          <CardHeader className="bg-white border-b border-slate-100 p-8">
            <div className="flex items-center gap-3 mb-2">
              <ShieldCheck className="h-6 w-6 text-green-600" />
              <CardTitle>Zpracování osobních údajů (GDPR)</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-8 prose prose-slate max-w-none text-slate-700">
            <h3>1. Správce údajů</h3>
            <p>
              Správcem vašich osobních údajů je <strong>konkrétní salon</strong>, u kterého provádíte rezervaci. 
              Platforma APIS vystupuje v roli <strong>zpracovatele</strong>, který poskytuje technické zabezpečení dat.
            </p>

            <h3>2. Jaké údaje sbíráme</h3>
            <p>Pro účely vyřízení rezervace zpracováváme:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Jméno a příjmení (pro identifikaci rezervace)</li>
              <li>E-mailovou adresu (pro zaslání potvrzení a případné zrušení)</li>
              <li>Telefonní číslo (pro operativní komunikaci v případě změny)</li>
            </ul>

            <h3>3. Doba uchování</h3>
            <p>
              Vaše údaje jsou uchovávány v systému po dobu nezbytně nutnou pro vyřízení rezervace a následnou historii návštěv salonu, 
              maximálně však po dobu 3 let od poslední návštěvy, pokud právní předpisy nestanoví jinak.
            </p>

            <h3>4. Vaše práva</h3>
            <p>
              Máte právo požadovat přístup k vašim údajům, jejich opravu nebo výmaz ("právo být zapomenut"). 
              Tento požadavek můžete směřovat na provozovatele salonu nebo na technickou podporu platformy APIS (support@salonio.cz).
            </p>
          </CardContent>
        </Card>

        <div className="text-center pt-8 text-slate-400 text-sm">
          <p>© {new Date().getFullYear()} APIS Platforma. Všechna práva vyhrazena.</p>
        </div>

      </div>
    </div>
  )
}
