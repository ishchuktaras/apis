'use client'

import { useState, useEffect, use } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { CalendarX, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

interface PageProps {
  params: Promise<{ id: string }>
}

export default function CancelBookingPage({ params }: PageProps) {
  const { id } = use(params)
  
  const [booking, setBooking] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [cancelled, setCancelled] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (id) {
      fetchBooking()
    }
  }, [id])

  const fetchBooking = async () => {
    try {
      setLoading(true)
      
      // KROK 1: Načíst rezervaci a službu (vazba na služby je OK)
      // Odstranili jsme "profiles" ze selectu, abychom se vyhnuli chybě 400
      const { data: bookingData, error: bookingError } = await supabase
        .from('bookings')
        .select(`
          *,
          services ( title, duration_minutes )
        `)
        .eq('id', id)
        .maybeSingle()

      if (bookingError) throw bookingError
      if (!bookingData) throw new Error('Rezervace nebyla nalezena (neplatný odkaz).')

      // KROK 2: Načíst profil salonu zvlášť (podle salon_id z rezervace)
      const { data: profileData } = await supabase
        .from('profiles')
        .select('salon_name, slug')
        .eq('id', bookingData.salon_id)
        .maybeSingle()

      // Spojíme data dohromady pro UI
      const completeData = {
        ...bookingData,
        profiles: profileData
      }

      setBooking(completeData)
      
      if (bookingData.status === 'cancelled') {
        setCancelled(true)
      }

    } catch (err: any) {
      console.error('Chyba:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = async () => {
    if (!confirm('Opravdu chcete tuto rezervaci zrušit?')) return

    try {
      const { error } = await supabase
        .from('bookings')
        .update({ status: 'cancelled' })
        .eq('id', id)

      if (error) throw error
      setCancelled(true)
      
    } catch (err: any) {
      alert('Chyba: ' + err.message)
    }
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-500">Načítám informace...</div>

  if (error) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4">
      <div className="bg-white p-8 rounded-xl shadow-sm border max-w-md w-full text-center">
        <AlertCircle className="h-12 w-12 text-red-500 mb-4 mx-auto" />
        <h1 className="text-xl font-bold text-slate-800 mb-2">Chyba načítání</h1>
        <p className="text-slate-600 mb-6">{error}</p>
        <Link href="/">
          <Button variant="outline">Zpět na úvod</Button>
        </Link>
      </div>
    </div>
  )

  if (!booking) return null

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4">
      <Card className="w-full max-w-md text-center shadow-lg border-0">
        <CardHeader className="pb-2">
          {cancelled ? (
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <CalendarX className="h-8 w-8 text-red-600" />
            </div>
          ) : (
            <div className="mx-auto w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
              <CalendarX className="h-8 w-8 text-slate-600" />
            </div>
          )}
          
          <CardTitle className="text-2xl font-bold text-slate-900">
            {cancelled ? 'Rezervace zrušena' : 'Zrušit rezervaci?'}
          </CardTitle>
          <CardDescription className="text-lg">
            {booking.profiles?.salon_name || 'Neznámý salon'}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6 pt-4">
          <div className="bg-slate-50 p-5 rounded-xl text-left text-sm space-y-3 border border-slate-100">
            <div className="flex justify-between border-b border-slate-200 pb-2">
              <span className="text-slate-500">Služba:</span>
              <span className="font-semibold text-slate-900">{booking.services?.title}</span>
            </div>
            <div className="flex justify-between border-b border-slate-200 pb-2">
              <span className="text-slate-500">Datum:</span>
              <span className="font-semibold text-slate-900">
                {new Date(booking.booking_date).toLocaleDateString('cs-CZ')}
              </span>
            </div>
            <div className="flex justify-between border-b border-slate-200 pb-2">
              <span className="text-slate-500">Čas:</span>
              <span className="font-semibold text-slate-900">{booking.start_time.slice(0,5)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Klient:</span>
              <span className="font-semibold text-slate-900">{booking.customer_name}</span>
            </div>
          </div>

          {cancelled ? (
            <div className="space-y-4">
              <p className="text-sm text-slate-600">
                Vaše rezervace byla úspěšně stornována.
              </p>
              {booking.profiles?.slug && (
                <Link href={`/${booking.profiles.slug}`} className="block">
                  <Button className="w-full bg-slate-900 text-white hover:bg-slate-800 h-12">
                    Zpět na stránku salonu
                  </Button>
                </Link>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-slate-500 px-4">
                Pokud se nemůžete dostavit, klikněte na tlačítko níže.
              </p>
              <Button 
                variant="destructive" 
                className="w-full bg-red-600 hover:bg-red-700 text-white h-12 font-medium"
                onClick={handleCancel}
              >
                Potvrdit zrušení rezervace
              </Button>
              {booking.profiles?.slug && (
                <Link href={`/${booking.profiles.slug}`} className="block">
                  <Button variant="ghost" className="w-full text-slate-500 hover:text-slate-900 hover:bg-slate-100">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Ne, chci si termín ponechat
                  </Button>
                </Link>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}