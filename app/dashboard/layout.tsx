'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Scissors, Calendar, Settings, LogOut, User, Users, LayoutDashboard } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const [salonLogo, setSalonLogo] = useState<string | null>(null)
  const [salonName, setSalonName] = useState<string | null>(null)

  // Načtení loga při startu
  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from('profiles')
        .select('logo_url, salon_name')
        .eq('id', user.id)
        .single()
      
      if (data) {
        setSalonLogo(data.logo_url)
        setSalonName(data.salon_name)
      }
    }
    fetchProfile()
  }, [])

  // Funkce pro odhlášení
  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) {
      toast.error('Chyba při odhlašování')
    } else {
      toast.success('Byli jste odhlášeni')
      router.push('/login')
      router.refresh() // Vynutit obnovení, aby middleware zareagoval
    }
  }

  return (
    <div className="flex h-screen bg-slate-50">
      
      {/* BOČNÍ MENU (SIDEBAR) */}
      <aside className="w-64 bg-white border-r hidden md:flex flex-col">
        <div className="p-6 border-b">
          <Link href="/dashboard" className="flex items-center gap-3 group">
            {/* LOGO SALONU nebo Ikona */}
            {salonLogo ? (
              <img 
                src={salonLogo} 
                alt="Logo" 
                className="h-10 w-10 rounded-full object-cover border border-slate-200 group-hover:opacity-80 transition-opacity"
              />
            ) : (
              <div className="bg-slate-900 text-white p-2 rounded-lg group-hover:bg-slate-800 transition-colors">
                <Scissors className="h-6 w-6" />
              </div>
            )}
            
            <div className="leading-tight">
              <h1 className="font-bold text-slate-800 truncate w-32">
                {salonName || 'APIS'}
              </h1>
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Admin Panel
              </span>
            </div>
          </Link>
        </div>
        
        <nav className="flex-1 p-4 space-y-1">
          <Link href="/dashboard">
            <Button variant="ghost" className="w-full justify-start gap-2 mb-1">
              <LayoutDashboard className="h-4 w-4" />
              Přehled
            </Button>
          </Link>

          <Link href="/dashboard/calendar">
            <Button variant="ghost" className="w-full justify-start gap-2 mb-1">
              <Calendar className="h-4 w-4" />
              Kalendář
            </Button>
          </Link>

          <Link href="/dashboard/customers">
            <Button variant="ghost" className="w-full justify-start gap-2 mb-1">
              <Users className="h-4 w-4" />
              Zákazníci
            </Button>
          </Link>

          <Link href="/dashboard/services">
            <Button variant="ghost" className="w-full justify-start gap-2 mb-1">
              <Scissors className="h-4 w-4" />
              Služby
            </Button>
          </Link>

          <Link href="/dashboard/settings">
            <Button variant="ghost" className="w-full justify-start gap-2 text-slate-500">
              <Settings className="h-4 w-4" />
              Nastavení
            </Button>
          </Link>
        </nav>

        <div className="p-4 border-t bg-slate-50">
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center">
              <User className="h-4 w-4 text-slate-500" />
            </div>
            <div className="text-sm">
              <p className="font-medium text-slate-700 truncate w-32">{salonName || 'Můj Salon'}</p>
              <p className="text-xs text-slate-500">Free Verze</p>
            </div>
          </div>
          
          {/* OPRAVENÉ TLAČÍTKO ODHLÁŠENÍ */}
          <Button 
            onClick={handleSignOut} 
            variant="outline" 
            className="w-full justify-start gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <LogOut className="h-4 w-4" />
            Odhlásit se
          </Button>
        </div>
      </aside>

      {/* HLAVNÍ OBSAH */}
      <main className="flex-1 overflow-y-auto p-8">
        {children}
      </main>

    </div>
  )
}