'use client'

import { useState, useEffect, use } from 'react'
import { 
  Calendar as CalendarIcon, 
  Clock, 
  MapPin, 
  Phone, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  ChevronLeft, 
  ChevronRight, 
  User,
  Scissors,
  Mail,
  Smartphone,
  Star,
  Check,
  Info
} from 'lucide-react'
import { toast } from "sonner"

// --- 1. KONFIGURACE A POMOCNÉ FUNKCE (API) ---

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'

async function supabaseFetch(endpoint: string, options: RequestInit = {}) {
  const headers = {
    'apikey': SUPABASE_KEY,
    'Authorization': `Bearer ${SUPABASE_KEY}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation',
    ...options.headers,
  }
  
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${endpoint}`, options ? { ...options, headers } : { headers })
  
  if (!response.ok) {
     if (response.status === 406) return null 
     const error = await response.json().catch(() => ({ message: response.statusText }))
     throw new Error(error.message || `API Error: ${response.status}`)
  }
  return response.json()
}

// Funkce pro sjednocení formátu času na "HH:MM" (vždy 2 cifry)
const normalizeTime = (timeStr: string) => {
  if (!timeStr) return '';
  const parts = timeStr.split(':');
  if (parts.length < 2) return timeStr; 
  const h = parts[0].padStart(2, '0');
  const m = parts[1].padStart(2, '0');
  return `${h}:${m}`;
}

const generateEmailHtml = (name: string, salonName: string, date: string, time: string, service: string) => {
  return `
    <div style="font-family: sans-serif; color: #333;">
      <h1>Nová rezervace: ${salonName}</h1>
      <p>Klient: <strong>${name}</strong></p>
      <p>Služba: <strong>${service}</strong></p>
      <p>Datum: <strong>${date}</strong> v <strong>${time}</strong></p>
    </div>
  `
}

// --- 2. DEFINICE TYPŮ ---

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
  address: string
  phone: string
  logo_url: string
  description: string
  slug: string
}

interface BusinessHour {
  day_of_week: number
  open_time: string
  close_time: string
  is_closed: boolean
}

interface ClientInfo {
  name: string
  email: string
  phone: string
  note?: string
}

interface TimeSlot {
  time: string
  available: boolean
  reason?: string
}

// --- 3. SUB-KOMPONENTY (UI) ---

function SalonHeader({ profile }: { profile: Profile }) {
  return (
    <header className="bg-white border-b sticky top-0 z-10 shadow-sm/50 backdrop-blur-sm bg-white/90">
      <div className="max-w-3xl mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            {profile.logo_url ? (
              <img src={profile.logo_url} alt={profile.salon_name} className="w-12 h-12 md:w-16 md:h-16 rounded-full object-cover border border-slate-200 shadow-sm bg-white" onError={(e) => e.currentTarget.style.display = 'none'} />
            ) : (
              <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 border border-slate-200">
                <Scissors className="h-6 w-6" />
              </div>
            )}
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-slate-900 leading-tight">{profile.salon_name}</h1>
              <div className="flex flex-col sm:flex-row sm:items-center text-sm text-slate-500 mt-1 gap-1 sm:gap-4">
                {profile.address && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {profile.address}</span>}
                {profile.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" /> {profile.phone}</span>}
              </div>
            </div>
          </div>
          <div className="hidden sm:flex flex-col items-end">
             <div className="bg-yellow-50 text-yellow-700 border border-yellow-200 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
               <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" /> 4.9
             </div>
          </div>
        </div>
      </div>
    </header>
  )
}

function ServiceSelection({ services, selectedServiceId, onSelect }: { services: Service[], selectedServiceId: string | null, onSelect: (id: string) => void }) {
  return (
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
              <div key={service.id} 
                className={`cursor-pointer border rounded-xl p-5 transition-all duration-200 group hover:shadow-sm ${selectedServiceId === service.id ? 'border-[#F4C430] bg-[#FFFDF5] ring-1 ring-[#F4C430] shadow-md' : 'border-slate-200 bg-white hover:border-[#F4C430]/50'}`}
                onClick={() => onSelect(service.id)}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className={`font-semibold text-lg ${selectedServiceId === service.id ? 'text-slate-900' : 'text-slate-900'}`}>{service.title}</h3>
                    <div className="flex items-center gap-3 mt-1.5">
                        <div className="flex items-center text-sm text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                           <Clock className="h-3 w-3 mr-1" /> {service.duration_minutes} min 
                        </div>
                        <span className="font-bold text-slate-900">{service.price} Kč</span>
                    </div>
                    {service.description && <p className="text-sm text-slate-500 mt-2 line-clamp-2">{service.description}</p>}
                  </div>
                  <div className={`h-6 w-6 rounded-full border-2 flex items-center justify-center transition-colors ${selectedServiceId === service.id ? 'border-[#F4C430] bg-[#F4C430] text-slate-900' : 'border-slate-300 bg-transparent'}`}>
                      {selectedServiceId === service.id && <Check className="h-3 w-3" />}
                  </div>
                </div>
              </div>
            ))
        )}
      </div>
    </section>
  )
}

