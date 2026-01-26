import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth" 
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
// ✅ PŘIDÁNO: Importujeme LucideIcon pro správné typování ikon
import { Users, Calendar, Banknote, TrendingUp, Clock, ArrowRight, Store, LucideIcon } from 'lucide-react'
import Link from 'next/link'
import { Button } from "@/components/ui/button"

export default async function DashboardPage() {
  // 1. Ověření přihlášení na serveru
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/login")
  }

  // 2. Načtení uživatele a salonu (Tenant)
  const user = await prisma.user.findUnique({
    where: { email: session.user?.email || "" },
    include: { tenant: true }
  })

  if (!user) {
    redirect("/api/auth/signout")
  }

  // 3. Výpočet statistik přes Prisma
  const now = new Date()
  
  // A. Dnešní rezervace
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
  
  const bookingsTodayCount = await prisma.booking.count({
    where: {
      tenantId: user.tenantId,
      startTime: {
        gte: startOfDay,
        lt: endOfDay
      },
      status: { not: 'CANCELLED' }
    }
  })

  // B. Tržby za tento měsíc
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  
  const monthBookings = await prisma.booking.findMany({
    where: {
      tenantId: user.tenantId,
      startTime: { gte: startOfMonth },
      status: { not: 'CANCELLED' }
    },
    include: { service: true } 
  })

  // Výpočet sumy a unikátních klientů
  let revenueMonth = 0
  const uniqueClients = new Set<string>()

  // Použití for...of pro správné typování
  for (const booking of monthBookings) {
    if (booking.service?.price) {
      revenueMonth += Number(booking.service.price)
    }
    if (booking.clientId) {
      uniqueClients.add(booking.clientId)
    }
  }

  // Průměrná hodnota objednávky
  const avgOrderValue = monthBookings.length > 0 
    ? Math.round(revenueMonth / monthBookings.length) 
    : 0


  // --- PŘÍPRAVA DAT PRO UI ---
  const displayName = user.fullName || session.user?.name || 'Administrátor'
  const salonName = user.tenant.name
  const salonInitial = salonName ? salonName[0].toUpperCase() : 'A'

  return (
    <div className="space-y-8 pb-10">
      {/* Welcome Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-5">
          {/* Avatar / Logo */}
          <div className="relative">
            {user.tenant.logoUrl ? (
                <img src={user.tenant.logoUrl} alt="Salon" className="w-16 h-16 rounded-2xl object-cover border-2 border-white shadow-md" />
            ) : (
                <div className="w-16 h-16 bg-gradient-to-br from-[#F4C430] to-orange-400 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-md shadow-orange-200">
                  {salonInitial}
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
              <span>{salonName}</span>
              <span className="text-slate-300">•</span>
              <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-xs uppercase tracking-wide">
                {user.role === 'OWNER' ? 'Majitel' : 'Zaměstnanec'}
              </span>
            </div>
          </div>
        </div>

        <div className="hidden md:block text-right">
          <p className="text-sm text-slate-400 font-medium uppercase tracking-wider mb-1">Dnešní datum</p>
          <p className="text-lg font-bold text-slate-700">
            {now.toLocaleDateString('cs-CZ', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard 
          title="Dnešní rezervace" 
          value={bookingsTodayCount.toString()} 
          icon={Calendar} 
          trend="Dnes"
          color="bg-blue-50 text-blue-600"
        />
        <StatsCard 
          title="Tržba tento měsíc" 
          value={`${revenueMonth.toLocaleString()} Kč`} 
          icon={Banknote} 
          trend="Od 1. dne v měsíci"
          color="bg-green-50 text-green-600"
        />
        <StatsCard 
          title="Aktivní klienti" 
          value={uniqueClients.size.toString()} 
          icon={Users} 
          trend="Unikátní tento měsíc"
          color="bg-purple-50 text-purple-600"
        />
        <StatsCard 
          title="Průměrná hodnota" 
          value={`${avgOrderValue} Kč`} 
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
            {bookingsTodayCount === 0 ? (
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
                 <p className="text-slate-600">Máte <strong>{bookingsTodayCount}</strong> rezervací na dnešek. Podívejte se do kalendáře pro detaily.</p>
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

// --- POMOCNÉ KOMPONENTY ---

// ✅ DEFINICE ROZHRANÍ (Interface) místo 'any'
interface StatsCardProps {
  title: string;
  value: string;
  icon: LucideIcon; // Toto je přesný typ pro ikonu z knihovny lucide-react
  trend: string;
  color: string;
}

function StatsCard({ title, value, icon: Icon, trend, color }: StatsCardProps) {
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