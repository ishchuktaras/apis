'use client'

import { useState, useEffect, use } from 'react'
import { supabase } from '@/lib/supabase'
import { toast } from "sonner"
import { generateEmailHtml } from '@/lib/email-templates'
import { Profile, Service, BusinessHour, BookingSlot, ClientInfo } from '@/types/salon'

// Komponenty
import { SalonHeader } from '@/components/salon/salon-header'
import { ServiceSelection } from '@/components/salon/service-selection'
import { TimeSelection } from '@/components/salon/time-selection'
import { ContactForm } from '@/components/salon/contact-form'
import { BookingConfirmation } from '@/components/salon/booking-confirmation'
import { BookingSummaryFooter } from '@/components/salon/booking-summary-footer'
import { SalonLoading, SalonError } from '@/components/salon/salon-states'

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
  const [clientInfo, setClientInfo] = useState<ClientInfo>({
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

      await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: 'ishchuktaras@gmail.com',
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

  // LOGIKA FOOTERU
  const canProceed = () => {
    if (bookingStep === 1) return true // Vždy zobrazíme tlačítko, pokud je selectedService
    if (bookingStep === 2) return !!(selectedDate && selectedTime)
    if (bookingStep === 3) return termsAccepted
    return false
  }

  const handleNextStep = () => {
    if (bookingStep === 1) setBookingStep(2)
    else if (bookingStep === 2) setBookingStep(3)
  }

  if (loading) return <SalonLoading />
  if (error) return <SalonError message={error} />
  if (!profile) return null

  // KROK 4: DĚKOVAČKA
  if (bookingStep === 4) {
    return (
      <BookingConfirmation 
        clientInfo={clientInfo}
        selectedDate={selectedDate}
        selectedTime={selectedTime}
        serviceTitle={selectedService?.title}
        salonName={profile.salon_name}
        onReset={() => window.location.reload()}
      />
    )
  }

  return (
    <div className="min-h-screen bg-slate-50/50 pb-32 md:pb-24 font-sans selection:bg-primary/20">
      
      <SalonHeader profile={profile} />

      <main className="max-w-3xl mx-auto px-4 py-8">
        
        {bookingStep === 1 && (
          <ServiceSelection 
            services={services}
            selectedServiceId={selectedServiceId}
            onSelect={(id) => setSelectedServiceId(id)}
          />
        )}

        {bookingStep === 2 && (
          <TimeSelection 
            selectedDate={selectedDate}
            onDateChange={(date) => { setSelectedDate(date); setSelectedTime(null); }}
            availableSlots={availableSlots}
            selectedTime={selectedTime}
            onTimeSelect={setSelectedTime}
            loadingSlots={loadingSlots}
            onBack={() => setBookingStep(1)}
          />
        )}

        {bookingStep === 3 && (
          <ContactForm 
            clientInfo={clientInfo}
            onClientInfoChange={setClientInfo}
            termsAccepted={termsAccepted}
            onTermsChange={setTermsAccepted}
            onSubmit={handleBooking}
            onBack={() => setBookingStep(2)}
            salonName={profile.salon_name}
          />
        )}

      </main>

      <BookingSummaryFooter 
        selectedService={selectedService}
        bookingStep={bookingStep}
        onNext={handleNextStep}
        isSubmitting={isSubmitting}
        canProceed={canProceed()}
      />

    </div>
  )
}