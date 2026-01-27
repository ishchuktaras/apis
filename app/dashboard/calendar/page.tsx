"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CalendarDays, Loader2 } from 'lucide-react'

export default function CalendarPage() {
  return (
    <div className="max-w-6xl mx-auto space-y-6 p-6">
      <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">Kalendář rezervací</h1>
      </div>

      <Card className="bg-white border-slate-200 shadow-sm">
        <CardContent className="flex flex-col items-center justify-center py-20 text-center">
          <div className="bg-yellow-50 p-4 rounded-full mb-4">
            <CalendarDays className="h-10 w-10 text-[#F4C430]" />
          </div>
          <h2 className="text-xl font-semibold text-slate-900">Probíhá aktualizace systému</h2>
          <p className="text-slate-500 max-w-sm mt-2">
            Vaše data z původního systému byla bezpečně migrována. Právě pracujeme na novém zobrazení kalendáře připojeném k vašemu VPS serveru.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}