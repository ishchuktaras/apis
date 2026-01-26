'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Plus, Trash2, Edit2, Clock, Banknote } from 'lucide-react'
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

interface Service {
  id: string
  title: string
  price: number
  duration_minutes: number
  description?: string
  is_active?: boolean // Přidáno pro typovou kontrolu
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
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Načteme pouze AKTIVNÍ služby
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true) 
        .order('title')

      if (error) throw error
      setServices(data || [])
    } catch (error: unknown) {
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
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const serviceData = {
        title: newService.title,
        price: parseInt(newService.price),
        duration_minutes: parseInt(newService.duration),
        description: newService.description,
        user_id: user.id,
        is_active: true // Při vytvoření/editaci je vždy aktivní
      }

      let error
      
      if (editingId) {
        // Update
        const { error: updateError } = await supabase
          .from('services')
          .update(serviceData)
          .eq('id', editingId)
        error = updateError
      } else {
        // Insert
        const { error: insertError } = await supabase
          .from('services')
          .insert(serviceData)
        error = insertError
      }

      if (error) throw error

      toast.success(editingId ? 'Služba upravena' : 'Služba přidána')
      setIsDialogOpen(false)
      resetForm()
      fetchServices()

    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Neznámá chyba'
      toast.error('Chyba: ' + msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  // UPRAVENÁ FUNKCE PRO "MAZÁNÍ" (ARCHIVACI)
  const handleDelete = async (id: string) => {
    if (!confirm('Opravdu chcete tuto službu odstranit z nabídky? (Historie rezervací zůstane zachována)')) return

    try {
      // Místo DELETE děláme UPDATE is_active = false
      const { error } = await supabase
        .from('services')
        .update({ is_active: false })
        .eq('id', id)

      if (error) throw error

      toast.success("Služba byla odstraněna z nabídky")
      // Odebereme ji lokálně ze seznamu
      setServices(services.filter(s => s.id !== id))
      
    } catch (error: unknown) {
      console.error(error)
      const msg = error instanceof Error ? error.message : 'Neznámá chyba'
      toast.error("Chyba při odstraňování: " + msg)
    }
  }

  const startEdit = (service: Service) => {
    setNewService({
      title: service.title,
      price: service.price.toString(),
      duration: service.duration_minutes.toString(),
      description: service.description || ''
    })
    setEditingId(service.id)
    setIsDialogOpen(true)
  }

  const resetForm = () => {
    setNewService({ title: '', price: '', duration: '30', description: '' })
    setEditingId(null)
  }

  if (loading) return <div className="p-8 text-center">Načítám služby...</div>

  return (
    <div className="space-y-6 pb-20">
      <div className="flex justify-between items-center">
        <div>
            <h1 className="text-3xl font-bold text-slate-800">Služby</h1>
            <p className="text-slate-500">Správa nabízených služeb a ceníku</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if(!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90 text-white">
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
                <Button type="submit" disabled={isSubmitting}>
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
                    <CardTitle className="text-lg font-semibold">{service.title}</CardTitle>
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
                        <Clock className="h-3 w-3" /> {service.duration_minutes} min
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