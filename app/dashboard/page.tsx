// app/dashboard/page.tsx

'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Calendar, Banknote, TrendingUp, Clock, ArrowRight, Store } from 'lucide-react'
import Link from 'next/link'
import { Button } from "@/components/ui/button"

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  
  // Statistiky
  const [stats, setStats] = useState({
    bookingsToday: 0,
    revenueMonth: 0,
    newClients: 0,
    avgOrderValue: 0
  })

  useEffect(() => {
    const initData = async () => {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      
      if(user) {
        await Promise.all([
          fetchProfile(user.id),
          fetchRealStats(user.id)
        ])
      }
      setLoading(false)
    }
    initData()
  }, [])

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase
      .from('profiles')
      // DŮLEŽITÁ OPRAVA: Přidáno full_name do selectu, jinak se nenačte
      .select('full_name, salon_name, logo_url')
      .eq('id', userId)
      .single()
    
    if (data) setProfile(data)
  }

  const fetchRealStats = async (userId: string) => {
    const now = new Date()
    const todayStr = now.toISOString().split('T')[0]
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]

    // 1. Dnešní rezervace (Počet)
    // Nejdřív musíme zjistit salon_id (což je id uživatele v profiles)
    // Předpokládáme, že userId == salon_id pro MVP (owner)
    
    const { count: bookingsToday } = await supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .eq('salon_id', userId)
      .eq('booking_date', todayStr)
      .neq('status', 'cancelled')

    // 2. Rezervace tento měsíc (pro tržby a klienty)
    // Musíme načíst i cenu služby. Jelikož 'bookings' má jen 'service_id', musíme udělat join.
    // Supabase join syntaxe: select('*, services(price)')
    const { data: monthBookings } = await supabase
      .from('bookings')
      .select('customer_email, service_id, services(price)')
      .eq('salon_id', userId)
      .gte('booking_date', firstDayOfMonth)
      .neq('status', 'cancelled')

    let revenue = 0
    const uniqueClients = new Set()

    if (monthBookings) {
      monthBookings.forEach((booking: any) => {
        // Tržba (pokud služba existuje a má cenu)
        if (booking.services?.price) {
          revenue += booking.services.price
        }
        // Unikátní klienti
        if (booking.customer_email) {
          uniqueClients.add(booking.customer_email)
        }
      })
    }

    const bookingsCount = monthBookings?.length || 0
    const avgValue = bookingsCount > 0 ? Math.round(revenue / bookingsCount) : 0

    setStats({
      bookingsToday: bookingsToday || 0,
      revenueMonth: revenue,
      newClients: uniqueClients.size,
      avgOrderValue: avgValue
    })
  }

  // OPRAVA JMÉNA:
  // 1. Priorita: Jméno z DB profilu (Taras Ishchuk)
  // 2. Priorita: Metadata z auth (pokud existují)
  // 3. Fallback: 'Administrátor'
  const displayName = profile?.full_name || user?.user_metadata?.full_name || 'Administrátor'

  return (
    <div className="space-y-8 pb-10">
      {/* Welcome Section - UX/UI Awesome Upgrade */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-5">
          {/* Avatar / Logo */}
          <div className="relative">
            {profile?.logo_url ? (
                <img src={profile.logo_url} alt="Salon" className="w-16 h-16 rounded-2xl object-cover border-2 border-white shadow-md" />
            ) : (
                <div className="w-16 h-16 bg-gradient-to-br from-[#F4C430] to-orange-400 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-md shadow-orange-200">
                  {profile?.salon_name?.[0] || 'A'}
                </div>
            )}
            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 border-2 border-white rounded-full" title="Online"></div>
          </div>
          
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              Vítejte zpět, {displayName} 
              <span className="text-xl">👋</span>
            </h1>
            <div className="flex items-center gap-2 text-slate-500 mt-1 text-sm font-medium">
              <Store className="h-4 w-4" />
              <span>{profile?.salon_name || 'Můj Salon'}</span>
              <span className="text-slate-300">•</span>
              <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-xs uppercase tracking-wide">Majitel</span>
            </div>
          </div>
        </div>

        <div className="hidden md:block text-right">
          <p className="text-sm text-slate-400 font-medium uppercase tracking-wider mb-1">Dnešní datum</p>
          <p className="text-lg font-bold text-slate-700">
            {new Date().toLocaleDateString('cs-CZ', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard 
          title="Dnešní rezervace" 
          value={loading ? "..." : stats.bookingsToday.toString()} 
          icon={Calendar} 
          trend="Dnes"
          color="bg-blue-50 text-blue-600"
        />
        <StatsCard 
          title="Tržba tento měsíc" 
          value={loading ? "..." : `${stats.revenueMonth.toLocaleString()} Kč`} 
          icon={Banknote} 
          trend="Od 1. dne v měsíci"
          color="bg-green-50 text-green-600"
        />
        <StatsCard 
          title="Aktivní klienti" 
          value={loading ? "..." : stats.newClients.toString()} 
          icon={Users} 
          trend="Unikátní tento měsíc"
          color="bg-purple-50 text-purple-600"
        />
        <StatsCard 
          title="Průměrná hodnota" 
          value={loading ? "..." : `${stats.avgOrderValue} Kč`} 
          icon={TrendingUp} 
          trend="Na jednu rezervaci"
          color="bg-orange-50 text-orange-600"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Quick Actions & Empty State */}
        <Card className="lg:col-span-2 border-slate-200 shadow-sm overflow-hidden">
          <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="h-5 w-5 text-slate-400" /> Nadcházející aktivita
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {stats.bookingsToday === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="bg-slate-50 p-4 rounded-full shadow-inner mb-4">
                  <Calendar className="h-8 w-8 text-slate-300" />
                </div>
                <h3 className="font-semibold text-slate-900 text-lg">Dnes zatím klid</h3>
                <p className="text-slate-500 max-w-xs mx-auto mt-2 mb-6 text-sm">
                  Pro dnešní den nemáte žádné další rezervace. Je ideální čas na marketing nebo úpravu služeb.
                </p>
                <div className="flex gap-3">
                  <Link href="/dashboard/calendar">
                    <Button variant="outline">Otevřít kalendář</Button>
                  </Link>
                  <Link href="/dashboard/services">
                    <Button>Spravovat služby</Button>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="p-6">
                 {/* Zde by byl seznam rezervací, pro MVP zatím placeholder */}
                 <p className="text-slate-600">Máte <strong>{stats.bookingsToday}</strong> rezervací na dnešek. Podívejte se do kalendáře pro detaily.</p>
                 <Link href="/dashboard/calendar" className="text-primary font-medium hover:underline mt-2 inline-block">Přejít do kalendáře &rarr;</Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Links */}
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-6 rounded-2xl text-white shadow-xl shadow-slate-200">
            <h3 className="font-bold text-lg mb-1">Rychlé akce</h3>
            <p className="text-slate-400 text-sm mb-6">Co potřebujete udělat?</p>
            
            <div className="space-y-3">
              <QuickActionLink href="/dashboard/calendar" label="Otevřít kalendář" />
              <QuickActionLink href="/dashboard/services" label="Přidat novou službu" />
              <QuickActionLink href="/dashboard/settings" label="Upravit otevírací dobu" />
              <QuickActionLink href="/dashboard/team" label="Spravovat tým" />
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}

function StatsCard({ title, value, icon: Icon, trend, color }: any) {
  return (
    <Card className="border-slate-200 shadow-sm hover:shadow-md transition-all duration-300 group">
      <CardContent className="p-6">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm font-medium text-slate-500 group-hover:text-slate-700 transition-colors">{title}</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-2 tracking-tight">{value}</h3>
          </div>
          <div className={`p-3 rounded-xl ${color} bg-opacity-10 group-hover:scale-110 transition-transform duration-300`}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
        <div className="mt-4 flex items-center text-xs font-medium text-slate-400">
          {trend}
        </div>
      </CardContent>
    </Card>
  )
}

function QuickActionLink({ href, label }: { href: string, label: string }) {
  return (
    <Link href={href} className="flex items-center justify-between p-3 bg-white/5 hover:bg-white/10 rounded-lg transition-all group border border-white/5 hover:border-white/20">
      <span className="text-sm font-medium text-slate-200 group-hover:text-white">{label}</span>
      <ArrowRight className="h-4 w-4 text-slate-500 group-hover:text-[#F4C430] transition-colors"/>
    </Link>
  )
}