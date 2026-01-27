"use client"

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Plus, Trash2, Edit2, Clock, Banknote, Loader2 } from 'lucide-react'
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

// Interface odpovídající Prisma modelu
interface Service {
  id: string
  name: string         // Změna z title na name
  price: number
  durationMin: number  // Změna z duration_minutes
  description?: string
  isActive: boolean    // Změna z is_active
}

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Form state
  const [newService, setNewService] = useState({
    title: '',
    price: '',
    duration: '30',
    description: ''
  })

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null)

  useEffect(() => {
    fetchServices()
  }, [])

  const fetchServices = async () => {
    try {
      const res = await fetch("/api/services")
      if (!res.ok) throw new Error("Chyba při načítání")
      
      const data = await res.json()
      // Filtrujeme jen aktivní služby (pokud API vrací i neaktivní)
      const activeServices = data.filter((s: Service) => s.isActive !== false)
      setServices(activeServices)
    } catch (error) {
      console.error('Chyba:', error)
      toast.error('Nepodařilo se načíst služby')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const payload = {
        name: newService.title, // API čeká "name"
        price: newService.price,
        durationMin: newService.duration, // API čeká "durationMin"
        description: newService.description,
        isActive: true
      }

      let res;
      
      if (editingId) {
        // UPDATE (PATCH)
        // Posíláme data ve formátu, který API očekává (title mapujeme na backendu nebo zde)
        res = await fetch(`/api/services/${editingId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                title: newService.title, // Posíláme title, backend si to přebere
                price: newService.price,
                duration: newService.duration,
                description: newService.description
            })
        })
      } else {
        // CREATE (POST)
        res = await fetch("/api/services", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                name: newService.title,
                price: newService.price,
                durationMin: newService.duration,
                description: newService.description
            })
        })
      }

      if (!res.ok) throw new Error("Chyba při ukládání")

      toast.success(editingId ? 'Služba upravena' : 'Služba přidána')
      setIsDialogOpen(false)
      resetForm()
      fetchServices()

    } catch (error: Error | unknown) {
      const message = error instanceof Error ? error.message : 'Neznámá chyba'
      toast.error('Chyba: ' + message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Opravdu chcete tuto službu odstranit z nabídky?')) return

    try {
      // Soft delete přes PATCH
      const res = await fetch(`/api/services/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: false })
      })

      if (!res.ok) throw new Error("Chyba při mazání")

      toast.success("Služba byla odstraněna z nabídky")
      setServices(services.filter(s => s.id !== id))
      
    } catch (error: Error | unknown) {
      toast.error("Chyba při odstraňování")
    }
  }

  const startEdit = (service: Service) => {
    setNewService({
      title: service.name, // Prisma má "name"
      price: service.price.toString(),
      duration: service.durationMin.toString(), // Prisma má "durationMin"
      description: service.description || ''
    })
    setEditingId(service.id)
    setIsDialogOpen(true)
  }

  const resetForm = () => {
    setNewService({ title: '', price: '', duration: '30', description: '' })
    setEditingId(null)
  }

  if (loading) return <div className="p-8 text-center flex justify-center"><Loader2 className="animate-spin mr-2"/> Načítám služby...</div>

  return (
    <div className="space-y-6 pb-20">
      <div className="flex justify-between items-center">
        <div>
            <h1 className="text-3xl font-bold text-slate-800">Služby</h1>
            <p className="text-slate-500">Správa nabízených služeb a ceníku</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if(!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="bg-[#F4C430] hover:bg-[#d4a010] text-slate-900">
              <Plus className="h-4 w-4 mr-2" /> Nová služba
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingId ? 'Upravit službu' : 'Přidat novou službu'}</DialogTitle>
              <DialogDescription>
                Vyplňte detaily služby, kterou budou klienti vidět při rezervaci.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSave} className="space-y-4">
              <div className="space-y-2">
                <Label>Název služby</Label>
                <Input placeholder="Např. Pánský střih" value={newService.title} onChange={e => setNewService({...newService, title: e.target.value})} required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Cena (Kč)</Label>
                  <Input type="number" placeholder="450" value={newService.price} onChange={e => setNewService({...newService, price: e.target.value})} required />
                </div>
                <div className="space-y-2">
                  <Label>Délka (min)</Label>
                  <select 
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={newService.duration}
                    onChange={e => setNewService({...newService, duration: e.target.value})}
                  >
                    {[15, 30, 45, 60, 90, 120].map(m => (
                        <option key={m} value={m}>{m} min</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Popis (volitelné)</Label>
                <Input placeholder="Krátký popis..." value={newService.description} onChange={e => setNewService({...newService, description: e.target.value})} />
              </div>
              <DialogFooter>
                <Button type="submit" disabled={isSubmitting} className="bg-[#F4C430] hover:bg-[#d4a010] text-slate-900">
                    {isSubmitting ? 'Ukládám...' : 'Uložit'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {services.length === 0 ? (
            <div className="col-span-full text-center py-12 bg-white rounded-lg border border-dashed border-slate-300">
                <p className="text-slate-500">Zatím nemáte žádné služby. Přidejte první.</p>
            </div>
        ) : (
            services.map((service) => (
            <Card key={service.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                    <CardTitle className="text-lg font-semibold">{service.name}</CardTitle>
                    <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-900" onClick={() => startEdit(service)}>
                            <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-red-600" onClick={() => handleDelete(service.id)}>
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
                <CardDescription className="line-clamp-2 min-h-[20px]">
                    {service.description}
                </CardDescription>
                </CardHeader>
                <CardContent>
                <div className="flex items-center gap-4 text-sm text-slate-600">
                    <div className="flex items-center gap-1 bg-slate-100 px-2 py-1 rounded">
                        <Clock className="h-3 w-3" /> {service.durationMin} min
                    </div>
                    <div className="flex items-center gap-1 font-semibold text-slate-900">
                        <Banknote className="h-3 w-3" /> {service.price} Kč
                    </div>
                </div>
                </CardContent>
            </Card>
            ))
        )}
      </div>
    </div>
  )
}