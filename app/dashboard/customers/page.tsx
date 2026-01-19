'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { 
  Search, 
  Mail, 
  Phone, 
  Calendar, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  User,
  History
} from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

// Typy pro zpracování dat
interface Booking {
  id: string
  booking_date: string
  status: string
  customer_name: string
  customer_email: string
  customer_phone: string
  service_id: string
  services?: { title: string, price: number }
}

interface CustomerProfile {
  id: string 
  name: string
  email: string
  phone: string
  totalVisits: number
  totalSpent: number
  lastBooking: {
    date: string
    status: string
    serviceName: string
  } | null
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
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // 1. Načteme všechny rezervace včetně detailů služeb
      const { data: bookingsData, error } = await supabase
        .from('bookings')
        .select(`
          *,
          services ( title, price )
        `)
        .eq('salon_id', user.id)
        .order('booking_date', { ascending: false }) // Nejnovejší první

      if (error) throw error

      // 2. Agregace dat (Seskupení podle emailu)
      const customerMap = new Map<string, CustomerProfile>()

      bookingsData?.forEach((booking: any) => {
        const email = booking.customer_email
        if (!email) return // Skip pokud chybí email (identifikátor)

        if (!customerMap.has(email)) {
          // Inicializace nového klienta
          customerMap.set(email, {
            id: email,
            name: booking.customer_name || 'Neznámý',
            email: email,
            phone: booking.customer_phone || '',
            totalVisits: 0,
            totalSpent: 0,
            lastBooking: null
          })
        }

        const customer = customerMap.get(email)!
        
        // Statistiky
        if (booking.status !== 'cancelled') {
          customer.totalVisits += 1
          customer.totalSpent += booking.services?.price || 0
        }

        // Poslední rezervace (díky řazení z DB je první nalezená ta nejnovější)
        if (!customer.lastBooking) {
          customer.lastBooking = {
            date: booking.booking_date,
            status: booking.status,
            serviceName: booking.services?.title || 'Služba smazána'
          }
        }
      })

      // Převod Mapy na pole
      setCustomers(Array.from(customerMap.values()))

    } catch (err) {
      console.error('Chyba při načítání klientů:', err)
    } finally {
      setLoading(false)
    }
  }

  // Filtrace
  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.phone.includes(searchTerm)
  )

  // Pomocná funkce pro status návštěvy
  const getVisitStatus = (dateStr: string, status: string) => {
    const bookingDate = new Date(dateStr)
    const today = new Date()
    // Reset času pro porovnání pouze data
    today.setHours(0,0,0,0)
    bookingDate.setHours(0,0,0,0)

    if (status === 'cancelled') {
      return { label: 'Zrušeno', icon: XCircle, color: 'text-red-500 bg-red-50' }
    }
    if (bookingDate < today) {
      return { label: 'Proběhlo', icon: CheckCircle2, color: 'text-green-600 bg-green-50' }
    }
    if (bookingDate.getTime() === today.getTime()) {
      return { label: 'Dnes', icon: Clock, color: 'text-blue-600 bg-blue-50' }
    }
    return { label: 'Naplánováno', icon: Calendar, color: 'text-amber-600 bg-amber-50' }
  }

  if (loading) return <div className="p-10 text-center animate-pulse">Načítám databázi klientů...</div>

  return (
    <div className="space-y-8 pb-20">
      
      {/* Header & Search */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Databáze Klientů</h1>
          <p className="text-slate-500 mt-1">
            Celkem evidujeme <strong>{customers.length}</strong> unikátních klientů.
          </p>
        </div>
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
          <Input 
            placeholder="Hledat jméno, email, telefon..." 
            className="pl-10"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Grid Klientů */}
      <div className="grid grid-cols-1 gap-4">
        {filteredCustomers.length === 0 ? (
           <div className="text-center py-16 bg-slate-50 rounded-xl border border-dashed border-slate-300">
             <User className="h-12 w-12 mx-auto text-slate-300 mb-3" />
             <p className="text-slate-500">Žádní klienti nenalezeni.</p>
           </div>
        ) : (
          filteredCustomers.map((client) => {
            const lastBookingInfo = client.lastBooking 
              ? getVisitStatus(client.lastBooking.date, client.lastBooking.status)
              : null

            return (
              <Card key={client.id} className="hover:shadow-md transition-shadow duration-200">
                <CardContent className="p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                  
                  {/* Info o klientovi */}
                  <div className="flex items-center gap-4 min-w-[250px]">
                    <Avatar className="h-12 w-12 border-2 border-white shadow-sm">
                      <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${client.name}`} />
                      <AvatarFallback>{client.name.substring(0,2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-bold text-lg text-slate-900">{client.name}</h3>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 text-sm text-slate-500 mt-0.5">
                        <a href={`mailto:${client.email}`} className="flex items-center hover:text-primary transition-colors">
                          <Mail className="h-3 w-3 mr-1.5" /> {client.email}
                        </a>
                        {client.phone && (
                          <a href={`tel:${client.phone}`} className="flex items-center hover:text-primary transition-colors">
                            <Phone className="h-3 w-3 mr-1.5" /> {client.phone}
                          </a>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Statistiky */}
                  <div className="flex items-center gap-6 md:border-l md:border-r border-slate-100 md:px-8">
                    <div className="text-center">
                      <p className="text-xs text-slate-400 uppercase font-bold tracking-wider">Návštěv</p>
                      <p className="text-xl font-bold text-slate-700">{client.totalVisits}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-slate-400 uppercase font-bold tracking-wider">Útrata</p>
                      <p className="text-xl font-bold text-slate-700">{client.totalSpent.toLocaleString()} Kč</p>
                    </div>
                  </div>

                  {/* Poslední / Nejbližší akce */}
                  <div className="flex-1 w-full md:w-auto">
                    <p className="text-xs text-slate-400 uppercase font-bold tracking-wider mb-2">Poslední aktivita</p>
                    {client.lastBooking && lastBookingInfo ? (
                      <div className="flex items-center justify-between bg-slate-50 p-3 rounded-lg border border-slate-100">
                        <div>
                          <div className="font-medium text-slate-900 flex items-center gap-2">
                            {new Date(client.lastBooking.date).toLocaleDateString('cs-CZ')}
                            <span className={`text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1 ${lastBookingInfo.color}`}>
                              <lastBookingInfo.icon className="h-3 w-3" />
                              {lastBookingInfo.label}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 mt-1">{client.lastBooking.serviceName}</p>
                        </div>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <History className="h-4 w-4 text-slate-400" />
                        </Button>
                      </div>
                    ) : (
                      <p className="text-sm text-slate-400 italic">Žádná historie</p>
                    )}
                  </div>

                </CardContent>
              </Card>
            )
          })
        )}
      </div>
    </div>
  )
}
