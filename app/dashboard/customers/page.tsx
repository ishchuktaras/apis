'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { 
  Search, Mail, Phone, Calendar, 
  CheckCircle2, XCircle, Clock, User, History, Loader2
} from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

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
      setLoading(true)
      const res = await fetch('/api/customers')
      if (!res.ok) throw new Error('Nepodařilo se načíst klienty')
      const data = await res.json()
      setCustomers(data)
    } catch (err) {
      console.error('Chyba:', err)
    } finally {
      setLoading(false)
    }
  }

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.phone.includes(searchTerm)
  )

  const getVisitStatus = (dateStr: string, status: string) => {
    const bookingDate = new Date(dateStr)
    const today = new Date()
    today.setHours(0,0,0,0)
    bookingDate.setHours(0,0,0,0)

    if (status === 'CANCELLED') {
      return { label: 'Zrušeno', icon: XCircle, color: 'text-red-500 bg-red-50' }
    }
    if (bookingDate < today) {
      return { label: 'Proběhlo', icon: CheckCircle2, color: 'text-green-600 bg-green-50' }
    }
    return { label: 'Naplánováno', icon: Calendar, color: 'text-amber-600 bg-amber-50' }
  }

  if (loading) return (
    <div className="p-20 text-center flex flex-col items-center">
      <Loader2 className="h-10 w-10 animate-spin text-[#F4C430] mb-4" />
      <p className="text-slate-500">Načítám databázi klientů...</p>
    </div>
  )

  return (
    <div className="space-y-8 pb-20 font-sans">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Databáze Klientů</h1>
          <p className="text-slate-500 mt-1">Celkem evidujeme <strong>{customers.length}</strong> unikátních klientů.</p>
        </div>
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
          <Input 
            placeholder="Hledat..." 
            className="pl-10 focus-visible:ring-[#F4C430]"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

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
              <Card key={client.id} className="hover:shadow-md transition-shadow duration-200 border-slate-200">
                <CardContent className="p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                  <div className="flex items-center gap-4 min-w-[250px]">
                    <Avatar className="h-12 w-12 border-2 border-white shadow-sm">
                      <AvatarFallback className="bg-[#F4C430] text-slate-900 font-bold">
                        {client.name.substring(0,2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-bold text-lg text-slate-900">{client.name}</h3>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 text-sm text-slate-500 mt-0.5">
                        <span className="flex items-center"><Mail className="h-3 w-3 mr-1.5" /> {client.email || 'Bez emailu'}</span>
                        <span className="flex items-center"><Phone className="h-3 w-3 mr-1.5" /> {client.phone}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 md:border-l md:border-r border-slate-100 md:px-8">
                    <div className="text-center">
                      <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Návštěv</p>
                      <p className="text-xl font-bold text-slate-700">{client.totalVisits}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Útrata</p>
                      <p className="text-xl font-bold text-slate-700">{client.totalSpent.toLocaleString()} Kč</p>
                    </div>
                  </div>

                  <div className="flex-1 w-full md:w-auto">
                    {client.lastBooking && lastBookingInfo ? (
                      <div className="flex items-center justify-between bg-slate-50 p-3 rounded-lg border border-slate-100">
                        <div>
                          <div className="font-medium text-slate-900 flex items-center gap-2 text-sm">
                            {new Date(client.lastBooking.date).toLocaleDateString('cs-CZ')}
                            <span className={`text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1 font-bold ${lastBookingInfo.color}`}>
                              <lastBookingInfo.icon className="h-3 w-3" />
                              {lastBookingInfo.label}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 mt-1">{client.lastBooking.serviceName}</p>
                        </div>
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