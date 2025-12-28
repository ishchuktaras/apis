'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Users, Search, Mail, Phone, Calendar, TrendingUp } from 'lucide-react'

// Definice typu pro agregovaného zákazníka
interface CustomerProfile {
  name: string
  email: string
  phone: string
  totalVisits: number
  totalSpent: number
  lastVisit: string
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<CustomerProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    fetchCustomers()
  }, [])

  const fetchCustomers = async () => {
    try {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Načteme všechny rezervace (včetně ceny služeb)
      const { data: bookings, error } = await supabase
        .from('bookings')
        .select(`
          customer_name,
          customer_email,
          customer_phone,
          booking_date,
          status,
          services ( price )
        `)
        .eq('salon_id', user.id)
        .neq('status', 'cancelled') // Ignorujeme zrušené pro výpočet tržeb
        .order('booking_date', { ascending: false }) // Od nejnovějších

      if (error) throw error

      // --- LOGIKA AGREGACE (Seskupení podle emailu) ---
      const customerMap = new Map<string, CustomerProfile>()

      bookings?.forEach((booking: any) => {
        const email = booking.customer_email
        const price = booking.services?.price || 0

        if (customerMap.has(email)) {
          // Zákazník už existuje -> aktualizujeme statistiky
          const existing = customerMap.get(email)!
          existing.totalVisits += 1
          existing.totalSpent += price
          // Datum neměníme, protože iterujeme od nejnovějších, takže první záznam je poslední návštěva
        } else {
          // Nový zákazník -> vytvoříme profil
          customerMap.set(email, {
            name: booking.customer_name,
            email: booking.customer_email,
            phone: booking.customer_phone,
            totalVisits: 1,
            totalSpent: price,
            lastVisit: booking.booking_date
          })
        }
      })

      // Převedeme Mapu na pole hodnot
      setCustomers(Array.from(customerMap.values()))

    } catch (error) {
      console.error('Chyba CRM:', error)
    } finally {
      setLoading(false)
    }
  }

  // Filtrace podle vyhledávání
  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.phone.includes(searchTerm) ||
    c.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) return <div className="p-8 text-center text-slate-500">Načítám databázi klientů...</div>

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      
      {/* Hlavička a Vyhledávání */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-2">
            <Users className="h-8 w-8" /> Databáze Klientů
          </h1>
          <p className="text-slate-500">
            Celkem evidováno {customers.length} unikátních zákazníků.
          </p>
        </div>
        
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
          <Input 
            placeholder="Hledat jméno, email, telefon..." 
            className="pl-9 bg-white"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Tabulka Klientů (Card Layout) */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b">
                <tr>
                  <th className="px-6 py-4 font-medium">Jméno Klienta</th>
                  <th className="px-6 py-4 font-medium">Kontakt</th>
                  <th className="px-6 py-4 font-medium text-center">Návštěvy</th>
                  <th className="px-6 py-4 font-medium text-right">Celkem utraceno</th>
                  <th className="px-6 py-4 font-medium text-right">Poslední návštěva</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCustomers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                      Žádní zákazníci nebyli nalezeni.
                    </td>
                  </tr>
                ) : (
                  filteredCustomers.map((customer, index) => (
                    <tr key={index} className="bg-white hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 font-medium text-slate-900">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold">
                            {customer.name.charAt(0).toUpperCase()}
                          </div>
                          {customer.name}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-500 space-y-1">
                        <div className="flex items-center gap-2">
                          <Mail className="h-3 w-3" /> {customer.email}
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone className="h-3 w-3" /> {customer.phone}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {customer.totalVisits}x
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right font-bold text-slate-900">
                        {customer.totalSpent} Kč
                      </td>
                      <td className="px-6 py-4 text-right text-slate-500">
                        {new Date(customer.lastVisit).toLocaleDateString('cs-CZ')}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Rychlý tip pro uživatele */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex gap-3 text-sm text-blue-800">
        <TrendingUp className="h-5 w-5 shrink-0" />
        <div>
          <strong>Tip pro růst:</strong> Podívejte se na klienty s největší útratou a nabídněte jim věrnostní slevu při příští návštěvě.
        </div>
      </div>

    </div>
  )
}