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
    fetchBooking()
  }, [id])

  const fetchBooking = async () => {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          services ( title, duration_minutes ),
          profiles ( salon_name, slug )
        `)
        .eq('id', id)
        .single()

      if (error || !data) throw new Error('Rezervace nebyla nalezena.')
      setBooking(data)
      
      // Pokud už je zrušeno, nastavíme stav rovnou
      if (data.status === 'cancelled') {
        setCancelled(true)
      }

    } catch (err: any) {
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

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-50">Načítám...</div>

  if (error) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4">
      <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
      <h1 className="text-xl font-bold text-slate-800">Chyba</h1>
      <p className="text-slate-600">{error}</p>
    </div>
  )

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          {cancelled ? (
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <CalendarX className="h-8 w-8 text-red-600" />
            </div>
          ) : (
            <div className="mx-auto w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
              <CalendarX className="h-8 w-8 text-slate-600" />
            </div>
          )}
          
          <CardTitle className="text-2xl">
            {cancelled ? 'Rezervace zrušena' : 'Zrušit rezervaci?'}
          </CardTitle>
          <CardDescription>
            {booking.profiles?.salon_name}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="bg-slate-50 p-4 rounded-lg text-left text-sm space-y-2 border">
            <p><span className="font-semibold">Služba:</span> {booking.services?.title}</p>
            <p><span className="font-semibold">Datum:</span> {new Date(booking.booking_date).toLocaleDateString('cs-CZ')}</p>
            <p><span className="font-semibold">Čas:</span> {booking.start_time.slice(0,5)}</p>
            <p><span className="font-semibold">Klient:</span> {booking.customer_name}</p>
          </div>

          {cancelled ? (
            <div className="space-y-4">
              <p className="text-sm text-slate-600">Vaše rezervace byla úspěšně stornována. Děkujeme, že jste nám dali vědět.</p>
              <Link href={`/${booking.profiles?.slug}`}>
                <Button className="w-full bg-slate-900 text-white hover:bg-slate-800">
                  Zpět na stránku salonu
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-slate-600">
                Opravdu se nemůžete dostavit? Kliknutím níže uvolníte termín pro někoho jiného.
              </p>
              <Button 
                variant="destructive" 
                className="w-full bg-red-600 hover:bg-red-700 text-white"
                onClick={handleCancel}
              >
                Potvrdit zrušení
              </Button>
              <Link href={`/${booking.profiles?.slug}`}>
                <Button variant="outline" className="w-full mt-2">
                  <ArrowLeft className="mr-2 h-4 w-4" /> Ne, chci si termín ponechat
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}