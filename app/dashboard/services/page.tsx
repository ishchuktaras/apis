'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Trash2, Plus, Clock, Banknote } from 'lucide-react' // Ikony

// Definice typu pro Službu (podle SQL tabulky)
interface Service {
  id: string
  title: string
  description: string | null
  price: number
  duration_minutes: number
  currency: string
}

export default function ServicesPage() {
  const router = useRouter()
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  // Formulářová data
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    duration: '30'
  })

  // 1. Načtení služeb při startu
  useEffect(() => {
    fetchServices()
  }, [])

  const fetchServices = async () => {
    try {
      setLoading(true)
      // Získáme aktuálního uživatele
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/login')
        return
      }

      // Stáhneme služby z databáze
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setServices(data || [])

    } catch (error) {
      console.error('Chyba při načítání:', error)
    } finally {
      setLoading(false)
    }
  }

  // 2. Přidání nové služby
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { error } = await supabase.from('services').insert({
        user_id: user.id,
        title: formData.title,
        description: formData.description,
        price: Number(formData.price),
        duration_minutes: Number(formData.duration),
        currency: 'CZK'
      })

      if (error) throw error

      // Reset formuláře a obnovení seznamu
      setFormData({ title: '', description: '', price: '', duration: '30' })
      fetchServices()

    } catch (error: any) {
      alert('Chyba při ukládání: ' + error.message)
    } finally {
      setSubmitting(false)
    }
  }

  // 3. Smazání služby
  const handleDelete = async (id: string) => {
    if (!confirm('Opravdu chcete tuto službu smazat?')) return

    try {
      const { error } = await supabase.from('services').delete().eq('id', id)
      if (error) throw error
      
      // Odstraníme položku lokálně (rychlejší než nový fetch)
      setServices(services.filter(service => service.id !== id))
    } catch (error: any) {
      alert('Chyba: ' + error.message)
    }
  }

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8 text-slate-800">Správa Služeb</h1>

      <div className="grid gap-8 md:grid-cols-[350px_1fr]">
        
        {/* LEVÁ ČÁST: Formulář pro přidání */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Nová služba</CardTitle>
              <CardDescription>Přidejte službu do nabídky salonu.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Název služby</Label>
                  <Input 
                    id="title" 
                    placeholder="Např. Pánský střih" 
                    value={formData.title}
                    onChange={e => setFormData({...formData, title: e.target.value})}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="price">Cena (Kč)</Label>
                  <Input 
                    id="price" 
                    type="number" 
                    placeholder="0" 
                    value={formData.price}
                    onChange={e => setFormData({...formData, price: e.target.value})}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="duration">Trvání (minuty)</Label>
                  <Input 
                    id="duration" 
                    type="number" 
                    step="5"
                    value={formData.duration}
                    onChange={e => setFormData({...formData, duration: e.target.value})}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="desc">Krátký popis (volitelné)</Label>
                  <Input 
                    id="desc" 
                    placeholder="Včetně mytí a stylingu..." 
                    value={formData.description}
                    onChange={e => setFormData({...formData, description: e.target.value})}
                  />
                </div>

                <Button type="submit" className="w-full" disabled={submitting}>
                  {submitting ? 'Ukládám...' : <><Plus className="mr-2 h-4 w-4" /> Přidat službu</>}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* PRAVÁ ČÁST: Seznam služeb */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-slate-700">Vaše nabídka ({services.length})</h2>
          
          {loading ? (
            <p className="text-muted-foreground">Načítám služby...</p>
          ) : services.length === 0 ? (
            <div className="text-center p-8 border-2 border-dashed rounded-lg text-muted-foreground">
              Zatím nemáte žádné služby. Přidejte první vlevo.
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2">
              {services.map((service) => (
                <Card key={service.id} className="relative group hover:shadow-md transition-shadow">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex justify-between items-start">
                      {service.title}
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => handleDelete(service.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </CardTitle>
                    <CardDescription>{service.description || 'Bez popisu'}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between items-center text-sm font-medium text-slate-600 mt-2">
                      <div className="flex items-center">
                        <Banknote className="mr-1 h-4 w-4" />
                        {service.price} Kč
                      </div>
                      <div className="flex items-center">
                        <Clock className="mr-1 h-4 w-4" />
                        {service.duration_minutes} min
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}