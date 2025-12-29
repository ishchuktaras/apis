'use client'

import { useState, useEffect, use } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { MapPin, Phone, Clock, Check, ChevronRight, Star, CalendarX, User, Mail, Smartphone, ArrowLeft, Scissors } from 'lucide-react'

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

  // DEBUG: Kontrola načtených dat
  useEffect(() => {
    if (businessHours.length > 0) {
      console.log('✅ Otevírací doba načtena:', businessHours)
    } else if (!loading && profile) {
      console.warn('⚠️ Otevírací doba je PRÁZDNÁ! Zkontrolujte nastavení.')
    }
  }, [businessHours, loading, profile])

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
        const times = data.map(b => b.start_time.slice(0, 5))
        setBookedTimes(times)
      }
    } catch (error) {
      console.error('Chyba slotů:', error)
    } finally {
      setLoadingSlots(false)
    }
  }

  // Generování časů (S FILTREM MINULOSTI PRO DNEŠEK)
  const getAvailableTimes = (dateString: string) => {
    if (!dateString) return []
    
    // 1. Bezpečný převod data
    const [year, month, day] = dateString.split('-').map(Number)
    const date = new Date(year, month - 1, day)
    const dayIndex = date.getDay()

    // 2. Hledání pravidla
    const rule = businessHours.find(h => h.day_of_week === dayIndex)

    if (!rule || rule.is_closed) return []

    // 3. Logika pro "Dnes"
    const now = new Date()
    // Vytvoříme string YYYY-MM-DD pro dnešek v lokálním čase
    const todayString = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
    const isToday = dateString === todayString
    
    // Aktuální čas v minutách od půlnoci
    const currentMinutesTotal = now.getHours() * 60 + now.getMinutes()

    const slots = []
    let [currentHour, currentMinute] = rule.open_time.slice(0,5).split(':').map(Number)
    const [endHour, endMinute] = rule.close_time.slice(0,5).split(':').map(Number)
    
    let slotTimeInMinutes = currentHour * 60 + currentMinute
    const endTimeInMinutes = endHour * 60 + endMinute
    const interval = 30 

    while (slotTimeInMinutes < endTimeInMinutes) {
      // Pokud je vybraný den "Dnes" A čas slotu je menší než "Teď" (+ malá rezerva např. 30 min), přeskočíme ho
      // Zde dáváme rezervu 0 minut (okamžitá minulost je pryč)
      if (isToday && slotTimeInMinutes < currentMinutesTotal) {
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

    setIsSubmitting(true)
    try {
      const { error } = await supabase.from('bookings').insert({
        salon_id: profile.id,
        service_id: selectedServiceId,
        customer_name: clientInfo.name,
        customer_email: clientInfo.email,
        customer_phone: clientInfo.phone,
        booking_date: selectedDate,
        start_time: selectedTime,
        status: 'pending'
      })

      if (error) throw error

      await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: 'ishchuktaras@gmail.com',
          subject: `Nová rezervace: ${clientInfo.name}`,
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
              <h1>Máte novou rezervaci! 🎉</h1>
              <p>Zákazník vytvořil novou rezervaci přes váš web.</p>
              <hr />
              <p><strong>Kdo:</strong> ${clientInfo.name}</p>
              <p><strong>Kdy:</strong> ${selectedDate} v ${selectedTime}</p>
              <p><strong>Služba:</strong> ${selectedService?.title} (${selectedService?.price} Kč)</p>
              <p><strong>Kontakt:</strong> ${clientInfo.phone}, ${clientInfo.email}</p>
              <hr />
              <a href="${window.location.origin}/dashboard/calendar" style="display: inline-block; background: #000; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Spravovat rezervaci</a>
            </div>
          `
        })
      })

      setBookingStep(4)
      
    } catch (err: any) {
      alert('Chyba rezervace: ' + err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const selectedService = services.find(s => s.id === selectedServiceId)
  const availableSlots = getAvailableTimes(selectedDate)

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-500">Načítám salon...</div>
  if (error) return <div className="min-h-screen flex items-center justify-center bg-slate-50 text-red-500">{error}</div>
  if (!profile) return null

  if (bookingStep === 4) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center p-6">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4 text-green-600">
            <Check className="h-8 w-8" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Rezervace odeslána!</h2>
          <p className="text-slate-600 mb-6">
            Děkujeme, <strong>{clientInfo.name}</strong>. Váš termín byl zaznamenán.
          </p>
          <div className="bg-slate-50 p-4 rounded-lg text-left mb-6 text-sm text-slate-700 space-y-2">
            <p><strong>Datum:</strong> {selectedDate}</p>
            <p><strong>Čas:</strong> {selectedTime}</p>
            <p><strong>Služba:</strong> {selectedService?.title}</p>
          </div>
          <Button onClick={() => window.location.reload()} variant="outline" className="w-full">Zpět</Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-28 md:pb-20">
      <header className="bg-white border-b sticky top-0 z-10 shadow-sm">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              {profile.logo_url ? (
                <img src={profile.logo_url} alt={profile.salon_name} className="w-12 h-12 md:w-16 md:h-16 rounded-full object-cover border border-slate-200 shadow-sm" />
              ) : (
                <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                  <Scissors className="h-6 w-6" />
                </div>
              )}
              <div>
                <h1 className="text-xl md:text-2xl font-bold text-slate-900 leading-tight">{profile.salon_name || 'Krásný Salon'}</h1>
                <div className="flex flex-col sm:flex-row sm:items-center text-sm text-slate-500 mt-1 gap-1 sm:gap-4">
                  {profile.address && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {profile.address}</span>}
                  {profile.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" /> {profile.phone}</span>}
                </div>
              </div>
            </div>
            <div className="hidden sm:flex flex-col items-end">
               <div className="bg-yellow-50 text-yellow-700 px-2 py-1 rounded-md text-sm font-bold flex items-center gap-1"><Star className="h-3 w-3 fill-yellow-500 text-yellow-500" /> 4.9</div>
               <span className="text-xs text-slate-400 mt-1">Ověřený Salon</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        {bookingStep === 1 && (
          <section className="space-y-4 animate-in slide-in-from-bottom-4 duration-300">
            <h2 className="text-lg font-semibold flex items-center gap-2"><span className="bg-slate-900 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs">1</span> Vyberte službu</h2>
            <div className="grid gap-3">
              {services.map(service => (
                <Card key={service.id} className={`cursor-pointer border-2 transition-all ${selectedServiceId === service.id ? 'border-slate-900 bg-slate-50' : 'border-transparent hover:border-slate-200'}`} onClick={() => setSelectedServiceId(service.id)}>
                  <CardContent className="p-4 flex justify-between items-center">
                    <div>
                      <h3 className="font-medium text-slate-900">{service.title}</h3>
                      <p className="text-sm text-slate-500">{service.duration_minutes} min • {service.price} Kč</p>
                    </div>
                    {selectedServiceId === service.id && <Check className="h-5 w-5 text-slate-900" />}
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        {bookingStep === 2 && (
          <section className="space-y-4 animate-in slide-in-from-right-8 duration-300">
            <Button variant="ghost" onClick={() => setBookingStep(1)} className="pl-0 text-slate-500 mb-2"><ArrowLeft className="h-4 w-4 mr-1"/> Zpět</Button>
            <h2 className="text-lg font-semibold flex items-center gap-2"><span className="bg-slate-900 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs">2</span> Vyberte termín</h2>
            <div className="bg-white p-4 rounded-xl border shadow-sm space-y-6">
              <div>
                <Label>Datum</Label>
                <Input type="date" className="mt-2" min={new Date().toISOString().split('T')[0]} value={selectedDate} onChange={e => { setSelectedDate(e.target.value); setSelectedTime(null); }} />
              </div>
              <div>
                <Label>Čas</Label>
                {!selectedDate ? <p className="text-sm text-slate-400 mt-2">Nejdříve vyberte datum.</p> :
                 loadingSlots ? <p className="text-sm text-slate-500 mt-2">Ověřuji dostupnost...</p> :
                 availableSlots.length === 0 ? <p className="text-sm text-red-500 mt-2">Pro tento den je plno, zavřeno, nebo už je pozdě.</p> :
                 <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mt-2 h-48 overflow-y-auto custom-scrollbar pr-1">
                   {availableSlots.map(time => (
                     <button key={time} onClick={() => setSelectedTime(time)} className={`py-2 text-sm rounded border ${selectedTime === time ? 'bg-slate-900 text-white border-slate-900' : 'hover:bg-slate-50'}`}>{time}</button>
                   ))}
                 </div>
                }
              </div>
            </div>
          </section>
        )}

        {bookingStep === 3 && (
          <section className="space-y-4 animate-in slide-in-from-right-8 duration-300">
            <Button variant="ghost" onClick={() => setBookingStep(2)} className="pl-0 text-slate-500 mb-2"><ArrowLeft className="h-4 w-4 mr-1"/> Zpět</Button>
            <h2 className="text-lg font-semibold flex items-center gap-2"><span className="bg-slate-900 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs">3</span> Vaše údaje</h2>
            <Card>
              <CardContent className="p-6">
                <form id="booking-form" onSubmit={handleBooking} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Jméno a Příjmení</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                      <Input id="name" className="pl-9" required placeholder="Jan Novák" value={clientInfo.name} onChange={e => setClientInfo({...clientInfo, name: e.target.value})} />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                        <Input id="email" type="email" className="pl-9" required placeholder="jan@email.cz" value={clientInfo.email} onChange={e => setClientInfo({...clientInfo, email: e.target.value})} />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Telefon</Label>
                      <div className="relative">
                        <Smartphone className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                        <Input id="phone" type="tel" className="pl-9" required placeholder="+420 777 123 456" value={clientInfo.phone} onChange={e => setClientInfo({...clientInfo, phone: e.target.value})} />
                      </div>
                    </div>
                  </div>
                </form>
              </CardContent>
            </Card>
          </section>
        )}
      </main>

      {selectedService && bookingStep < 4 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 shadow-lg z-50">
          <div className="max-w-3xl mx-auto flex items-center justify-between">
            <div className="hidden sm:block"><p className="text-xs text-slate-500 uppercase font-bold">Rezervace</p><p className="font-bold">{selectedService.title}</p></div>
            <div className="flex gap-2 w-full sm:w-auto">
              {bookingStep === 1 && <Button onClick={() => setBookingStep(2)} className="w-full sm:w-auto">Vybrat termín <ChevronRight className="ml-2 h-4 w-4"/></Button>}
              {bookingStep === 2 && <Button disabled={!selectedDate || !selectedTime} onClick={() => setBookingStep(3)} className="w-full sm:w-auto">Zadat údaje <ChevronRight className="ml-2 h-4 w-4"/></Button>}
              {bookingStep === 3 && <Button form="booking-form" type="submit" disabled={isSubmitting} className="w-full sm:w-auto bg-green-600 hover:bg-green-700">{isSubmitting ? 'Odesílám...' : 'Dokončit rezervaci'}</Button>}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}