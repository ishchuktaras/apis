'use client'

import { useState, useEffect, use } from 'react'
import { 
  Calendar as CalendarIcon, 
  Clock, 
  MapPin, 
  Phone, 
  CheckCircle2, 
  Loader2, 
  ChevronLeft, 
  ChevronRight, 
  User,
  Scissors,
  Star,
  Check,
  Info
} from 'lucide-react'
import { toast } from "sonner"

// --- TYPY ---
interface Service {
  id: string
  name: string
  price: number
  durationMin: number
  description?: string
}

interface Profile {
  id: string
  salon_name: string
  address: string
  phone: string
  logo_url: string | null
  slug: string
}

interface StaffMember {
  id: string
  fullName: string
  role: string
}

interface BusinessHour {
  dayOfWeek: number
  openTime: string
  closeTime: string
  isClosed: boolean
}

// --- KOMPONENTY (ZACHOVÁNO UI) ---

function SalonHeader({ profile }: { profile: Profile }) {
  return (
    <header className="bg-white border-b sticky top-0 z-10 backdrop-blur-sm bg-white/90">
      <div className="max-w-3xl mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            {profile.logo_url ? (
              <img src={profile.logo_url} alt={profile.salon_name} className="w-12 h-12 md:w-16 md:h-16 rounded-full object-cover border border-slate-200" />
            ) : (
              <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 border border-slate-200">
                <Scissors className="h-6 w-6" />
              </div>
            )}
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-slate-900">{profile.salon_name}</h1>
              <div className="flex flex-col sm:flex-row sm:items-center text-sm text-slate-500 mt-1 gap-1 sm:gap-4">
                <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {profile.address}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}

// ... (UI části ServiceSelection, StaffSelection, TimeSelection, ContactForm zůstávají vizuálně stejné, jen upravíme fieldy)

export default function SalonPublicPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params)

  const [profile, setProfile] = useState<Profile | null>(null)
  const [services, setServices] = useState<Service[]>([])
  const [staff, setStaff] = useState<StaffMember[]>([])
  const [businessHours, setBusinessHours] = useState<BusinessHour[]>([])
  
  const [loading, setLoading] = useState(true)
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1)
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null)
  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null)
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0])
  const [selectedTime, setSelectedTime] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        const res = await fetch(`/api/public/salon/${slug}`)
        if (!res.ok) throw new Error("Salon nenalezen")
        const data = await res.json()
        
        setProfile(data.profile)
        setServices(data.services)
        setStaff(data.staff)
        setBusinessHours(data.businessHours)
      } catch (e) {
        console.error(e)
        toast.error("Chyba při načítání salonu")
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [slug])

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      // Zde bude volání POST na /api/public/bookings (vytvoříme v dalším kroku)
      toast.success("Rezervace odeslána!")
      setStep(5)
    } catch (e) {
      toast.error("Chyba při odesílání")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin text-[#F4C430] w-10 h-10" /></div>
  if (!profile) return <div className="p-8 text-center font-sans">Salon nenalezen.</div>

  // Zjednodušený render pro ukázku - design zůstává tvůj původní
  return (
    <div className="min-h-screen bg-[#F8F5E6] font-sans pb-24">
      <SalonHeader profile={profile} />
      <main className="max-w-3xl mx-auto px-4 py-8">
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold">Vyberte službu</h2>
            {services.map(s => (
              <div key={s.id} onClick={() => { setSelectedServiceId(s.id); setStep(2); }} className="p-4 bg-white rounded-xl border border-slate-200 cursor-pointer hover:border-[#F4C430]">
                <div className="flex justify-between font-bold">
                  <span>{s.name}</span>
                  <span>{s.price} Kč</span>
                </div>
                <div className="text-sm text-slate-500">{s.durationMin} min</div>
              </div>
            ))}
          </div>
        )}
        
        {step === 2 && (
           <div className="space-y-4">
             <button onClick={() => setStep(1)} className="text-sm flex items-center text-slate-500"><ChevronLeft size={16}/> Zpět</button>
             <h2 className="text-xl font-bold">Vyberte specialistu</h2>
             <div onClick={() => setStep(3)} className="p-4 bg-white rounded-xl border border-slate-200 cursor-pointer">Kdokoli (první volný termín)</div>
             {staff.map(m => (
               <div key={m.id} onClick={() => { setSelectedStaffId(m.id); setStep(3); }} className="p-4 bg-white rounded-xl border border-slate-200 cursor-pointer">
                 {m.fullName}
               </div>
             ))}
           </div>
        )}

        {/* ... (Další kroky 3 a 4 podobně jako tvůj původní kód) */}

        {step === 5 && (
          <div className="text-center space-y-4 p-8 bg-white rounded-2xl shadow-xl">
            <CheckCircle2 size={48} className="mx-auto text-green-500" />
            <h2 className="text-2xl font-bold">Rezervace hotova!</h2>
            <p>Těšíme se na vaši návštěvu.</p>
            <button onClick={() => window.location.reload()} className="w-full bg-slate-900 text-white py-3 rounded-lg">Zavřít</button>
          </div>
        )}
      </main>
    </div>
  )
}