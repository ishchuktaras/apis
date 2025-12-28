'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar as CalendarIcon, Clock, User, Phone, Mail, CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import { Button } from "@/components/ui/button"

// Definice typů
interface Booking {
  id: string
  customer_name: string
  customer_email: string
  customer_phone: string
  booking_date: string
  start_time: string
  status: 'pending' | 'confirmed' | 'cancelled'
  services: {
    title: string
    price: number
    duration_minutes: number
  }
}

export default function CalendarPage() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchBookings()
  }, [])

  const fetchBookings = async () => {
    try {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Dnešní datum (aby se nenačítala historie)
      const today = new Date().toISOString().split('T')[0]

      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          services (
            title,
            price,
            duration_minutes
          )
        `)
        .eq('salon_id', user.id)
        .gte('booking_date', today) // Jen budoucí
        .order('booking_date', { ascending: true })
        .order('start_time', { ascending: true })

      if (error) throw error
      setBookings(data || [])

    } catch (error) {
      console.error('Chyba:', error)
    } finally {
      setLoading(false)
    }
  }

  // Funkce pro změnu stavu (Potvrdit / Zrušit)
  const updateStatus = async (id: string, newStatus: string) => {
    // Optimistický update v UI
    setBookings(bookings.map(b => b.id === id ? { ...b, status: newStatus as any } : b))

    await supabase.from('bookings').update({ status: newStatus }).eq('id', id)
  }

  // Formátování data (např. "Pondělí 20.1.")
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('cs-CZ', { weekday: 'long', day: 'numeric', month: 'numeric' }).format(date)
  }

  if (loading) return <div className="p-8 text-center text-slate-500">Načítám rezervace...</div>

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-2">
        <CalendarIcon className="h-8 w-8" /> Nadcházející rezervace
      </h1>

      {bookings.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <div className="bg-slate-100 p-4 rounded-full mb-4">
              <CalendarIcon className="h-8 w-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-medium text-slate-900">Zatím žádné rezervace</h3>
            <p className="text-slate-500 max-w-sm mt-1">
              Jakmile si klienti rezervují termín přes vaši veřejnou stránku, uvidíte je zde.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {bookings.map((booking) => (
            <Card key={booking.id} className={`border-l-4 ${
              booking.status === 'confirmed' ? 'border-l-green-500' : 
              booking.status === 'cancelled' ? 'border-l-red-500' : 'border-l-yellow-500'
            }`}>
              <CardContent className="p-5">
                <div className="flex flex-col md:flex-row justify-between gap-4">
                  
                  {/* ČAS A DATUM */}
                  <div className="flex-shrink-0 min-w-[120px]">
                    <div className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">
                      {formatDate(booking.booking_date)}
                    </div>
                    <div className="text-2xl font-bold text-slate-800 flex items-center gap-1">
                      <Clock className="h-5 w-5 text-slate-400" />
                      {booking.start_time.slice(0, 5)}
                    </div>
                    <div className="text-sm text-slate-500 mt-1">
                      {booking.services?.duration_minutes} min
                    </div>
                  </div>

                  {/* DETAILY REZERVACE */}
                  <div className="flex-grow">
                    <h3 className="text-lg font-bold text-slate-900">{booking.services?.title || 'Neznámá služba'}</h3>
                    <div className="text-slate-600 font-medium mb-2">{booking.services?.price} Kč</div>
                    
                    <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-slate-500">
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3" /> {booking.customer_name}
                      </div>
                      <div className="flex items-center gap-1">
                        <Phone className="h-3 w-3" /> <a href={`tel:${booking.customer_phone}`} className="hover:text-slate-800">{booking.customer_phone}</a>
                      </div>
                      <div className="flex items-center gap-1">
                        <Mail className="h-3 w-3" /> {booking.customer_email}
                      </div>
                    </div>
                  </div>

                  {/* AKCE (Tlačítka) */}
                  <div className="flex md:flex-col gap-2 justify-center min-w-[140px]">
                    {booking.status === 'pending' && (
                      <>
                        <Button size="sm" className="bg-green-600 hover:bg-green-700 w-full" onClick={() => updateStatus(booking.id, 'confirmed')}>
                          <CheckCircle className="h-4 w-4 mr-1" /> Potvrdit
                        </Button>
                        <Button size="sm" variant="outline" className="text-red-600 hover:bg-red-50 w-full" onClick={() => updateStatus(booking.id, 'cancelled')}>
                          <XCircle className="h-4 w-4 mr-1" /> Odmítnout
                        </Button>
                      </>
                    )}
                    
                    {booking.status === 'confirmed' && (
                      <div className="flex items-center justify-center gap-1 text-green-600 font-medium h-9 bg-green-50 rounded">
                        <CheckCircle className="h-4 w-4" /> Potvrzeno
                      </div>
                    )}

                    {booking.status === 'cancelled' && (
                      <div className="flex items-center justify-center gap-1 text-red-500 font-medium h-9 bg-red-50 rounded">
                        <XCircle className="h-4 w-4" /> Zrušeno
                      </div>
                    )}
                  </div>

                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}