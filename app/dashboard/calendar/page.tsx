'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  Calendar as CalendarIcon, 
  Clock, 
  User, 
  CheckCircle2, 
  AlertCircle, 
  Scissors, 
  MapPin, 
  X, 
  Loader2,
  ChevronLeft,
  ChevronRight,
  LayoutList,
  LayoutGrid,
  CalendarDays
} from 'lucide-react'
import { toast } from "sonner"

// --- KONFIGURACE SUPABASE (REST API) ---
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'

async function supabaseFetch(endpoint: string, options: RequestInit = {}) {
  const headers = {
    'apikey': SUPABASE_KEY,
    'Authorization': `Bearer ${SUPABASE_KEY}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation',
    ...options.headers,
  }

  const response = await fetch(`${SUPABASE_URL}/rest/v1/${endpoint}`, { ...options, headers })
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: response.statusText }))
    throw new Error(errorData.message || `Supabase Error: ${response.status}`)
  }
  
  return response.json()
}

// --- POMOCNÁ FUNKCE PRO FORMÁTOVÁNÍ DATA (LOCAL TIME) ---
// Tato funkce řeší problém s posunem data o den zpět
const formatDateForInput = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// --- TYPY ---

export type AppointmentStatus = 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';
type CalendarView = 'day' | 'week' | 'month' | 'year';

interface Appointment {
  id: string;
  clientName: string;
  serviceName: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  fullDate: Date; // Objekt data pro snazší manipulaci
  duration: number;
  status: AppointmentStatus;
  hasArrived: boolean;
  price: number;
}

// --- MODÁLNÍ OKNO DETAILU ---
interface AppointmentDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointment: Appointment;
  onSave: (updatedAppointment: Appointment) => void;
}

function AppointmentDetailModal({ isOpen, onClose, appointment, onSave }: AppointmentDetailModalProps) {
  const [status, setStatus] = useState<AppointmentStatus>(appointment.status);
  const [hasArrived, setHasArrived] = useState<boolean>(appointment.hasArrived);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setStatus(appointment.status);
    setHasArrived(appointment.hasArrived);
  }, [appointment, isOpen]);

  if (!isOpen) return null;

  const handleSave = async () => {
    setIsSaving(true);
    try {
        await onSave({ ...appointment, status, hasArrived });
    } catch (e) {
        console.error(e)
    } finally {
        setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200 font-sans">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden border border-slate-100">
        <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-slate-50/50">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Detail rezervace</h2>
            <p className="text-sm text-slate-500">ID: {appointment.id.split('-')[0]}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-500"><X size={20} /></button>
        </div>
        <div className="p-6 space-y-6">
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="p-2 bg-yellow-100 rounded-lg text-yellow-700"><User size={20} /></div>
              <div>
                <p className="text-sm font-medium text-slate-500">Klient</p>
                <p className="font-semibold text-slate-900">{appointment.clientName}</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg text-blue-700"><CalendarIcon size={20} /></div>
              <div>
                <p className="text-sm font-medium text-slate-500">Termín</p>
                <p className="font-medium text-slate-900">{new Date(appointment.date).toLocaleDateString('cs-CZ')} v {appointment.time}</p>
                <p className="text-sm text-slate-600 mt-1">{appointment.serviceName} ({appointment.duration} min)</p>
              </div>
            </div>
          </div>
          <hr className="border-slate-100" />
          <div className={`p-4 rounded-lg border transition-colors ${hasArrived ? 'bg-green-50 border-green-200' : 'bg-slate-50 border-slate-200'}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-full ${hasArrived ? 'bg-green-100 text-green-600' : 'bg-slate-200 text-slate-500'}`}><MapPin size={20} /></div>
                <div>
                  <p className="font-medium text-slate-900">Dorazil zákazník?</p>
                  <p className="text-xs text-slate-500">{hasArrived ? 'Ano' : 'Ne'}</p>
                </div>
              </div>
              <button onClick={() => setHasArrived(!hasArrived)} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${hasArrived ? 'bg-green-500' : 'bg-slate-300'}`}>
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${hasArrived ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 block">Stav</label>
            <select value={status} onChange={(e) => setStatus(e.target.value as AppointmentStatus)} className="w-full p-2.5 bg-white border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-[#F4C430]">
              <option value="PENDING">⏳ Čeká</option>
              <option value="CONFIRMED">✅ Potvrzeno</option>
              <option value="COMPLETED">🏁 Hotovo</option>
              <option value="NO_SHOW">🚫 Nedostavil se</option>
              <option value="CANCELLED">❌ Zrušeno</option>
            </select>
          </div>
        </div>
        <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3">
          <button onClick={onClose} disabled={isSaving} className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg">Zrušit</button>
          <button onClick={handleSave} disabled={isSaving} className="px-4 py-2 text-sm font-medium text-slate-900 bg-[#F4C430] rounded-lg hover:bg-[#E0B120] flex items-center gap-2">
             {isSaving && <Loader2 className="animate-spin h-4 w-4" />} Uložit
          </button>
        </div>
      </div>
    </div>
  );
}

