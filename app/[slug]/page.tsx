// app/[slug]/page.tsx

'use client'

import { useState, useEffect, use } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { MapPin, Phone, Check, ChevronRight, Star, User, Mail, Smartphone, ArrowLeft, Scissors, Clock, Calendar, Info } from 'lucide-react'
import { toast } from "sonner"
import Link from 'next/link'
import { generateEmailHtml } from '@/lib/email-templates' // Import šablony

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

    const now = new Date()
    const todayString = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
    const isToday = dateString === todayString
    const currentMinutesTotal = now.getHours() * 60 + now.getMinutes()

    const slots = []
    let [currentHour, currentMinute] = rule.open_time.slice(0,5).split(':').map(Number)
    const [endHour, endMinute] = rule.close_time.slice(0,5).split(':').map(Number)
    
    let slotTimeInMinutes = currentHour * 60 + currentMinute
    const endTimeInMinutes = endHour * 60 + endMinute
    
    const interval = 15 

    while (slotTimeInMinutes < endTimeInMinutes) {
      if (isToday && slotTimeInMinutes < currentMinutesTotal + 30) { 
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

      const cancelLink = `${window.location.origin}/booking/${bookingData.id}/cancel`
      
      // GENERACE EMAILU Z EXTERNÍ FUNKCE
      const emailHtml = generateEmailHtml(
        clientInfo.name,
        profile.salon_name,
        selectedDate,
        selectedTime,
        selectedService?.title || 'Služba',
        selectedService?.price || 0,
        cancelLink,
        profile.address || 'Adresa neuvedena'
      )

      // Odeslání emailu
      await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: 'ishchuktaras@gmail.com', // PRO DEMO - v produkci: clientInfo.email
          subject: `Rezervace potvrzena: ${profile.salon_name}`,
          html: emailHtml
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

  // LOADING STATE (Skeleton)
  if (loading) return (
    <div className="min-h-screen bg-background pb-20 font-sans">
      <header className="bg-card border-b p-4"><div className="h-16 w-16 bg-muted rounded-full animate-pulse mx-auto mb-2"></div><div className="h-6 w-48 bg-muted rounded animate-pulse mx-auto"></div></header>
      <main className="max-w-3xl mx-auto px-4 py-8 space-y-4">
        {[1,2,3].map(i => <div key={i} className="h-24 bg-card rounded-xl border shadow-sm animate-pulse"></div>)}
      </main>
    </div>
  )

  if (error) return <div className="min-h-screen flex flex-col items-center justify-center bg-background text-destructive font-medium p-4 text-center"><Info className="h-10 w-10 mb-4"/>{error}<Link href="/" className="mt-4 text-primary underline">Zpět na hlavní stránku</Link></div>
  if (!profile) return null

  // --- KROK 4: DĚKOVAČKA ---
  if (bookingStep === 4) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center p-8 border-none shadow-xl animate-in zoom-in-95 duration-300 bg-white">
          <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6 text-green-600 shadow-sm">
            <Check className="h-10 w-10" />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-2">Rezervace odeslána!</h2>
          <p className="text-muted-foreground mb-8">
            Děkujeme, <strong>{clientInfo.name}</strong>. Potvrzení vám dorazí na e-mail.
          </p>
          <div className="bg-slate-50 p-6 rounded-lg text-left mb-8 text-sm text-foreground space-y-3 border border-slate-100">
            <div className="flex justify-between border-b border-slate-200 pb-2">
                <span className="text-muted-foreground">Datum</span>
                <span className="font-medium">{selectedDate}</span>
            </div>
            <div className="flex justify-between border-b border-slate-200 pb-2">
                <span className="text-muted-foreground">Čas</span>
                <span className="font-medium">{selectedTime}</span>
            </div>
            <div className="flex justify-between border-b border-slate-200 pb-2">
                <span className="text-muted-foreground">Služba</span>
                <span className="font-medium">{selectedService?.title}</span>
            </div>
            <div className="flex justify-between pt-1">
                <span className="text-muted-foreground">Salon</span>
                <span className="font-medium">{profile.salon_name}</span>
            </div>
          </div>
          <Button onClick={() => window.location.reload()} variant="outline" className="w-full h-12 border-slate-300 hover:bg-slate-50 text-slate-700">
            Nová rezervace
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50/50 pb-32 md:pb-24 font-sans selection:bg-primary/20">
      
      {/* HEADER */}
      <header className="bg-white border-b sticky top-0 z-10 shadow-sm/50 backdrop-blur-sm bg-white/90 supports-[backdrop-filter]:bg-white/50">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            
            <div className="flex items-center gap-4">
              {profile.logo_url ? (
                <img 
                  src={profile.logo_url} 
                  alt={profile.salon_name} 
                  className="w-12 h-12 md:w-16 md:h-16 rounded-full object-cover border border-slate-200 shadow-sm bg-white"
                />
              ) : (
                <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 border border-slate-200">
                  <Scissors className="h-6 w-6" />
                </div>
              )}
              
              <div>
                <h1 className="text-xl md:text-2xl font-bold text-slate-900 leading-tight">
                  {profile.salon_name || 'Krásný Salon'}
                </h1>
                <div className="flex flex-col sm:flex-row sm:items-center text-sm text-slate-500 mt-1 gap-1 sm:gap-4">
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
               <div className="bg-yellow-50 text-yellow-700 border border-yellow-200 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                 <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" /> 4.9
               </div>
               <span className="text-[10px] text-slate-400 mt-1 uppercase tracking-wider font-semibold">Ověřeno</span>
            </div>

          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        
        {/* KROK 1: SLUŽBY */}
        {bookingStep === 1 && (
          <section className="space-y-6 animate-in slide-in-from-bottom-4 duration-500 fade-in">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold flex items-center gap-3 text-slate-800">
                <span className="bg-slate-900 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shadow-md">1</span> Vyberte službu
                </h2>
                <span className="text-xs font-medium text-slate-400 uppercase tracking-widest">Krok 1/3</span>
            </div>
            
            <div className="grid gap-3">
              {services.length === 0 ? (
                  <div className="text-center py-16 bg-white rounded-xl border border-dashed border-slate-300">
                      <Scissors className="h-10 w-10 text-slate-300 mx-auto mb-2" />
                      <p className="text-slate-500">Tento salon zatím nemá nastavené žádné služby.</p>
                  </div>
              ) : (
                  services.map(service => (
                    <Card key={service.id} 
                      className={`cursor-pointer border transition-all duration-200 group ${selectedServiceId === service.id ? 'border-primary bg-primary/5 ring-1 ring-primary shadow-md' : 'border-slate-200 bg-white hover:border-primary/50 hover:shadow-sm'}`}
                      onClick={() => setSelectedServiceId(service.id)}
                    >
                      <CardContent className="p-5 flex justify-between items-center">
                        <div>
                          <h3 className={`font-semibold text-lg ${selectedServiceId === service.id ? 'text-primary' : 'text-slate-900'}`}>{service.title}</h3>
                          <div className="flex items-center gap-3 mt-1.5">
                             <div className="flex items-center text-sm text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                                <Clock className="h-3 w-3 mr-1" /> {service.duration_minutes} min 
                             </div>
                             <span className="font-bold text-slate-900">{service.price} Kč</span>
                          </div>
                          {service.description && <p className="text-sm text-slate-500 mt-2 line-clamp-2">{service.description}</p>}
                        </div>
                        <div className={`h-6 w-6 rounded-full border-2 flex items-center justify-center transition-colors ${selectedServiceId === service.id ? 'border-primary bg-primary text-white' : 'border-slate-300 bg-transparent'}`}>
                            {selectedServiceId === service.id && <Check className="h-3 w-3" />}
                        </div>
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
            <div className="flex items-center justify-between">
                <Button variant="ghost" onClick={() => setBookingStep(1)} className="pl-0 text-slate-500 hover:text-slate-900 mb-2 group h-auto py-0 hover:bg-transparent">
                <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform"/> Zpět na služby
                </Button>
                <span className="text-xs font-medium text-slate-400 uppercase tracking-widest">Krok 2/3</span>
            </div>

            <h2 className="text-lg font-bold flex items-center gap-3 text-slate-800">
              <span className="bg-slate-900 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shadow-md">2</span> Vyberte termín
            </h2>
            
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-8">
              <div>
                <Label className="text-slate-700 font-medium mb-2 block flex items-center gap-2"><Calendar className="h-4 w-4"/> Datum návštěvy</Label>
                <Input 
                  type="date" 
                  className="mt-2 h-12 text-lg bg-slate-50 border-slate-200 focus:border-primary focus:ring-primary cursor-pointer w-full" 
                  min={new Date().toISOString().split('T')[0]} 
                  value={selectedDate} 
                  onChange={e => { setSelectedDate(e.target.value); setSelectedTime(null); }} 
                />
              </div>

              <div>
                <Label className="text-slate-700 font-medium mb-2 block flex items-center gap-2"><Clock className="h-4 w-4"/> Dostupné časy</Label>
                <div className="min-h-[100px]">
                    {!selectedDate ? 
                        <div className="text-sm text-slate-500 italic p-6 bg-slate-50 rounded-lg text-center border border-dashed border-slate-200">
                            Nejdříve vyberte datum v kalendáři výše.
                        </div> :
                    loadingSlots ? 
                        <div className="p-8 text-center"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto opacity-50"></div><p className="text-xs text-slate-400 mt-2">Ověřuji dostupnost...</p></div> :
                    availableSlots.length === 0 ? 
                        <div className="text-sm text-red-600 font-medium p-6 bg-red-50 rounded-lg text-center border border-red-100 flex flex-col items-center gap-2">
                            <Info className="h-5 w-5"/>
                            Pro tento den je bohužel plno nebo zavřeno.
                        </div> :
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 mt-4 max-h-80 overflow-y-auto custom-scrollbar pr-2">
                    {availableSlots.map(time => (
                        <button 
                        key={time} 
                        onClick={() => setSelectedTime(time)}
                        className={`py-3 px-2 text-sm rounded-lg border transition-all duration-200 font-medium ${
                            selectedTime === time 
                            ? 'bg-slate-900 text-white border-slate-900 shadow-lg scale-105 transform' 
                            : 'bg-white text-slate-700 border-slate-200 hover:border-primary hover:text-primary hover:bg-primary/5'
                        }`}
                        >
                        {time}
                        </button>
                    ))}
                    </div>
                    }
                </div>
              </div>
            </div>
          </section>
        )}

        {/* KROK 3: KONTAKT */}
        {bookingStep === 3 && (
          <section className="space-y-6 animate-in slide-in-from-right-8 duration-300 fade-in">
             <div className="flex items-center justify-between">
                <Button variant="ghost" onClick={() => setBookingStep(2)} className="pl-0 text-slate-500 hover:text-slate-900 mb-2 group h-auto py-0 hover:bg-transparent">
                <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform"/> Zpět na termín
                </Button>
                <span className="text-xs font-medium text-slate-400 uppercase tracking-widest">Krok 3/3</span>
            </div>

            <h2 className="text-lg font-bold flex items-center gap-3 text-slate-800">
              <span className="bg-slate-900 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shadow-md">3</span> Vaše údaje
            </h2>

            <Card className="border border-slate-200 shadow-sm bg-white">
              <CardContent className="p-6">
                <form id="booking-form" onSubmit={handleBooking} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-slate-700">Jméno a Příjmení</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                      <Input id="name" className="pl-10 h-11 bg-slate-50 border-slate-200 focus:ring-primary focus:border-primary" required placeholder="Jan Novák" 
                        value={clientInfo.name} onChange={e => setClientInfo({...clientInfo, name: e.target.value})}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-slate-700">Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                        <Input id="email" type="email" className="pl-10 h-11 bg-slate-50 border-slate-200 focus:ring-primary focus:border-primary" required placeholder="jan@email.cz" 
                          value={clientInfo.email} onChange={e => setClientInfo({...clientInfo, email: e.target.value})}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone" className="text-slate-700">Telefon</Label>
                      <div className="relative">
                        <Smartphone className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                        <Input id="phone" type="tel" className="pl-10 h-11 bg-slate-50 border-slate-200 focus:ring-primary focus:border-primary" required placeholder="+420 777 123 456" 
                          value={clientInfo.phone} onChange={e => setClientInfo({...clientInfo, phone: e.target.value})}
                        />
                      </div>
                    </div>
                  </div>
                  
                  {/* GDPR Souhlas */}
                  <div className="flex items-start space-x-3 pt-4 border-t border-slate-100 mt-4 bg-slate-50/50 p-4 rounded-lg">
                    <Checkbox id="terms" checked={termsAccepted} onCheckedChange={(checked) => setTermsAccepted(checked as boolean)} className="mt-1" />
                    <div className="grid gap-1.5 leading-none">
                      <Label htmlFor="terms" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-slate-700">
                        Souhlasím s <Link href="/obchodni-podminky" className="text-primary underline hover:text-primary/80" target="_blank">obchodními podmínkami</Link> a zpracováním osobních údajů
                      </Label>
                      <p className="text-xs text-slate-500">
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
        <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-slate-200 p-4 shadow-[0_-5px_20px_rgba(0,0,0,0.05)] z-50 animate-in slide-in-from-bottom-full duration-500">
          <div className="max-w-3xl mx-auto flex items-center justify-between">
            <div className="hidden sm:block">
              <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mb-1">Vaše Rezervace</p>
              <div className="flex items-center gap-3">
                 <p className="font-bold text-slate-900 text-lg truncate max-w-[200px]">{selectedService.title}</p>
                 <span className="bg-slate-100 px-2 py-1 rounded text-xs font-semibold text-slate-700 border border-slate-200">{selectedService.price} Kč</span>
              </div>
            </div>
            
            <div className="flex gap-3 w-full sm:w-auto">
              {bookingStep === 1 && (
                <Button onClick={() => setBookingStep(2)} className="w-full sm:w-auto h-12 text-base px-8 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] rounded-xl font-bold">
                  Vybrat termín <ChevronRight className="ml-2 h-5 w-5"/>
                </Button>
              )}
              {bookingStep === 2 && (
                <Button disabled={!selectedDate || !selectedTime} onClick={() => setBookingStep(3)} className="w-full sm:w-auto h-12 text-base px-8 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100 rounded-xl font-bold">
                  Zadat údaje <ChevronRight className="ml-2 h-5 w-5"/>
                </Button>
              )}
              {bookingStep === 3 && (
                <Button form="booking-form" type="submit" disabled={isSubmitting || !termsAccepted} className="w-full sm:w-auto h-12 text-base px-8 bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-600/20 transition-all hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100 rounded-xl font-bold">
                  {isSubmitting ? 'Odesílám...' : 'Dokončit rezervaci'} <Check className="ml-2 h-5 w-5"/>
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  )
}