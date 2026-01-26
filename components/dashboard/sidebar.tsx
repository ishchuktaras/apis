'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { 
  LayoutDashboard, 
  Calendar, 
  Scissors, 
  Users, 
  Settings, 
  LogOut, 
  Menu,
  X,
  Store,
  UserCircle
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'

const MENU_ITEMS = [
  { name: 'Přehled', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Kalendář', href: '/dashboard/calendar', icon: Calendar },
  { name: 'Služby', href: '/dashboard/services', icon: Scissors },
  { name: 'Tým', href: '/dashboard/team', icon: UserCircle }, // Nová položka
  { name: 'Klienti', href: '/dashboard/customers', icon: Users },
  { name: 'Nastavení', href: '/dashboard/settings', icon: Settings },
]

interface SidebarProfile {
  salon_name: string
  logo_url: string | null
  slug: string
}

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [profile, setProfile] = useState<SidebarProfile | null>(null)

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from('profiles')
        .select('salon_name, logo_url, slug')
        .eq('id', user.id)
        .single()
      
      if (data) setProfile(data)
    }

    fetchProfile()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <>
      {/* Mobile Trigger */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-[#1A1A1A] border-b border-white/10 z-50 flex items-center justify-between px-4 text-white">
        <div className="flex items-center gap-2 font-bold text-lg">
           {profile?.logo_url ? (
              <img src={profile.logo_url} alt="Logo" className="w-8 h-8 rounded-full object-cover border border-white/20" />
           ) : (
              <div className="w-8 h-8 bg-[#F4C430] rounded-lg flex items-center justify-center text-[#1A1A1A] font-bold">A</div>
           )}
           <span className="truncate max-w-[150px]">{profile?.salon_name || 'APIS'}</span>
        </div>
        <Button variant="ghost" size="icon" onClick={() => setIsOpen(!isOpen)} className="text-white hover:bg-white/10">
          {isOpen ? <X /> : <Menu />}
        </Button>
      </div>

      {/* Sidebar Container */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 w-72 bg-[#1A1A1A] text-gray-300 transform transition-transform duration-300 ease-in-out border-r border-white/5
        md:translate-x-0 md:static md:h-screen
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex flex-col h-full">
          
          {/* Brand Area */}
          <div className="h-20 flex items-center px-6 border-b border-white/5">
            <div className="flex items-center gap-3">
               {profile?.logo_url ? (
                 <img 
                   src={profile.logo_url} 
                   alt={profile.salon_name} 
                   className="w-10 h-10 rounded-lg object-cover border-2 border-white/10 shadow-lg"
                 />
               ) : (
                 <div className="w-10 h-10 bg-gradient-to-br from-[#F4C430] to-yellow-600 rounded-lg flex items-center justify-center text-[#1A1A1A] font-bold text-xl shadow-lg shadow-yellow-500/20">
                   {profile?.salon_name?.[0] || 'A'}
                 </div>
               )}
               <div className="flex flex-col overflow-hidden">
                 <span className="font-bold text-white tracking-wide truncate">{profile?.salon_name || 'Načítám...'}</span>
                 <span className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">Salon Admin</span>
               </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 py-8 px-4 space-y-1.5 overflow-y-auto custom-scrollbar">
            <p className="px-4 text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">Menu</p>
            
            {MENU_ITEMS.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link 
                  key={item.href} 
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className={`
                    group flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200
                    ${isActive 
                      ? 'bg-[#F4C430] text-[#1A1A1A] shadow-lg shadow-yellow-500/20 translate-x-1 font-bold' 
                      : 'text-gray-400 hover:text-white hover:bg-white/5'}
                  `}
                >
                  <item.icon className={`h-5 w-5 transition-colors ${isActive ? 'text-[#1A1A1A]' : 'text-gray-500 group-hover:text-white'}`} />
                  {item.name}
                </Link>
              )
            })}

            {/* Public Web Link */}
            <div className="mt-8 pt-6 border-t border-white/5">
              <p className="px-4 text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">Váš Web</p>
              <a 
                href={profile?.slug ? `/${profile.slug}` : '/'} 
                target="_blank" 
                rel="noreferrer"
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-gray-400 hover:text-[#F4C430] hover:bg-[#F4C430]/10 transition-all border border-dashed border-gray-700 hover:border-[#F4C430]/50"
              >
                <Store className="h-5 w-5" />
                Otevřít prezentaci
              </a>
            </div>

          </nav>

          {/* User / Logout */}
          <div className="p-4 border-t border-white/5 bg-[#151515]">
            <button 
              onClick={handleLogout}
              className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-medium text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors"
            >
              <LogOut className="h-5 w-5" />
              Odhlásit se
            </button>
          </div>
        </div>
      </aside>

      {/* Overlay pro mobil */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/80 z-30 md:hidden backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  )
}