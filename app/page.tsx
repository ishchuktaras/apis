import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar, Clock, CreditCard, MessageSquare, Shield, Users } from "lucide-react"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Calendar className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold">Salonio</span>
          </Link>
          
          <nav className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost">Přihlásit se</Button>
            </Link>
            <Link href="/register">
              <Button>Vyzkoušet zdarma</Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container py-24 text-center">
        <h1 className="text-balance text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
          Moderní rezervační systém
          <br />
          <span className="text-primary">pro váš salon</span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-pretty text-lg text-muted-foreground">
          Spravujte rezervace, zákazníky a platby na jednom místě. 
          Automatické připomínky, online platby a přehledný kalendář.
        </p>
        <div className="mt-10 flex justify-center gap-4">
          <Link href="/register">
            <Button size="lg" className="gap-2">
              Začít zdarma
              <Calendar className="h-4 w-4" />
            </Button>
          </Link>
          <Link href="#features">
            <Button size="lg" variant="outline">
              Zjistit více
            </Button>
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="container py-24">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight">Vše co potřebujete</h2>
          <p className="mt-4 text-muted-foreground">
            Kompletní řešení pro správu vašeho salonu
          </p>
        </div>

        <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <Calendar className="h-10 w-10 text-primary" />
              <CardTitle className="mt-4">Online rezervace</CardTitle>
              <CardDescription>
                Zákazníci si mohou rezervovat termíny 24/7 přes váš web nebo mobilní aplikaci.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Clock className="h-10 w-10 text-primary" />
              <CardTitle className="mt-4">Automatické připomínky</CardTitle>
              <CardDescription>
                SMS a emailové připomínky snižují počet zmeškaných termínů o více než 50%.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <CreditCard className="h-10 w-10 text-primary" />
              <CardTitle className="mt-4">Online platby</CardTitle>
              <CardDescription>
                Přijímejte platby kartou, převodem nebo zálohy při rezervaci.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Users className="h-10 w-10 text-primary" />
              <CardTitle className="mt-4">Správa zaměstnanců</CardTitle>
              <CardDescription>
                Přidělujte služby jednotlivým zaměstnancům s jejich vlastními rozvrhy.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <MessageSquare className="h-10 w-10 text-primary" />
              <CardTitle className="mt-4">Komunikace</CardTitle>
              <CardDescription>
                Posílejte hromadné zprávy zákazníkům o akcích a novinkách.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Shield className="h-10 w-10 text-primary" />
              <CardTitle className="mt-4">Bezpečnost dat</CardTitle>
              <CardDescription>
                Vaše data jsou bezpečně uložena na serverech v České republice.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="border-t bg-muted/50">
        <div className="container py-24 text-center">
          <h2 className="text-3xl font-bold tracking-tight">
            Připraveni začít?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
            Vyzkoušejte Salonio zdarma na 14 dní. Žádná kreditní karta není potřeba.
          </p>
          <Link href="/register">
            <Button size="lg" className="mt-8">
              Vytvořit účet zdarma
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12">
        <div className="container">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded bg-primary">
                <Calendar className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="font-semibold">Salonio</span>
            </div>
            
            <p className="text-sm text-muted-foreground">
              Vytvořeno s láskou v České republice
            </p>

            <div className="flex gap-4 text-sm text-muted-foreground">
              <Link href="/privacy" className="hover:text-foreground">Ochrana soukromí</Link>
              <Link href="/terms" className="hover:text-foreground">Podmínky</Link>
              <Link href="mailto:info@webnamiru.site" className="hover:text-foreground">Kontakt</Link>
            </div>
          </div>
          
          <div className="mt-8 text-center text-sm text-muted-foreground">
            <p>Web Na Míru | IČO: 23874694 | Rantířovská 123/36, 586 01 Jihlava</p>
            <p className="mt-1">+420 777 596 216 | info@webnamiru.site</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