function TimeSelection({ selectedDate, onDateChange, availableSlots, selectedTime, onTimeSelect, loadingSlots, onBack }: any) {
  return (
    <section className="space-y-6 animate-in slide-in-from-right-8 duration-300 fade-in">
      <div className="flex items-center justify-between">
          <button onClick={onBack} className="pl-0 text-slate-500 hover:text-slate-900 mb-2 group h-auto py-0 hover:bg-transparent flex items-center text-sm font-medium">
            <ChevronLeft className="h-4 w-4 mr-1 group-hover:-translate-x-1 transition-transform"/> Zpět
          </button>
          <span className="text-xs font-medium text-slate-400 uppercase tracking-widest">Krok 2/3</span>
      </div>

      <h2 className="text-lg font-bold flex items-center gap-3 text-slate-800">
        <span className="bg-slate-900 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shadow-md">2</span> Vyberte termín
      </h2>
      
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-8">
        <div>
          <label className="text-slate-700 font-medium mb-2 block flex items-center gap-2 text-sm"><CalendarIcon className="h-4 w-4"/> Datum návštěvy</label>
          <input 
            type="date" 
            className="mt-2 h-12 px-3 text-lg bg-slate-50 border border-slate-200 rounded-lg focus:border-[#F4C430] focus:ring-1 focus:ring-[#F4C430] outline-none cursor-pointer w-full" 
            min={new Date().toISOString().split('T')[0]} 
            value={selectedDate} 
            onChange={e => onDateChange(e.target.value)} 
          />
        </div>

        <div>
          <label className="text-slate-700 font-medium mb-2 block flex items-center gap-2 text-sm"><Clock className="h-4 w-4"/> Dostupné časy</label>
          <div className="min-h-[100px]">
              {!selectedDate ? 
                  <div className="text-sm text-slate-500 italic p-6 bg-slate-50 rounded-lg text-center border border-dashed border-slate-200">Nejdříve vyberte datum.</div> :
              loadingSlots ? 
                  <div className="p-8 text-center"><Loader2 className="animate-spin h-8 w-8 text-[#F4C430] mx-auto opacity-50"/><p className="text-xs text-slate-400 mt-2">Hledám termíny...</p></div> :
              availableSlots.length === 0 ? 
                  <div className="text-sm text-red-600 font-medium p-6 bg-red-50 rounded-lg text-center border border-red-100 flex flex-col items-center gap-2">
                      <Info className="h-5 w-5"/> Pro tento den je plno nebo zavřeno.
                  </div> :
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 mt-4 max-h-80 overflow-y-auto pr-2">
              {availableSlots.map((slot: any) => (
                  <button 
                  key={slot.time} 
                  disabled={!slot.available}
                  onClick={() => onTimeSelect(slot.time)}
                  title={slot.reason}
                  className={`py-3 px-2 text-sm rounded-lg border transition-all duration-200 font-medium ${
                      !slot.available ? 'bg-slate-50 text-slate-300 border-transparent cursor-not-allowed hidden' : 
                      selectedTime === slot.time 
                      ? 'bg-[#F4C430] text-slate-900 border-[#F4C430] shadow-md scale-105 transform font-bold' 
                      : 'bg-white text-slate-700 border-slate-200 hover:border-[#F4C430] hover:bg-[#FFFDF5]'
                  }`}
                  >
                  {slot.time}
                  </button>
              ))}
              </div>
              }
          </div>
        </div>
      </div>
    </section>
  )
}

