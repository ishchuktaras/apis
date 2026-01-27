"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  Calendar,
  Users,
  Settings,
  LogOut,
  Scissors,
  Store
} from "lucide-react"
import { signOut, useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"

const routes = [
  {
    label: "Přehled",
    icon: LayoutDashboard,
    href: "/dashboard",
    color: "text-sky-500",
  },
  {
    label: "Kalendář",
    icon: Calendar,
    href: "/dashboard/calendar",
    color: "text-violet-500",
  },
  {
    label: "Klienti",
    icon: Users,
    href: "/dashboard/clients",
    color: "text-pink-700",
  },
  {
    label: "Služby",
    icon: Scissors,
    href: "/dashboard/services",
    color: "text-orange-700",
  },
  {
    label: "Nastavení",
    icon: Settings,
    href: "/dashboard/settings",
  },
]

export default function Sidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()

  return (
    <div className="space-y-4 py-4 flex flex-col h-full bg-[#111827] text-white">
      <div className="px-3 py-2 flex-1">
        <Link href="/dashboard" className="flex items-center pl-3 mb-14">
          <div className="relative w-8 h-8 mr-4">
            <Store className="w-8 h-8 text-[#F4C430]" />
          </div>
          <h1 className="text-2xl font-bold">
            APIS
          </h1>
        </Link>
        <div className="space-y-1">
          {routes.map((route) => (
            <Link
              key={route.href}
              href={route.href}
              className={cn(
                "text-sm group flex p-3 w-full justify-start font-medium cursor-pointer hover:text-white hover:bg-white/10 rounded-lg transition",
                pathname === route.href ? "text-white bg-white/10" : "text-zinc-400"
              )}
            >
              <div className="flex items-center flex-1">
                <route.icon className={cn("h-5 w-5 mr-3", route.color)} />
                {route.label}
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Spodní sekce s uživatelem a odhlášením */}
      <div className="px-3 py-2 border-t border-white/10">
        <div className="mb-4 px-3">
          <p className="text-sm font-medium text-white">
            {session?.user?.name || "Uživatel"}
          </p>
          <p className="text-xs text-zinc-400 truncate">
            {session?.user?.email}
          </p>
        </div>
        
        <Button 
          variant="ghost" 
          className="w-full justify-start text-zinc-400 hover:text-white hover:bg-white/10"
          onClick={() => signOut({ callbackUrl: "/login" })}
        >
          <LogOut className="h-5 w-5 mr-3" />
          Odhlásit se
        </Button>
      </div>
    </div>
  )
}