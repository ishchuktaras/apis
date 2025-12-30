import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { ArrowLeft, Mail, Smartphone, User } from "lucide-react"
import Link from 'next/link'
import { ClientInfo } from "@/types/salon"

interface ContactFormProps {
  clientInfo: ClientInfo
  onClientInfoChange: (info: ClientInfo) => void
  termsAccepted: boolean
  onTermsChange: (accepted: boolean) => void
  onSubmit: (e: React.FormEvent) => void
  onBack: () => void
  salonName: string
}

export function ContactForm({ 
  clientInfo, 
  onClientInfoChange, 
  termsAccepted, 
  onTermsChange, 
  onSubmit, 
  onBack,
  salonName 
}: ContactFormProps) {
  
  const handleChange = (field: keyof ClientInfo, value: string) => {
    onClientInfoChange({ ...clientInfo, [field]: value })
  }

  return (
    <section className="space-y-6 animate-in slide-in-from-right-8 duration-300 fade-in">
       <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={onBack} className="pl-0 text-slate-500 hover:text-slate-900 mb-2 group h-auto py-0 hover:bg-transparent">
          <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform"/> Zpět na termín
          </Button>
          <span className="text-xs font-medium text-slate-400 uppercase tracking-widest">Krok 3/3</span>
      </div>

      <h2 className="text-lg font-bold flex items-center gap-3 text-slate-800">
        <span className="bg-slate-900 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shadow-md">3</span> Vaše údaje
      </h2>

      <Card className="border border-slate-200 shadow-sm bg-white">
        <CardContent className="p-6">
          <form id="booking-form" onSubmit={onSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-slate-700">Jméno a Příjmení</Label>
              <div className="relative">
                <User className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                <Input id="name" className="pl-10 h-11 bg-slate-50 border-slate-200 focus:ring-primary focus:border-primary" required placeholder="Jan Novák" 
                  value={clientInfo.name} onChange={e => handleChange('name', e.target.value)}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-700">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                  <Input id="email" type="email" className="pl-10 h-11 bg-slate-50 border-slate-200 focus:ring-primary focus:border-primary" required placeholder="jan@email.cz" 
                    value={clientInfo.email} onChange={e => handleChange('email', e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-slate-700">Telefon</Label>
                <div className="relative">
                  <Smartphone className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                  <Input id="phone" type="tel" className="pl-10 h-11 bg-slate-50 border-slate-200 focus:ring-primary focus:border-primary" required placeholder="+420 777 123 456" 
                    value={clientInfo.phone} onChange={e => handleChange('phone', e.target.value)}
                  />
                </div>
              </div>
            </div>
            
            {/* GDPR Souhlas */}
            <div className="flex items-start space-x-3 pt-4 border-t border-slate-100 mt-4 bg-slate-50/50 p-4 rounded-lg">
              <Checkbox id="terms" checked={termsAccepted} onCheckedChange={(checked) => onTermsChange(checked as boolean)} className="mt-1" />
              <div className="grid gap-1.5 leading-none">
                <Label htmlFor="terms" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-slate-700">
                  Souhlasím s <Link href="/obchodni-podminky" className="text-primary underline hover:text-primary/80" target="_blank">obchodními podmínkami</Link> a zpracováním osobních údajů
                </Label>
                <p className="text-xs text-slate-500">
                  Vaše údaje budou použity pouze pro účely rezervace v salonu {salonName}.
                </p>
              </div>
            </div>

          </form>
        </CardContent>
      </Card>
    </section>
  )
}