// --- HLAVNÍ STRÁNKA KALENDÁŘE ---

export default function CalendarPage() {
  const [bookings, setBookings] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedBooking, setSelectedBooking] = useState<Appointment | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  
  // Stavy pro navigaci a pohled
  const [currentDate, setCurrentDate] = useState<Date>(new Date())
  const [view, setView] = useState<CalendarView>('day')

  // --- LOGIKA DATUMŮ ---
  
  const getRange = () => {
    const start = new Date(currentDate)
    const end = new Date(currentDate)

    if (view === 'day') {
      start.setHours(0, 0, 0, 0)
      end.setHours(23, 59, 59, 999)
    } else if (view === 'week') {
      const day = start.getDay()
      const diff = start.getDate() - day + (day === 0 ? -6 : 1) // Pondělí
      start.setDate(diff)
      start.setHours(0,0,0,0)
      end.setDate(diff + 6)
      end.setHours(23,59,59,999)
    } else if (view === 'month') {
      start.setDate(1)
      start.setHours(0,0,0,0)
      end.setMonth(start.getMonth() + 1)
      end.setDate(0)
      end.setHours(23,59,59,999)
    } else if (view === 'year') {
      start.setMonth(0, 1)
      start.setHours(0,0,0,0)
      end.setMonth(11, 31)
      end.setHours(23,59,59,999)
    }
    return { start, end }
  }

  const navigate = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate)
    const modifier = direction === 'next' ? 1 : -1
    
    if (view === 'day') newDate.setDate(newDate.getDate() + modifier)
    else if (view === 'week') newDate.setDate(newDate.getDate() + (modifier * 7))
    else if (view === 'month') newDate.setMonth(newDate.getMonth() + modifier)
    else if (view === 'year') newDate.setFullYear(newDate.getFullYear() + modifier)
    
    setCurrentDate(newDate)
  }

  // --- FETCHING DAT ---

  useEffect(() => {
    fetchBookings()
  }, [currentDate, view])

  const fetchBookings = async () => {
    try {
      setLoading(true)
      const { start, end } = getRange()
      
      // Formátování data pro DB (YYYY-MM-DD - lokální čas)
      const startStr = formatDateForInput(start);
      const endStr = formatDateForInput(end);

      const queryString = new URLSearchParams({
        select: '*,services:service_id(title,price,duration_minutes)',
        booking_date: `gte.${startStr}`,
      }).toString() + `&booking_date=lte.${endStr}&order=booking_date.asc,start_time.asc`

      const data = await supabaseFetch(`bookings?${queryString}`)

      if (data) {
          const mapped: Appointment[] = data.map((item: any) => {
              const fullDateStr = `${item.booking_date}T${item.start_time}`
              const d = new Date(fullDateStr)
              
              return {
                  id: item.id,
                  clientName: item.client_name,
                  serviceName: item.services?.title || 'Neznámá služba',
                  date: item.booking_date,
                  time: item.start_time.slice(0, 5), // Oříznutí sekund "09:00"
                  fullDate: d,
                  duration: item.services?.duration_minutes || 0,
                  price: item.services?.price || 0,
                  status: item.status,
                  hasArrived: item.has_arrived
              }
          })
          setBookings(mapped)
      }
    } catch (error: any) {
      console.error('Fetch error:', error)
      toast.error('Nepodařilo se načíst data: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveBooking = async (updated: Appointment) => {
    try {
        await supabaseFetch(`bookings?id=eq.${updated.id}`, {
            method: 'PATCH',
            body: JSON.stringify({ status: updated.status, has_arrived: updated.hasArrived })
        });
        toast.success("Uloženo")
        setIsModalOpen(false)
        fetchBookings() 
    } catch (error: any) {
        toast.error("Chyba při ukládání: " + error.message)
    }
  }

  // --- RENDEROVÁNÍ POHLEDŮ ---

  const renderHeader = () => {
    const range = getRange()
    let label = ''
    if (view === 'day') label = currentDate.toLocaleDateString('cs-CZ', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    else if (view === 'week') label = `${range.start.toLocaleDateString('cs-CZ', { day: 'numeric', month: 'numeric' })} - ${range.end.toLocaleDateString('cs-CZ', { day: 'numeric', month: 'numeric', year: 'numeric' })}`
    else if (view === 'month') label = currentDate.toLocaleDateString('cs-CZ', { month: 'long', year: 'numeric' })
    else label = currentDate.getFullYear().toString()

    return (
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="flex bg-slate-100 p-1 rounded-lg">
            <button onClick={() => setView('day')} className={`px-3 py-1 text-sm rounded-md transition-all ${view === 'day' ? 'bg-white shadow text-slate-900 font-bold' : 'text-slate-500 hover:text-slate-700'}`}>Den</button>
            <button onClick={() => setView('week')} className={`px-3 py-1 text-sm rounded-md transition-all ${view === 'week' ? 'bg-white shadow text-slate-900 font-bold' : 'text-slate-500 hover:text-slate-700'}`}>Týden</button>
            <button onClick={() => setView('month')} className={`px-3 py-1 text-sm rounded-md transition-all ${view === 'month' ? 'bg-white shadow text-slate-900 font-bold' : 'text-slate-500 hover:text-slate-700'}`}>Měsíc</button>
            <button onClick={() => setView('year')} className={`px-3 py-1 text-sm rounded-md transition-all ${view === 'year' ? 'bg-white shadow text-slate-900 font-bold' : 'text-slate-500 hover:text-slate-700'}`}>Rok</button>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button onClick={() => navigate('prev')} className="p-2 hover:bg-slate-100 rounded-full border border-slate-200"><ChevronLeft size={18}/></button>
          <div className="text-lg font-bold text-slate-800 min-w-[200px] text-center capitalize">{label}</div>
          <button onClick={() => navigate('next')} className="p-2 hover:bg-slate-100 rounded-full border border-slate-200"><ChevronRight size={18}/></button>
        </div>

        <div className="flex items-center gap-2">
           <input 
             type="date" 
             className="border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#F4C430]"
             // OPRAVENO: Používáme formatDateForInput místo toISOString()
             value={formatDateForInput(currentDate)}
             onChange={(e) => {
                if(e.target.value) {
                    setCurrentDate(new Date(e.target.value));
                }
             }}
           />
           <button onClick={() => setCurrentDate(new Date())} className="text-sm font-medium text-[#F4C430] hover:underline px-2">Dnes</button>
        </div>
      </div>
    )
  }

  const renderStats = () => {
    const total = bookings.length
    const confirmed = bookings.filter(b => b.status === 'CONFIRMED').length
    const revenue = bookings.reduce((sum, b) => b.status === 'COMPLETED' ? sum + b.price : sum, 0)

    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card className="bg-white border-slate-200 shadow-sm">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-slate-500">Celkem rezervací</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{total}</div></CardContent>
        </Card>
        <Card className="bg-white border-slate-200 shadow-sm">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-slate-500">Potvrzeno</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold text-blue-600">{confirmed}</div></CardContent>
        </Card>
        <Card className="bg-white border-slate-200 shadow-sm">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-slate-500">Odhad tržby (Hotovo)</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold text-green-600">{revenue} Kč</div></CardContent>
        </Card>
      </div>
    )
  }

  // --- KOMPONENTY PRO JEDNOTLIVÉ POHLEDY ---

  // 1. DAY VIEW & WEEK VIEW (List style)
  const BookingCard = ({ b }: { b: Appointment }) => (
    <div 
      onClick={() => { setSelectedBooking(b); setIsModalOpen(true); }}
      className={`
        cursor-pointer bg-white border border-slate-200 rounded-lg p-3 shadow-sm hover:shadow-md transition-all mb-2 flex justify-between items-center
        border-l-4 ${b.status === 'COMPLETED' ? 'border-l-green-500' : b.status === 'CANCELLED' ? 'border-l-red-500' : 'border-l-blue-500'}
        ${b.hasArrived && b.status !== 'COMPLETED' ? 'bg-green-50/50' : ''}
      `}
    >
      <div className="flex items-center gap-3">
        <div className="font-mono font-bold text-slate-700 bg-slate-100 px-2 py-1 rounded text-sm">{b.time}</div>
        <div>
          <div className="font-bold text-slate-900 text-sm">{b.clientName}</div>
          <div className="text-xs text-slate-500 flex items-center gap-1"><Scissors size={10}/> {b.serviceName}</div>
        </div>
      </div>
      <div className="text-right">
         <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
            b.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
            b.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
            'bg-slate-100 text-slate-700'
         }`}>{b.status}</span>
      </div>
    </div>
  )

  const DayView = () => (
    <div className="space-y-2">
      {bookings.length === 0 ? <p className="text-center text-slate-400 py-10">Žádné rezervace pro tento den.</p> : 
       bookings.map(b => <BookingCard key={b.id} b={b} />)
      }
    </div>
  )

  const WeekView = () => {
    // Seskupit podle dní
    const days = []
    const start = getRange().start
    for (let i = 0; i < 7; i++) {
        const d = new Date(start)
        d.setDate(start.getDate() + i)
        const dayString = formatDateForInput(d); // Opraveno
        const dayBookings = bookings.filter(b => b.date === dayString)
        days.push({ date: d, items: dayBookings })
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
            {days.map((day, i) => (
                <div key={i} className="bg-slate-50 rounded-lg p-2 min-h-[200px] border border-slate-200">
                    <div className={`text-center mb-3 pb-2 border-b border-slate-200 ${day.date.toDateString() === new Date().toDateString() ? 'text-[#F4C430] font-bold' : 'text-slate-600'}`}>
                        <div className="text-xs uppercase">{day.date.toLocaleDateString('cs-CZ', { weekday: 'short' })}</div>
                        <div className="text-lg font-bold">{day.date.getDate()}</div>
                    </div>
                    <div>
                        {day.items.map(b => (
                            <div key={b.id} onClick={() => { setSelectedBooking(b); setIsModalOpen(true); }}
                                 className={`text-xs p-2 mb-2 rounded bg-white border cursor-pointer hover:shadow-sm truncate ${b.status === 'COMPLETED' ? 'border-green-300 bg-green-50' : 'border-slate-200'}`}>
                                <span className="font-bold mr-1">{b.time}</span> {b.clientName}
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    )
  }

  const MonthView = () => {
      // Zjednodušený měsíční pohled - mřížka dnů
      const start = getRange().start
      const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate()
      const firstDayIndex = (new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay() + 6) % 7 // Po=0
      
      const grid = []
      for(let i=0; i<firstDayIndex; i++) grid.push(null) // Empty slots
      for(let i=1; i<=daysInMonth; i++) grid.push(new Date(currentDate.getFullYear(), currentDate.getMonth(), i))

      return (
          <div className="grid grid-cols-7 gap-2">
              {['Po', 'Út', 'St', 'Čt', 'Pá', 'So', 'Ne'].map(d => <div key={d} className="text-center text-sm font-bold text-slate-400 py-2">{d}</div>)}
              {grid.map((d, i) => {
                  if (!d) return <div key={i} className="bg-transparent"></div>
                  const dayString = formatDateForInput(d); // Opraveno
                  const dayBookings = bookings.filter(b => b.date === dayString)
                  const isToday = d.toDateString() === new Date().toDateString()

                  return (
                      <div key={i} className={`min-h-[80px] border rounded-lg p-2 bg-white ${isToday ? 'border-[#F4C430] ring-1 ring-[#F4C430]' : 'border-slate-200'}`}>
                          <div className="text-right text-sm font-medium mb-1 text-slate-500">{d.getDate()}</div>
                          <div className="flex flex-wrap gap-1">
                              {dayBookings.map(b => (
                                  <div key={b.id} onClick={() => { setSelectedBooking(b); setIsModalOpen(true); }}
                                       className={`w-2 h-2 rounded-full cursor-pointer hover:scale-150 transition-transform ${b.status==='COMPLETED'?'bg-green-500':'bg-blue-500'}`} 
                                       title={`${b.time} - ${b.clientName}`}></div>
                              ))}
                          </div>
                          {dayBookings.length > 0 && <div className="text-[10px] text-slate-400 mt-1">{dayBookings.length} rez.</div>}
                      </div>
                  )
              })}
          </div>
      )
  }

  const YearView = () => {
      const months = Array.from({ length: 12 }, (_, i) => {
          const d = new Date(currentDate.getFullYear(), i, 1)
          const count = bookings.filter(b => new Date(b.date).getMonth() === i).length
          const revenue = bookings.filter(b => new Date(b.date).getMonth() === i && b.status === 'COMPLETED').reduce((acc, b) => acc + b.price, 0)
          return { name: d.toLocaleDateString('cs-CZ', { month: 'long' }), count, revenue }
      })

      return (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {months.map((m, i) => (
                  <div key={i} onClick={() => { setCurrentDate(new Date(currentDate.getFullYear(), i, 1)); setView('month'); }}
                       className="bg-white border border-slate-200 p-4 rounded-xl hover:border-[#F4C430] cursor-pointer transition-all hover:shadow-md">
                      <h3 className="font-bold text-lg capitalize text-slate-800">{m.name}</h3>
                      <div className="mt-2 space-y-1">
                          <div className="text-sm text-slate-500 flex justify-between"><span>Rezervací:</span> <span className="font-bold text-slate-900">{m.count}</span></div>
                          <div className="text-sm text-slate-500 flex justify-between"><span>Tržba:</span> <span className="font-bold text-green-600">{m.revenue} Kč</span></div>
                      </div>
                  </div>
              ))}
          </div>
      )
  }

  // --- RENDER ---

  if (loading && bookings.length === 0) return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="h-10 w-10 text-[#F4C430] animate-spin mb-4" />
        <p className="text-slate-500">Načítám kalendář...</p>
      </div>
  )

  return (
    <div className="max-w-6xl mx-auto space-y-6 font-sans p-6 pb-20">
      
      {renderHeader()}
      {renderStats()}

      <div className="bg-slate-50/50 p-1 rounded-2xl">
        {view === 'day' && <DayView />}
        {view === 'week' && <WeekView />}
        {view === 'month' && <MonthView />}
        {view === 'year' && <YearView />}
      </div>

      {selectedBooking && (
        <AppointmentDetailModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          appointment={selectedBooking}
          onSave={handleSaveBooking}
        />
      )}
    </div>
  )
}
