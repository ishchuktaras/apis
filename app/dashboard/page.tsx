'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { TrendingUp, Users, Calendar, ArrowUpRight, ExternalLink, Copy } from 'lucide-react'
import Link from 'next/link'

export default function DashboardOverview() {
  const [stats, setStats] = useState({
    todayRevenue: 0,
    todayBookings: 0,
    upcomingBookings: 0
  })
  const [salonSlug, setSalonSlug] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [userName, setUserName] = useState('')

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // 1. Získání jména a slugu salonu
      const { data: profile } = await supabase
        .from('profiles')
        .select('salon_name, slug')
        .eq('id', user.id)
        .single()
      
      if (profile) {
        setUserName(profile.salon_name || 'Salone')
        setSalonSlug(profile.slug)
      }

      // 2. Datumy
      const todayStr = new Date().toISOString().split('T')[0]

      // 3. Dotaz na DNEŠNÍ rezervace (včetně ceny služby)
      const { data: todayData } = await supabase
        .from('bookings')
        .select(`
          *,
          services ( price )
        `)
        .eq('salon_id', user.id)
        .eq('booking_date', todayStr)
        .neq('status', 'cancelled') // Počítáme jen aktivní

      // Výpočet tržby
      let revenue = 0
      todayData?.forEach((booking: any) => {
        if (booking.services?.price) {
          revenue += booking.services.price
        }
      })

      // 4. Dotaz na BUDOUCÍ rezervace (od zítřka)
      const { count: upcomingCount } = await supabase
        .from('bookings')
        .select('*', { count: 'exact', head: true })
        .eq('salon_id', user.id)
        .gt('booking_date', todayStr)
        .neq('status', 'cancelled')

      setStats({
        todayRevenue: revenue,
        todayBookings: todayData?.length || 0,
        upcomingBookings: upcomingCount || 0
      })

    } catch (error) {
      console.error('Chyba dashboardu:', error)
    } finally {
      setLoading(false)
    }
  }

  const copyLink = () => {
    if (salonSlug) {
      const url = `${window.location.origin}/${salonSlug}`
      navigator.clipboard.writeText(url)
      alert('Odkaz zkopírován: ' + url)
    }
  }

  return (
    <div className="space-y-8">
      {/* HLAVIČKA */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Vítejte, {userName} 👋</h1>
          <p className="text-slate-500">Zde je přehled vašeho dnešního dne.</p>
        </div>
        <div className="flex gap-2">
          {salonSlug && (
            <Button variant="outline" onClick={copyLink}>
              <Copy className="mr-2 h-4 w-4" /> Sdílet odkaz
            </Button>
          )}
          <Link href="/dashboard/calendar">
            <Button className="bg-slate-900 text-white hover:bg-slate-800">
              <Calendar className="mr-2 h-4 w-4" /> Kalendář
            </Button>
          </Link>
        </div>
      </div>

      {/* KARTY STATISTIK */}
      <div className="grid gap-4 md:grid-cols-3">
        
        {/* Karta 1: Dnešní tržba */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">
              Dnešní tržba (odhad)
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? '...' : `${stats.todayRevenue} Kč`}
            </div>
            <p className="text-xs text-slate-500">
              z {stats.todayBookings} rezervací dnes
            </p>
          </CardContent>
        </Card>

        {/* Karta 2: Dnešní klienti */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">
              Dnešní klienti
            </CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? '...' : stats.todayBookings}
            </div>
            <p className="text-xs text-slate-500">
              Termíny naplánované na dnes
            </p>
          </CardContent>
        </Card>

        {/* Karta 3: Budoucí rezervace */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">
              Nadcházející
            </CardTitle>
            <Calendar className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? '...' : stats.upcomingBookings}
            </div>
            <p className="text-xs text-slate-500">
              Rezervace od zítřka dále
            </p>
          </CardContent>
        </Card>
      </div>

      {/* RYCHLÝ PŘÍSTUP K WEBU */}
      {salonSlug ? (
        <Card className="bg-slate-50 border-dashed border-2">
          <CardContent className="flex flex-col md:flex-row items-center justify-between p-6 gap-4">
            <div>
              <h3 className="font-semibold text-lg text-slate-900">Váš web je online! 🚀</h3>
              <p className="text-slate-600 text-sm">
                Klienti se mohou objednávat na adrese: <span className="font-mono bg-white px-1 py-0.5 rounded border">salonio.cz/{salonSlug}</span>
              </p>
            </div>
            <Link href={`/${salonSlug}`} target="_blank">
              <Button variant="default">
                Otevřít můj web <ExternalLink className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-yellow-50 border-yellow-200 border-2">
          <CardContent className="flex items-center justify-between p-6">
            <div>
              <h3 className="font-semibold text-lg text-yellow-800">Nemáte nastavenou adresu! ⚠️</h3>
              <p className="text-yellow-700 text-sm">Pro spuštění webu musíte vyplnit profil.</p>
            </div>
            <Link href="/dashboard/settings">
              <Button variant="outline" className="border-yellow-600 text-yellow-800 hover:bg-yellow-100">
                Nastavit profil
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

    </div>
  )
}