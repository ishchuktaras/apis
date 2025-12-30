'use client'

import { useState, useEffect, use } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { MapPin, Phone, Check, ChevronRight, Star, User, Mail, Smartphone, ArrowLeft, Scissors, ExternalLink, Clock } from 'lucide-react'
import { toast } from "sonner"

// --- TYPY ---
interface Service {
  id: string
  title: string
  price: number
  duration_minutes: number
  description?: string
}

interface Profile {
  id: string
  salon_name: string
  description: string
  address: string
  phone: string
  logo_url: string | null
}

interface BusinessHour {
  day_of_week: number
  open_time: string
  close_time: string
  is_closed: boolean
}

// Přidán interface pro rezervaci
interface BookingSlot {
  start_time: string
}

interface PageProps {
  params: Promise<{ slug: string }>
}

export default function SalonPublicPage({ params }: PageProps) {
  const { slug } = use(params)

  // Data salonu
  const [profile, setProfile] = useState<Profile | null>(null)
  const [services, setServices] = useState<Service[]>([])
  const [businessHours, setBusinessHours] = useState<BusinessHour[]>([])
  
  // Stavy aplikace
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [bookingStep, setBookingStep] = useState<1 | 2 | 3 | 4>(1)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Rezervační data
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null)
  const [selectedDate, setSelectedDate] = useState<string>('')
  const [selectedTime, setSelectedTime] = useState<string | null>(null)
  const [bookedTimes, setBookedTimes] = useState<string[]>([])
  const [loadingSlots, setLoadingSlots] = useState(false)

  // Kontaktní údaje
  const [clientInfo, setClientInfo] = useState({
    name: '',
    email: '',
    phone: ''
  })
  const [termsAccepted, setTermsAccepted] = useState(false)

  // 1. Načtení SALONU
  useEffect(() => {
    if (slug) fetchSalonData()
  }, [slug])

  // 2. Načtení OBSAZENÝCH TERMÍNŮ
  useEffect(() => {
    if (selectedDate && profile) {
      fetchBookedSlots()
    }
  }, [selectedDate, profile])

  const fetchSalonData = async () => {
    try {
      setLoading(true)
      
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('slug', slug)
        .maybeSingle()

      if (profileError || !profileData) {
        setError('Salon nebyl nalezen')
        return
      }
      setProfile(profileData)

      const { data: servicesData } = await supabase
        .from('services')
        .select('*')
        .eq('user_id', profileData.id)
        .order('price', { ascending: true })
      setServices(servicesData || [])

      const { data: hoursData } = await supabase
        .from('business_hours')
        .select('*')
        .eq('user_id', profileData.id)
      
      setBusinessHours(hoursData || [])

    } catch (err) {
      console.error(err)
      setError('Chyba při načítání dat')
    } finally {
      setLoading(false)
    }
  }

  const fetchBookedSlots = async () => {
    try {
      setLoadingSlots(true)
      const { data } = await supabase
        .from('bookings')
        .select('start_time')
        .eq('salon_id', profile!.id)
        .eq('booking_date', selectedDate)
        .neq('status', 'cancelled')

      if (data) {
        // Použití správného typu místo any
        const times = (data as BookingSlot[]).map(b => b.start_time.slice(0, 5))
        setBookedTimes(times)
      }
    } catch (error) {
      console.error('Chyba slotů:', error)
    } finally {
      setLoadingSlots(false)
    }
  }

  // Generování časů
  const getAvailableTimes = (dateString: string) => {
    if (!dateString) return []
    
    const [year, month, day] = dateString.split('-').map(Number)
    const date = new Date(year, month - 1, day)
    const dayIndex = date.getDay()

    const rule = businessHours.find(h => h.day_of_week === dayIndex)

    if (!rule || rule.is_closed) return []

    // Logika pro "Dnes"
    const now = new Date()
    const todayString = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
    const isToday = dateString === todayString
    const currentMinutesTotal = now.getHours() * 60 + now.getMinutes()

    const slots = []
    let [currentHour, currentMinute] = rule.open_time.slice(0,5).split(':').map(Number)
    const [endHour, endMinute] = rule.close_time.slice(0,5).split(':').map(Number)
    
    let slotTimeInMinutes = currentHour * 60 + currentMinute
    const endTimeInMinutes = endHour * 60 + endMinute
    
    // Interval pro klienty - ZMĚNA NA 15 MIN PRO VĚTŠÍ FLEXIBILITU
    const interval = 15 

    while (slotTimeInMinutes < endTimeInMinutes) {
      if (isToday && slotTimeInMinutes < currentMinutesTotal + 30) { // 30 min rezerva pro dnešek
         slotTimeInMinutes += interval
         continue
      }

      const h = Math.floor(slotTimeInMinutes / 60).toString().padStart(2, '0')
      const m = (slotTimeInMinutes % 60).toString().padStart(2, '0')
      const timeString = `${h}:${m}`

      if (!bookedTimes.includes(timeString)) {
        slots.push(timeString)
      }

      slotTimeInMinutes += interval
    }
    return slots
  }

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!profile || !selectedServiceId || !selectedDate || !selectedTime) return
    if (!termsAccepted) {
        toast.error("Musíte souhlasit s podmínkami.")
        return
    }

    setIsSubmitting(true)
    try {
      const { data: bookingData, error } = await supabase.from('bookings').insert({
        salon_id: profile.id,
        service_id: selectedServiceId,
        customer_name: clientInfo.name,
        customer_email: clientInfo.email,
        customer_phone: clientInfo.phone,
        booking_date: selectedDate,
        start_time: selectedTime,
        status: 'pending'
      })
      .select()
      .single()

      if (error) throw error

      // Odeslání emailu (Zde by v produkci mělo být volání API endpointu, který řeší i validaci)
      // Pro MVP používáme existující route
      const cancelLink = `${window.location.origin}/booking/${bookingData.id}/cancel`

      await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: 'ishchuktaras@gmail.com', // V produkci: clientInfo.email (a kopie majiteli)
          subject: `Rezervace potvrzena: ${profile.salon_name}`,
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #1a1a1a;">
              <h1 style="color: #1a1a1a;">Potvrzení rezervace 🎉</h1>
              <p>Dobrý den, <strong>${clientInfo.name}</strong>,</p>
              <p>Vaše rezervace v salonu <strong>${profile.salon_name}</strong> byla úspěšně vytvořena.</p>
              <div style="background: #F8F5E6; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #e2e8f0;">
                <p style="margin: 5px 0;"><strong>Datum:</strong> ${selectedDate}</p>
                <p style="margin: 5px 0;"><strong>Čas:</strong> ${selectedTime}</p>
                <p style="margin: 5px 0;"><strong>Služba:</strong> ${selectedService?.title} (${selectedService?.price} Kč)</p>
              </div>
              <p>Pokud se nemůžete dostavit, klikněte na tlačítko níže:</p>
              <a href="${cancelLink}" style="display: inline-block; background: #ef4444; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Zrušit rezervaci</a>
            </div>
          `
        })
      })

      setBookingStep(4)
      toast.success("Rezervace byla úspěšná!")
      
    } catch (err: any) {
      toast.error('Chyba rezervace: ' + err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const selectedService = services.find(s => s.id === selectedServiceId)
  const availableSlots = getAvailableTimes(selectedDate)

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-background text-muted-foreground animate-pulse">Načítám salon...</div>
  if (error) return <div className="min-h-screen flex items-center justify-center bg-background text-destructive font-medium">{error}</div>
  if (!profile) return null

  // --- KROK 4: DĚKOVAČKA ---
  if (bookingStep === 4) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center p-8 border-none shadow-lg animate-in zoom-in-95 duration-300">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6 text-green-600">
            <Check className="h-8 w-8" />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-2">Rezervace odeslána!</h2>
          <p className="text-muted-foreground mb-8">
            Děkujeme, <strong>{clientInfo.name}</strong>. Potvrzení vám dorazí na e-mail.
          </p>
          <div className="bg-muted/30 p-6 rounded-lg text-left mb-8 text-sm text-foreground space-y-3 border">
            <p><strong>Datum:</strong> {selectedDate}</p>
            <p><strong>Čas:</strong> {selectedTime}</p>
            <p><strong>Služba:</strong> {selectedService?.title}</p>
            <p><strong>Salon:</strong> {profile.salon_name}</p>
          </div>
          <Button onClick={() => window.location.reload()} variant="outline" className="w-full h-12">
            Zpět na stránku salonu
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background pb-28 md:pb-20 font-sans selection:bg-primary/20">
      
      {/* HEADER */}
      <header className="bg-card border-b sticky top-0 z-10 shadow-sm/50 backdrop-blur-sm bg-white/90 supports-[backdrop-filter]:bg-white/50">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            
            <div className="flex items-center gap-4">
              {profile.logo_url ? (
                <img 
                  src={profile.logo_url} 
                  alt={profile.salon_name} 
                  className="w-12 h-12 md:w-16 md:h-16 rounded-full object-cover border border-border shadow-sm"
                />
              ) : (
                <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-secondary flex items-center justify-center text-secondary-foreground">
                  <Scissors className="h-6 w-6" />
                </div>
              )}
              
              <div>
                <h1 className="text-xl md:text-2xl font-bold text-foreground leading-tight">
                  {profile.salon_name || 'Krásný Salon'}
                </h1>
                <div className="flex flex-col sm:flex-row sm:items-center text-sm text-muted-foreground mt-1 gap-1 sm:gap-4">
                  {profile.address && (
                    <a href={`https://maps.google.com/?q=${profile.address}`} target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:text-primary transition-colors">
                        <MapPin className="h-3 w-3" /> {profile.address}
                    </a>
                  )}
                  {profile.phone && (
                    <a href={`tel:${profile.phone}`} className="flex items-center gap-1 hover:text-primary transition-colors">
                        <Phone className="h-3 w-3" /> {profile.phone}
                    </a>
                  )}
                </div>
              </div>
            </div>

            <div className="hidden sm:flex flex-col items-end">
               <div className="bg-secondary/10 text-secondary-foreground px-3 py-1 rounded-full text-sm font-bold flex items-center gap-1">
                 <Star className="h-3 w-3 fill-secondary-foreground" /> 4.9
               </div>
               <span className="text-xs text-muted-foreground mt-1">Ověřený Salon</span>
            </div>

          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        
        {/* KROK 1: SLUŽBY */}
        {bookingStep === 1 && (
          <section className="space-y-6 animate-in slide-in-from-bottom-4 duration-300 fade-in">
            <h2 className="text-lg font-semibold flex items-center gap-3 text-foreground">
              <span className="bg-primary text-primary-foreground w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold">1</span> Vyberte službu
            </h2>
            <div className="grid gap-3">
              {services.length === 0 ? (
                  <p className="text-muted-foreground text-center py-10">Tento salon zatím nemá nastavené žádné služby.</p>
              ) : (
                  services.map(service => (
                    <Card key={service.id} 
                      className={`cursor-pointer border-2 transition-all duration-200 ${selectedServiceId === service.id ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-transparent hover:border-border hover:bg-white shadow-sm'}`}
                      onClick={() => setSelectedServiceId(service.id)}
                    >
                      <CardContent className="p-5 flex justify-between items-center">
                        <div>
                          <h3 className="font-medium text-foreground text-lg">{service.title}</h3>
                          <p className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
                             <Clock className="h-3 w-3" /> {service.duration_minutes} min 
                             <span className="text-border">|</span>
                             <span className="font-semibold text-foreground">{service.price} Kč</span>
                          </p>
                        </div>
                        {selectedServiceId === service.id ? 
                            <div className="bg-primary text-primary-foreground rounded-full p-1"><Check className="h-5 w-5" /></div> 
                            : <div className="w-7 h-7 rounded-full border-2 border-muted" />
                        }
                      </CardContent>
                    </Card>
                  ))
              )}
            </div>
          </section>
        )}

        {/* KROK 2: TERMÍN */}
        {bookingStep === 2 && (
          <section className="space-y-6 animate-in slide-in-from-right-8 duration-300 fade-in">
            <Button variant="ghost" onClick={() => setBookingStep(1)} className="pl-0 text-muted-foreground hover:text-foreground mb-2 group">
              <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform"/> Zpět na služby
            </Button>
            <h2 className="text-lg font-semibold flex items-center gap-3 text-foreground">
              <span className="bg-primary text-primary-foreground w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold">2</span> Vyberte termín
            </h2>
            
            <div className="bg-card p-6 rounded-xl border shadow-sm space-y-6">
              <div>
                <Label className="text-foreground font-medium">Datum návštěvy</Label>
                <Input 
                  type="date" 
                  className="mt-2 h-12 text-lg bg-background cursor-pointer" 
                  min={new Date().toISOString().split('T')[0]} 
                  value={selectedDate} 
                  onChange={e => { setSelectedDate(e.target.value); setSelectedTime(null); }} 
                />
              </div>

              <div>
                <Label className="text-foreground font-medium">Dostupné časy</Label>
                {!selectedDate ? <p className="text-sm text-muted-foreground mt-3 italic p-4 bg-muted/30 rounded-md text-center">Nejdříve vyberte datum nahoře.</p> :
                 loadingSlots ? <div className="p-8 text-center"><div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full mx-auto"></div></div> :
                 availableSlots.length === 0 ? <p className="text-sm text-destructive mt-3 font-medium p-4 bg-destructive/10 rounded-md text-center">Pro tento den je bohužel plno nebo zavřeno.</p> :
                 <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 mt-4 max-h-80 overflow-y-auto custom-scrollbar pr-2">
                   {availableSlots.map(time => (
                     <button 
                       key={time} 
                       onClick={() => setSelectedTime(time)}
                       className={`py-3 text-sm rounded-md border transition-all duration-200 ${
                         selectedTime === time 
                           ? 'bg-primary text-primary-foreground border-primary font-bold shadow-md scale-105' 
                           : 'bg-background text-foreground border-border hover:border-primary/50 hover:bg-primary/5'
                       }`}
                     >
                       {time}
                     </button>
                   ))}
                 </div>
                }
              </div>
            </div>
          </section>
        )}

        {/* KROK 3: KONTAKT */}
        {bookingStep === 3 && (
          <section className="space-y-6 animate-in slide-in-from-right-8 duration-300 fade-in">
            <Button variant="ghost" onClick={() => setBookingStep(2)} className="pl-0 text-muted-foreground hover:text-foreground mb-2 group">
              <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform"/> Zpět na termín
            </Button>
            <h2 className="text-lg font-semibold flex items-center gap-3 text-foreground">
              <span className="bg-primary text-primary-foreground w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold">3</span> Vaše údaje
            </h2>

            <Card className="border-none shadow-sm bg-card">
              <CardContent className="p-6">
                <form id="booking-form" onSubmit={handleBooking} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="name">Jméno a Příjmení</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
                      <Input id="name" className="pl-10 h-11 bg-background" required placeholder="Jan Novák" 
                        value={clientInfo.name} onChange={e => setClientInfo({...clientInfo, name: e.target.value})}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
                        <Input id="email" type="email" className="pl-10 h-11 bg-background" required placeholder="jan@email.cz" 
                          value={clientInfo.email} onChange={e => setClientInfo({...clientInfo, email: e.target.value})}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Telefon</Label>
                      <div className="relative">
                        <Smartphone className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
                        <Input id="phone" type="tel" className="pl-10 h-11 bg-background" required placeholder="+420 777 123 456" 
                          value={clientInfo.phone} onChange={e => setClientInfo({...clientInfo, phone: e.target.value})}
                        />
                      </div>
                    </div>
                  </div>
                  
                  {/* GDPR Souhlas - PŘIDÁNO */}
                  <div className="flex items-start space-x-3 pt-4 border-t mt-4">
                    <Checkbox id="terms" checked={termsAccepted} onCheckedChange={(checked) => setTermsAccepted(checked as boolean)} />
                    <div className="grid gap-1.5 leading-none">
                      <Label htmlFor="terms" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        Souhlasím s obchodními podmínkami a zpracováním osobních údajů
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        Vaše údaje budou použity pouze pro účely rezervace v salonu {profile.salon_name}.
                      </p>
                    </div>
                  </div>

                </form>
              </CardContent>
            </Card>
          </section>
        )}

      </main>

      {/* STICKY FOOTER (Košík) */}
      {selectedService && bookingStep < 4 && (
        <div className="fixed bottom-0 left-0 right-0 bg-card/80 backdrop-blur-md border-t p-4 shadow-[0_-5px_20px_rgba(0,0,0,0.05)] z-50 animate-in slide-in-from-bottom-full duration-500">
          <div className="max-w-3xl mx-auto flex items-center justify-between">
            <div className="hidden sm:block">
              <p className="text-xs text-muted-foreground uppercase font-bold tracking-wide">Rezervace</p>
              <div className="flex items-center gap-2">
                 <p className="font-bold text-foreground text-lg">{selectedService.title}</p>
                 <span className="bg-muted px-2 py-0.5 rounded text-xs font-medium">{selectedService.price} Kč</span>
              </div>
            </div>
            
            <div className="flex gap-3 w-full sm:w-auto">
              {bookingStep === 1 && (
                <Button onClick={() => setBookingStep(2)} className="w-full sm:w-auto h-12 text-base px-8 bg-primary hover:bg-primary/90 text-primary-foreground shadow-md transition-all hover:scale-105">
                  Vybrat termín <ChevronRight className="ml-2 h-4 w-4"/>
                </Button>
              )}
              {bookingStep === 2 && (
                <Button disabled={!selectedDate || !selectedTime} onClick={() => setBookingStep(3)} className="w-full sm:w-auto h-12 text-base px-8 bg-primary hover:bg-primary/90 text-primary-foreground shadow-md transition-all hover:scale-105 disabled:opacity-50 disabled:hover:scale-100">
                  Zadat údaje <ChevronRight className="ml-2 h-4 w-4"/>
                </Button>
              )}
              {bookingStep === 3 && (
                <Button form="booking-form" type="submit" disabled={isSubmitting || !termsAccepted} className="w-full sm:w-auto h-12 text-base px-8 bg-green-600 hover:bg-green-700 text-white shadow-md transition-all hover:scale-105 disabled:opacity-50 disabled:hover:scale-100">
                  {isSubmitting ? 'Odesílám...' : 'Dokončit rezervaci'}
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  )
}