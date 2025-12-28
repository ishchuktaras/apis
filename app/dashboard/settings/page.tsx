'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Clock, AlertCircle, RefreshCw } from 'lucide-react'

const DAYS = ['Neděle', 'Pondělí', 'Úterý', 'Středa', 'Čtvrtek', 'Pátek', 'Sobota']

interface BusinessHour {
  id: string
  day_of_week: number
  open_time: string
  close_time: string
  is_closed: boolean
}

export default function SettingsPage() {
  const [hours, setHours] = useState<BusinessHour[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchHours()
  }, [])

  // 1. Načtení dat
  const fetchHours = async () => {
    try {
      setLoading(true)
      console.log('Načítám otevírací dobu...')
      
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        console.error('Uživatel není přihlášen')
        return
      }

      const { data, error } = await supabase
        .from('business_hours')
        .select('*')
        .order('day_of_week', { ascending: true })

      if (error) throw error
      
      console.log('Načteno záznamů:', data?.length)
      setHours(data || [])

    } catch (error: any) {
      console.error('Chyba při načítání:', error.message)
      alert('Chyba při načítání dat: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  // 2. Inicializace (GENERATOR) - ZDE BYLA CHYBA
  const initializeHours = async () => {
    try {
      setLoading(true)
      console.log('Startuji generování...')

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        alert('Chyba: Nejste přihlášen.')
        return
      }

      const defaultHours = Array.from({ length: 7 }, (_, i) => ({
        user_id: user.id,
        day_of_week: i,
        open_time: '09:00',
        close_time: '17:00',
        is_closed: i === 0 || i === 6 // Víkend zavřeno
      }))

      const { error } = await supabase.from('business_hours').insert(defaultHours)
      
      if (error) {
        console.error('Chyba SQL:', error)
        throw error
      }

      console.log('Úspěšně vygenerováno. Obnovuji data...')
      await fetchHours() // Počkáme na načtení

    } catch (error: any) {
      console.error('Chyba při generování:', error)
      alert('Nepodařilo se vygenerovat hodiny: ' + error.message)
    } finally {
      // TOTO ZARUČÍ, ŽE SE TLAČÍTKO ODBLOKUJE
      setLoading(false)
    }
  }

  // 3. Uložení změn
  const handleSave = async (id: string, updates: Partial<BusinessHour>) => {
    setSaving(true)
    setHours(prev => prev.map(h => h.id === id ? { ...h, ...updates } : h))

    const { error } = await supabase
      .from('business_hours')
      .update(updates)
      .eq('id', id)

    if (error) {
      console.error('Chyba update:', error)
      alert('Chyba ukládání')
    }
    setSaving(false)
  }

  if (loading && hours.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
         <RefreshCw className="h-8 w-8 animate-spin text-slate-400" />
         <p className="text-slate-500">Načítám nastavení...</p>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold text-slate-800">Nastavení Salonu</h1>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" /> Otevírací doba
          </CardTitle>
          <CardDescription>Nastavte, kdy si mohou klienti rezervovat termíny.</CardDescription>
        </CardHeader>
        <CardContent>
          
          {hours.length === 0 ? (
            <div className="text-center py-8">
              <AlertCircle className="h-10 w-10 text-yellow-500 mx-auto mb-2" />
              <p className="text-slate-600 mb-4">Zatím nemáte nastavenou otevírací dobu.</p>
              <Button onClick={initializeHours} disabled={loading}>
                {loading ? 'Pracuji...' : 'Vygenerovat standardní (Po-Pá 9-17)'}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {[...hours.slice(1), hours[0]].map((day) => (
                <div key={day.id} className={`flex items-center justify-between p-3 rounded-lg border ${day.is_closed ? 'bg-slate-50 border-slate-100' : 'bg-white border-slate-200'}`}>
                  
                  <div className="w-24 font-medium text-slate-700">
                    {DAYS[day.day_of_week]}
                  </div>

                  <div className="flex items-center gap-2">
                    <Label htmlFor={`closed-${day.id}`} className="text-xs text-slate-500">
                      {day.is_closed ? 'Zavřeno' : 'Otevřeno'}
                    </Label>
                    <Switch 
                      id={`closed-${day.id}`}
                      checked={!day.is_closed}
                      onCheckedChange={(checked: boolean) => handleSave(day.id, { is_closed: !checked })}
                    />
                  </div>

                  <div className={`flex items-center gap-2 transition-opacity ${day.is_closed ? 'opacity-20 pointer-events-none' : 'opacity-100'}`}>
                    <Input 
                      type="time" 
                      className="w-24" 
                      value={day.open_time?.slice(0,5)} 
                      onChange={(e) => handleSave(day.id, { open_time: e.target.value })}
                    />
                    <span className="text-slate-400">-</span>
                    <Input 
                      type="time" 
                      className="w-24"
                      value={day.close_time?.slice(0,5)}
                      onChange={(e) => handleSave(day.id, { close_time: e.target.value })}
                    />
                  </div>

                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}