function ContactForm({ clientInfo, onClientInfoChange, termsAccepted, onTermsChange, onSubmit, onBack, salonName, isSubmitting }: any) {
  return (
    <section className="space-y-6 animate-in slide-in-from-right-8 duration-300 fade-in">
       <div className="flex items-center justify-between">
          <button onClick={onBack} className="pl-0 text-slate-500 hover:text-slate-900 mb-2 group h-auto py-0 hover:bg-transparent flex items-center text-sm font-medium">
          <ChevronLeft className="h-4 w-4 mr-1 group-hover:-translate-x-1 transition-transform"/> Zpět
          </button>
          <span className="text-xs font-medium text-slate-400 uppercase tracking-widest">Krok 3/3</span>
      </div>

      <h2 className="text-lg font-bold flex items-center gap-3 text-slate-800">
        <span className="bg-slate-900 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shadow-md">3</span> Vaše údaje
      </h2>

      <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-6">
        <form id="booking-form" onSubmit={onSubmit} className="space-y-5">
          <div className="space-y-2">
            <label htmlFor="name" className="text-sm font-medium text-slate-700">Jméno a Příjmení *</label>
            <div className="relative">
              <User className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
              <input id="name" className="pl-10 h-11 w-full rounded-lg bg-slate-50 border border-slate-200 focus:ring-1 focus:ring-[#F4C430] focus:border-[#F4C430] outline-none" required placeholder="Jan Novák" 
                value={clientInfo.name} onChange={e => onClientInfoChange({ ...clientInfo, name: e.target.value })}
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-slate-700">Email *</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                <input id="email" type="email" className="pl-10 h-11 w-full rounded-lg bg-slate-50 border border-slate-200 focus:ring-1 focus:ring-[#F4C430] focus:border-[#F4C430] outline-none" required placeholder="jan@email.cz" 
                  value={clientInfo.email} onChange={e => onClientInfoChange({ ...clientInfo, email: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <label htmlFor="phone" className="text-sm font-medium text-slate-700">Telefon *</label>
              <div className="relative">
                <Smartphone className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                <input id="phone" type="tel" className="pl-10 h-11 w-full rounded-lg bg-slate-50 border border-slate-200 focus:ring-1 focus:ring-[#F4C430] focus:border-[#F4C430] outline-none" required placeholder="+420 777 123 456" 
                  value={clientInfo.phone} onChange={e => onClientInfoChange({ ...clientInfo, phone: e.target.value })}
                />
              </div>
            </div>
          </div>
          
          <div className="flex items-start space-x-3 pt-4 border-t border-slate-100 mt-4 bg-slate-50/50 p-4 rounded-lg">
            <input type="checkbox" id="terms" checked={termsAccepted} onChange={(e) => onTermsChange(e.target.checked)} className="mt-1 w-4 h-4 accent-[#F4C430] cursor-pointer" required />
            <div className="grid gap-1.5 leading-none">
              <label htmlFor="terms" className="text-sm font-medium leading-none text-slate-700 cursor-pointer">
                Souhlasím se zpracováním osobních údajů *
              </label>
              <p className="text-xs text-slate-500">
                Vaše údaje budou použity pouze pro účely rezervace v salonu {salonName}.
              </p>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={isSubmitting}
            className="w-full bg-[#F4C430] text-slate-900 py-4 rounded-xl font-bold text-lg hover:bg-[#E0B120] transition-colors shadow-lg shadow-[#F4C430]/20 flex justify-center items-center gap-2 mt-4"
          >
             {isSubmitting ? <Loader2 className="animate-spin" /> : <CheckCircle2 />}
             {isSubmitting ? 'Odesílám...' : 'Závazně rezervovat'}
          </button>
        </form>
      </div>
    </section>
  )
}

// --- 4. HLAVNÍ LOGIKA A STRÁNKA ---

export default function SalonPublicPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params)

  // Data
  const [profile, setProfile] = useState<Profile | null>(null)
  const [services, setServices] = useState<Service[]>([])
  const [businessHours, setBusinessHours] = useState<BusinessHour[]>([])
  
  // Stavy
  const [loading, setLoading] = useState(true)
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1) 
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Výběry
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null)
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0])
  const [selectedTime, setSelectedTime] = useState<string | null>(null)
  const [slots, setSlots] = useState<TimeSlot[]>([])
  const [slotsLoading, setSlotsLoading] = useState(false)
  const [bookedTimes, setBookedTimes] = useState<string[]>([])

  // Formulář
  const [clientInfo, setClientInfo] = useState<ClientInfo>({ name: '', email: '', phone: '' })
  const [termsAccepted, setTermsAccepted] = useState(false)

  useEffect(() => {
    if (slug) loadData()
  }, [slug])

  useEffect(() => {
    if (step === 2 && profile && selectedServiceId) {
      calculateSlots()
    }
  }, [selectedDate, step, selectedServiceId])

  const loadData = async () => {
    try {
      setLoading(true)
      const profiles = await supabaseFetch(`profiles?slug=eq.${slug}&select=*`)
      const profileData = profiles?.[0]

      if (!profileData) {
        toast.error("Salon nenalezen")
        return
      }
      setProfile(profileData)
      console.log('--- DB DEBUG ---')
      console.log('Salon ID:', profileData.id)

      const servicesData = await supabaseFetch(`services?user_id=eq.${profileData.id}&is_active=eq.true&order=price.asc`)
      setServices(servicesData || [])

      const hoursData = await supabaseFetch(`business_hours?user_id=eq.${profileData.id}`)
      setBusinessHours(hoursData || [])

    } catch (e: any) {
      console.error(e)
      toast.error("Chyba načítání")
    } finally {
      setLoading(false)
    }
  }

  // --- KLÍČOVÁ LOGIKA VÝPOČTU SLOTŮ (S LEPSIM DEBUGGINGEM A MATCHINGEM) ---
  const calculateSlots = async () => {
    if (!profile || !selectedServiceId) return
    setSlotsLoading(true)
    setSlots([])

    try {
      // 1. Bookings pro den (podle booking_date)
      console.log('Checking bookings for:', selectedDate, 'Salon:', profile.id);
      
      const bookingsData = await supabaseFetch(`bookings?salon_id=eq.${profile.id}&booking_date=eq.${selectedDate}&status=neq.cancelled`)
      
      console.log('Raw DB Bookings:', bookingsData); // Zde uvidíte, co DB skutečně vrátila

      // Robustní extrakce času (např. "09:00:00" -> "09:00")
      const bookedStartTimes = (bookingsData || []).map((b: any) => {
          if (typeof b.start_time === 'string') {
             return normalizeTime(b.start_time);
          }
          return '';
      }).filter(Boolean);
      
      setBookedTimes(bookedStartTimes)
      console.log('Normalized Booked Times:', bookedStartTimes);

      // 2. Logika slotů
      const service = services.find(s => s.id === selectedServiceId)
      const serviceDuration = service?.duration_minutes || 30

      const dateObj = new Date(selectedDate)
      const dayIndex = dateObj.getDay() 
      const rule = businessHours.find(h => h.day_of_week === dayIndex)

      if (!rule || rule.is_closed) {
        setSlots([])
        setSlotsLoading(false)
        return
      }

      const [openH, openM] = rule.open_time.split(':').map(Number)
      const [closeH, closeM] = rule.close_time.split(':').map(Number)
      
      let currentMinutes = openH * 60 + openM
      const closeMinutes = closeH * 60 + closeM
      const interval = 15

      const generatedSlots: TimeSlot[] = []
      const now = new Date()
      const isToday = selectedDate === now.toISOString().split('T')[0]
      const currentNowMinutes = now.getHours() * 60 + now.getMinutes()

      while (currentMinutes + serviceDuration <= closeMinutes) {
        const h = Math.floor(currentMinutes / 60).toString().padStart(2, '0')
        const m = (currentMinutes % 60).toString().padStart(2, '0')
        const timeStr = `${h}:${m}`
        
        let available = true
        let reason = ''

        if (isToday && currentMinutes < (currentNowMinutes + 30)) {
           available = false
           reason = 'Příliš brzy'
        }

        // KONTROLA KOLIZE (ROBUSTNÍ)
        if (bookedStartTimes.includes(timeStr)) {
            available = false
            reason = 'Obsazeno'
        }

        generatedSlots.push({ time: timeStr, available, reason })
        currentMinutes += interval
      }
      setSlots(generatedSlots)

    } catch (e) { console.error(e) } 
    finally { setSlotsLoading(false) }
  }

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!profile || !selectedServiceId || !selectedTime) return
    
    setIsSubmitting(true)
    console.log("Submitting booking..."); // Debug log

    try {
      const timeOnly = `${selectedTime}:00` 

      // OPRAVENÁ DATA (mapování na customer_*)
      const payload = {
        salon_id: profile.id,
        user_id: profile.id, // Fallback
        service_id: selectedServiceId,
        customer_name: clientInfo.name, // BYLO: client_name
        customer_email: clientInfo.email, // BYLO: client_email
        customer_phone: clientInfo.phone, // BYLO: client_phone
        start_time: timeOnly,
        booking_date: selectedDate,
        status: 'pending',
        // note: clientInfo.note // Pokud DB nemá note, vynechat (v JSONu není)
      }

      console.log("Payload:", payload); // Debug log

      await supabaseFetch('bookings', { method: 'POST', body: JSON.stringify(payload) })
      setStep(4)
      toast.success("Rezervace odeslána")
    } catch (e: any) {
      console.error("Booking Error:", e); // Debug log
      toast.error("Chyba: " + e.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  // --- RENDER ---
  if (loading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin text-[#F4C430] w-10 h-10" /></div>
  if (!profile) return <div className="p-8 text-center">Salon nenalezen</div>

  if (step === 4) {
    return (
      <div className="min-h-screen bg-[#F8F5E6] flex items-center justify-center p-4 font-sans">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center space-y-6">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto text-green-600">
            <CheckCircle2 size={40} />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Hotovo!</h1>
          <p className="text-slate-600">Vaše rezervace na <strong>{selectedDate} v {selectedTime}</strong> byla odeslána.</p>
          <button onClick={() => window.location.reload()} className="w-full bg-slate-900 text-white py-3 rounded-lg font-bold hover:bg-slate-800 transition-colors">Zpět na začátek</button>
        </div>
      </div>
    )
  }

  const selectedService = services.find(s => s.id === selectedServiceId)
  const canProceed = () => {
    if (step === 1) return !!selectedServiceId
    if (step === 2) return !!(selectedDate && selectedTime)
    if (step === 3) return termsAccepted
    return false
  }

  return (
    <div className="min-h-screen bg-[#F8F5E6] font-sans pb-24">
      <SalonHeader profile={profile} />
      <main className="max-w-3xl mx-auto px-4 py-8">
        {step === 1 && <ServiceSelection services={services} selectedServiceId={selectedServiceId} onSelect={(id) => setSelectedServiceId(id)} />}
        {step === 2 && <TimeSelection selectedDate={selectedDate} onDateChange={(date: string) => { setSelectedDate(date); setSelectedTime(null); }} availableSlots={slots} selectedTime={selectedTime} onTimeSelect={setSelectedTime} loadingSlots={slotsLoading} onBack={() => setStep(1)} />}
        {step === 3 && <ContactForm clientInfo={clientInfo} onClientInfoChange={setClientInfo} termsAccepted={termsAccepted} onTermsChange={setTermsAccepted} onSubmit={handleBooking} onBack={() => setStep(2)} salonName={profile.salon_name} isSubmitting={isSubmitting} />}
      </main>
      
      {/* FOOTER */}
      {selectedService && step < 4 && (
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
              {step === 1 && (
                <button onClick={() => setStep(2)} className="w-full sm:w-auto h-12 px-8 bg-[#F4C430] hover:bg-[#E0B120] text-slate-900 shadow-lg shadow-[#F4C430]/20 transition-all hover:scale-[1.02] rounded-xl font-bold flex items-center justify-center">
                  Vybrat termín <ChevronRight className="ml-2 h-5 w-5"/>
                </button>
              )}
              {step === 2 && (
                <button disabled={!canProceed()} onClick={() => setStep(3)} className="w-full sm:w-auto h-12 px-8 bg-[#F4C430] hover:bg-[#E0B120] text-slate-900 shadow-lg shadow-[#F4C430]/20 transition-all hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100 rounded-xl font-bold flex items-center justify-center">
                  Zadat údaje <ChevronRight className="ml-2 h-5 w-5"/>
                </button>
              )}
              {step === 3 && (
                <button form="booking-form" type="submit" disabled={isSubmitting || !canProceed()} className="w-full sm:w-auto h-12 px-8 bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-600/20 transition-all hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100 rounded-xl font-bold flex items-center justify-center">
                  {isSubmitting ? 'Odesílám...' : 'Dokončit rezervaci'} <Check className="ml-2 h-5 w-5"/>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}