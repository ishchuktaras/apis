"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CalendarDays, Loader2, User, Clock } from 'lucide-react'
import { format } from 'date-fns'
import { cs } from 'date-fns/locale'

interface Booking {
  id: string
  startTime: string
  endTime: string
  status: string
  client: { fullName: string }
  service: { name: string; durationMin: number }
}

export default function CalendarPage() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchBookings()
  }, [])

  const fetchBookings = async () => {
    try {
      const res = await fetch('/api/bookings')
      if (!res.ok) throw new Error('Selhalo načítání')
      const data = await res.json()
      setBookings(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return (
    <div className="flex h-screen items-center justify-center">
      <Loader2 className="animate-spin text-[#F4C430] h-10 w-10" />
    </div>
  )

  return (
    <div className="max-w-6xl mx-auto space-y-6 p-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Přehled rezervací</h1>
          <p className="text-slate-500 text-sm">Aktuálně evidujete {bookings.length} termínů.</p>
        </div>
        <CalendarDays className="h-8 w-8 text-[#F4C430]" />
      </div>

      <div className="grid gap-4">
        {bookings.length === 0 ? (
          <Card className="py-20 text-center border-dashed">
            <p className="text-slate-400 italic">Zatím žádné rezervace v kalendáři.</p>
          </Card>
        ) : (
          bookings.map((booking) => (
            <Card key={booking.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="bg-slate-100 p-3 rounded-lg text-center min-w-[80px]">
                    <span className="block text-xs font-bold text-slate-500 uppercase">
                      {format(new Date(booking.startTime), 'EEE', { locale: cs })}
                    </span>
                    <span className="block text-lg font-bold text-slate-900">
                      {format(new Date(booking.startTime), 'd. M.')}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900">{booking.client.fullName}</h3>
                    <p className="text-sm text-slate-500 flex items-center gap-1">
                      <Clock className="h-3 w-3" /> 
                      {format(new Date(booking.startTime), 'HH:mm')} ({booking.service.name})
                    </p>
                  </div>
                </div>
                <div className="text-right px-4">
                  <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                    booking.status === 'CONFIRMED' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                  }`}>
                    {booking.status}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}