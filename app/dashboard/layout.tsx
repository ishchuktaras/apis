import Link from 'next/link'
import { Scissors, Calendar, Settings, LogOut, User } from 'lucide-react'
import { Button } from "@/components/ui/button"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex h-screen bg-slate-50">
      
      {/* BOČNÍ MENU (SIDEBAR) */}
      <aside className="w-64 bg-white border-r hidden md:flex flex-col">
        <div className="p-6 border-b">
          <h1 className="text-xl font-bold flex items-center gap-2 text-slate-800">
            <Scissors className="h-6 w-6 text-primary" />
            Salonio <span className="text-xs font-normal text-slate-500 bg-slate-100 px-2 py-1 rounded">ADMIN</span>
          </h1>
        </div>
        
        <nav className="flex-1 p-4 space-y-1">
          <Link href="/dashboard/services">
            <Button variant="ghost" className="w-full justify-start gap-2 mb-1">
              <Scissors className="h-4 w-4" />
              Služby
            </Button>
          </Link>
          
          <Link href="/dashboard/calendar">
             {/* Zatím neexistuje, ale připravíme si odkaz */}
            <Button variant="ghost" className="w-full justify-start gap-2 mb-1 text-slate-400">
              <Calendar className="h-4 w-4" />
              Kalendář (Brzy)
            </Button>
          </Link>

          <Link href="/dashboard/settings">
            <Button variant="ghost" className="w-full justify-start gap-2 text-slate-400">
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
              <p className="font-medium text-slate-700">Můj Salon</p>
              <p className="text-xs text-slate-500">Free Verze</p>
            </div>
          </div>
          
          {/* Tlačítko odhlášení - zatím jen přesměruje */}
          <Link href="/login">
            <Button variant="outline" className="w-full justify-start gap-2 text-red-600 hover:text-red-700 hover:bg-red-50">
              <LogOut className="h-4 w-4" />
              Odhlásit se
            </Button>
          </Link>
        </div>
      </aside>

      {/* HLAVNÍ OBSAH */}
      <main className="flex-1 overflow-y-auto p-8">
        {children}
      </main>

    </div>
  )
}