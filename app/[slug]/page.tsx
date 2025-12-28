'use client'

import { useState, useEffect, use } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { MapPin, Phone, Clock, Calendar as CalendarIcon, Check, ChevronRight, Star } from 'lucide-react'

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
}

interface PageProps {
  params: Promise<{ slug: string }>
}

export default function SalonPublicPage({ params }: PageProps) {
  const { slug } = use(params)

  const [profile, setProfile] = useState<Profile | null>(null)
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null)
  const [selectedDate, setSelectedDate] = useState<string>('')
  const [selectedTime, setSelectedTime] = useState<string | null>(null)
  const [bookingStep, setBookingStep] = useState<1 | 2>(1)

  useEffect(() => {
    if (slug) {
      fetchSalonData()
    }
  }, [slug])

  const fetchSalonData = async () => {
    try {
      setLoading(true)
      
      // OPRAVA: .maybeSingle() nevyhazuje 406 chybu, pokud salon neexistuje
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('slug', slug)
        .maybeSingle() 

      if (profileError) {
        console.error('Chyba DB:', profileError)
        setError('Chyba databáze')
        return
      }

      if (!profileData) {
        setError('Salon nebyl nalezen. Zkontrolujte URL adresu.')
        return
      }
      
      setProfile(profileData)

      // Načtení služeb
      const { data: servicesData } = await supabase
        .from('services')
        .select('*')
        .eq('user_id', profileData.id)
        .order('price', { ascending: true })

      setServices(servicesData || [])

    } catch (err) {
      console.error(err)
      setError('Neočekávaná chyba')
    } finally {
      setLoading(false)
    }
  }

  const timeSlots = [
    "09:00", "09:30", "10:00", "10:30", "11:00", 
    "13:00", "13:30", "14:00", "14:30", "15:00", "15:30", "16:00"
  ]

  const selectedService = services.find(s => s.id === selectedServiceId)

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-500">Načítám salon...</div>
  
  if (error) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 text-slate-800 p-4 text-center">
      <h1 className="text-2xl font-bold mb-2">😕 {error}</h1>
      <p className="text-slate-500 mb-4">Ujistěte se, že jste v Nastavení zadali správnou "Webovou adresu" (slug).</p>
      <Button variant="outline" onClick={() => window.location.href = '/login'}>Přejít do Adminu</Button>
    </div>
  )

  if (!profile) return null

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      
      {/* HEADER */}
      <header className="bg-white border-b sticky top-0 z-10 shadow-sm">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">{profile.salon_name || 'Krásný Salon'}</h1>
              <div className="flex flex-col sm:flex-row sm:items-center text-sm text-slate-500 mt-1 gap-1 sm:gap-4">
                {profile.address && (
                  <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {profile.address}</span>
                )}
                {profile.phone && (
                  <span className="flex items-center gap-1"><Phone className="h-3 w-3" /> {profile.phone}</span>
                )}
              </div>
            </div>
            <div className="hidden sm:flex flex-col items-end">
               <div className="bg-yellow-50 text-yellow-700 px-2 py-1 rounded-md text-sm font-bold flex items-center gap-1">
                 <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" /> 4.9
               </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 grid gap-8">
        
        {/* KROK 1: SLUŽBY */}
        {bookingStep === 1 && (
          <section className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
              <span className="bg-slate-900 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs">1</span>
              Vyberte službu
            </h2>
            
            <div className="grid gap-3">
              {services.length === 0 ? (
                <div className="text-center py-10 text-slate-400 bg-white rounded-lg border border-dashed">
                  Salon zatím nemá vypsané žádné služby.
                </div>
              ) : (
                services.map((service) => (
                  <Card 
                    key={service.id} 
                    className={`cursor-pointer transition-all hover:shadow-md border-2 ${selectedServiceId === service.id ? 'border-slate-900 bg-slate-50' : 'border-transparent hover:border-slate-200'}`}
                    onClick={() => setSelectedServiceId(service.id)}
                  >
                    <CardContent className="p-4 flex justify-between items-center">
                      <div>
                        <h3 className="font-medium text-slate-900">{service.title}</h3>
                        <p className="text-sm text-slate-500 mt-1 line-clamp-1">{service.description}</p>
                        <div className="flex items-center gap-3 mt-2 text-xs font-medium text-slate-600">
                          <span className="flex items-center gap-1 bg-white px-2 py-1 rounded border"><Clock className="h-3 w-3" /> {service.duration_minutes} min</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="block text-lg font-bold text-slate-900">{service.price} Kč</span>
                        {selectedServiceId === service.id && (
                          <span className="inline-flex items-center gap-1 text-xs text-white bg-slate-900 px-2 py-1 rounded-full mt-2">
                            <Check className="h-3 w-3" /> Vybráno
                          </span>
                        )}
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
          <section className="space-y-4 animate-in fade-in slide-in-from-right-8 duration-500">
             <Button variant="ghost" onClick={() => setBookingStep(1)} className="pl-0 hover:bg-transparent text-slate-500">
               ← Zpět na výběr služeb
             </Button>
            
            <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
              <span className="bg-slate-900 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs">2</span>
              Vyberte termín
            </h2>

            <div className="bg-white p-6 rounded-xl border shadow-sm">
               <div className="grid md:grid-cols-2 gap-8">
                 <div className="space-y-4">
                   <label className="block text-sm font-medium text-slate-700">Datum</label>
                   <input 
                     type="date" 
                     className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-slate-900 focus:outline-none"
                     min={new Date().toISOString().split('T')[0]} 
                     onChange={(e) => setSelectedDate(e.target.value)}
                   />
                 </div>

                 <div>
                    <label className="block text-sm font-medium text-slate-700 mb-3">Dostupné časy</label>
                    {!selectedDate ? (
                      <div className="text-sm text-slate-400 italic">Nejdříve vyberte datum vlevo.</div>
                    ) : (
                      <div className="grid grid-cols-3 gap-2">
                        {timeSlots.map((time) => (
                          <button
                            key={time}
                            onClick={() => setSelectedTime(time)}
                            className={`py-2 px-1 text-sm rounded-md transition-colors ${
                              selectedTime === time 
                                ? 'bg-slate-900 text-white font-medium' 
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                          >
                            {time}
                          </button>
                        ))}
                      </div>
                    )}
                 </div>
               </div>
            </div>
          </section>
        )}

      </main>

      {/* KOŠÍK */}
      {selectedService && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 shadow-lg animate-in slide-in-from-bottom-full duration-300 z-50">
          <div className="max-w-3xl mx-auto flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 uppercase font-semibold">Rezervujete</p>
              <h4 className="font-bold text-slate-900">{selectedService.title}</h4>
              <p className="text-sm text-slate-600">{selectedService.price} Kč • {selectedService.duration_minutes} min</p>
            </div>

            {bookingStep === 1 ? (
              <Button onClick={() => setBookingStep(2)} size="lg" className="bg-slate-900 text-white hover:bg-slate-800">
                Pokračovat <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button 
                disabled={!selectedDate || !selectedTime} 
                size="lg" 
                className="bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={() => alert('Skvělé! V příštím kroku dokončíme rezervaci.')}
              >
                Dokončit rezervaci
              </Button>
            )}
          </div>
        </div>
      )}

    </div>
  )
}