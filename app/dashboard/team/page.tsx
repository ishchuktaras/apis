'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Plus, Trash2, User, Palette, Save, Phone, Mail, 
  Briefcase, Armchair, MonitorSmartphone, MoreHorizontal 
} from 'lucide-react'
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"

// --- TYPY ---

type MemberType = 'PERSON' | 'RESOURCE'

interface TeamMember {
  id: string
  name: string
  role: string
  color: string
  type: MemberType
  email?: string
  phone?: string
  is_active: boolean
  ico?: string
  commission_rate?: number
}

const PRESET_COLORS = [
  '#F4C430', // Brand Yellow
  '#EF4444', // Red
  '#3B82F6', // Blue
  '#10B981', // Green
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#F97316', // Orange
  '#6366F1', // Indigo
]

export default function TeamPage() {
  const [members, setMembers] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Filtr pro zobrazení
  const [activeTab, setActiveTab] = useState("ALL")

  // Form State
  const defaultMember: Partial<TeamMember> = {
    name: '',
    role: 'Stylista',
    color: PRESET_COLORS[0],
    type: 'PERSON',
    email: '',
    phone: '',
    is_active: true,
    ico: '',
    commission_rate: 0
  }
  const [formData, setFormData] = useState<Partial<TeamMember>>(defaultMember)
  const [editingId, setEditingId] = useState<string | null>(null)

  useEffect(() => {
    fetchMembers()
  }, [])

  const fetchMembers = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at')

      if (error) throw error
      setMembers(data || [])
    } catch (error) {
      console.error(error)
      toast.error('Nepodařilo se načíst tým.')
    } finally {
      setLoading(false)
    }
  }

  const handleOpenDialog = (member?: TeamMember) => {
    if (member) {
      setFormData(member)
      setEditingId(member.id)
    } else {
      setFormData(defaultMember)
      setEditingId(null)
    }
    setIsDialogOpen(true)
  }

  const handleSave = async () => {
    if (!formData.name) {
      toast.error('Jméno je povinné')
      return
    }

    setIsSubmitting(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const payload = {
        ...formData,
        user_id: user.id
      }

      let error
      if (editingId) {
        const { error: updateError } = await supabase
          .from('employees')
          .update(payload)
          .eq('id', editingId)
        error = updateError
      } else {
        const { error: insertError } = await supabase
          .from('employees')
          .insert(payload)
        error = insertError
      }

      if (error) throw error

      toast.success(editingId ? 'Upraveno' : 'Vytvořeno')
      setIsDialogOpen(false)
      fetchMembers()
    } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : 'Neznámá chyba'
        toast.error('Chyba: ' + msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Opravdu smazat? Tato akce je nevratná.')) return
    try {
      const { error } = await supabase.from('employees').delete().eq('id', id)
      if (error) throw error
      setMembers(members.filter(m => m.id !== id))
      toast.success('Smazáno')
    } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : 'Neznámá chyba'
        toast.error('Chyba: ' + msg)
    }
  }

  const filteredMembers = members.filter(m => {
    if (activeTab === 'ALL') return true
    return m.type === activeTab
  })

  if (loading) return <div className="p-10 flex justify-center"><div className="animate-spin h-8 w-8 border-4 border-[#F4C430] rounded-full border-t-transparent"></div></div>

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-20">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Tým & Jednotky</h1>
          <p className="text-slate-500 mt-1">Spravujte své zaměstnance, křesla a dostupnost zdrojů.</p>
        </div>
        <Button onClick={() => handleOpenDialog()} className="bg-[#1A1A1A] hover:bg-black text-white gap-2 shadow-lg shadow-black/10">
          <Plus className="h-4 w-4" /> Přidat novou jednotku
        </Button>
      </div>

      {/* Tabs & Filter */}
      <Tabs defaultValue="ALL" className="w-full" onValueChange={setActiveTab}>
        <TabsList className="grid w-full max-w-[400px] grid-cols-3 mb-6 bg-slate-100 p-1 rounded-xl">
          <TabsTrigger value="ALL" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">Vše</TabsTrigger>
          <TabsTrigger value="PERSON" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">Lidé</TabsTrigger>
          <TabsTrigger value="RESOURCE" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">Zdroje</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredMembers.map(member => (
          <Card key={member.id} className="group overflow-hidden hover:shadow-lg transition-all border-slate-200 duration-300">
            {/* Color Strip */}
            <div className="h-1.5 w-full" style={{ backgroundColor: member.color }} />
            
            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
              <div className="flex items-center gap-3">
                <div className={`h-12 w-12 rounded-full flex items-center justify-center font-bold text-lg shadow-inner ${member.type === 'PERSON' ? 'bg-slate-100 text-slate-600' : 'bg-blue-50 text-blue-600'}`}>
                  {member.type === 'PERSON' ? (
                     member.name.charAt(0).toUpperCase()
                  ) : (
                     <Armchair className="h-6 w-6" />
                  )}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-lg leading-none">{member.name}</h3>
                  <p className="text-sm text-slate-500 mt-1 flex items-center gap-1.5">
                    {member.type === 'PERSON' ? <User className="h-3 w-3" /> : <MonitorSmartphone className="h-3 w-3" />}
                    {member.role}
                  </p>
                </div>
              </div>
              <div className={`h-2.5 w-2.5 rounded-full ${member.is_active ? 'bg-green-500' : 'bg-slate-300'}`} title={member.is_active ? 'Aktivní' : 'Neaktivní'} />
            </CardHeader>

            <CardContent className="pb-3">
                {member.type === 'PERSON' ? (
                    <div className="space-y-2 mt-2 text-sm text-slate-600">
                        <div className="flex items-center gap-2">
                            <Mail className="h-3.5 w-3.5 text-slate-400" /> 
                            <span className="truncate">{member.email || '—'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Phone className="h-3.5 w-3.5 text-slate-400" /> 
                            <span>{member.phone || '—'}</span>
                        </div>
                    </div>
                ) : (
                    <div className="mt-2 text-sm text-slate-500 italic bg-slate-50 p-2 rounded border border-slate-100">
                        Zařízení / Místnost pro rezervace.
                    </div>
                )}
            </CardContent>

            <CardFooter className="pt-2 border-t border-slate-100 flex justify-between bg-slate-50/50">
               <Badge variant="outline" className="text-xs font-normal bg-white">
                   {member.type === 'PERSON' ? 'Zaměstnanec' : 'Místnost/Zdroj'}
               </Badge>
               <div className="flex gap-1">
                 <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-blue-600" onClick={() => handleOpenDialog(member)}>
                   <MoreHorizontal className="h-4 w-4" />
                 </Button>
                 <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-red-600 hover:bg-red-50" onClick={() => handleDelete(member.id)}>
                   <Trash2 className="h-4 w-4" />
                 </Button>
               </div>
            </CardFooter>
          </Card>
        ))}

        {/* Empty State / Add New Card */}
        <button 
            onClick={() => handleOpenDialog()}
            className="flex flex-col items-center justify-center h-full min-h-[200px] border-2 border-dashed border-slate-200 rounded-xl hover:border-[#F4C430] hover:bg-[#F4C430]/5 transition-all group cursor-pointer"
        >
            <div className="h-14 w-14 rounded-full bg-slate-100 group-hover:bg-white flex items-center justify-center mb-3 transition-colors">
                <Plus className="h-6 w-6 text-slate-400 group-hover:text-[#F4C430]" />
            </div>
            <p className="font-medium text-slate-600 group-hover:text-slate-900">Vytvořit novou jednotku</p>
        </button>
      </div>

      {/* --- EDIT / CREATE DIALOG --- */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Upravit jednotku' : 'Nová pracovní jednotka'}</DialogTitle>
            <DialogDescription>Definujte, kdo nebo co bude dostupné v kalendáři pro rezervace.</DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-6 py-4">
            
            {/* Type Selector */}
            <div className="grid grid-cols-2 gap-4">
               <div 
                 onClick={() => setFormData({...formData, type: 'PERSON'})}
                 className={`cursor-pointer border-2 rounded-xl p-4 flex flex-col items-center gap-2 transition-all ${formData.type === 'PERSON' ? 'border-[#F4C430] bg-yellow-50/50' : 'border-slate-100 hover:border-slate-300'}`}
               >
                  <User className={`h-6 w-6 ${formData.type === 'PERSON' ? 'text-slate-900' : 'text-slate-400'}`} />
                  <span className="font-medium text-sm">Specialista / Osoba</span>
               </div>
               <div 
                 onClick={() => setFormData({...formData, type: 'RESOURCE'})}
                 className={`cursor-pointer border-2 rounded-xl p-4 flex flex-col items-center gap-2 transition-all ${formData.type === 'RESOURCE' ? 'border-[#F4C430] bg-yellow-50/50' : 'border-slate-100 hover:border-slate-300'}`}
               >
                  <Armchair className={`h-6 w-6 ${formData.type === 'RESOURCE' ? 'text-slate-900' : 'text-slate-400'}`} />
                  <span className="font-medium text-sm">Místnost / Křeslo</span>
               </div>
            </div>

            <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>Název / Jméno *</Label>
                        <Input 
                        placeholder={formData.type === 'PERSON' ? "Jan Novák" : "Křeslo 1"} 
                        value={formData.name} 
                        onChange={e => setFormData({...formData, name: e.target.value})}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Role / Popis</Label>
                        <Input 
                        placeholder={formData.type === 'PERSON' ? "Senior Stylista" : "Masážní místnost"} 
                        value={formData.role} 
                        onChange={e => setFormData({...formData, role: e.target.value})}
                        />
                    </div>
                </div>

                {/* Sekce pouze pro osoby */}
                {formData.type === 'PERSON' && (
                    <div className="p-4 bg-slate-50 rounded-lg border border-slate-100 space-y-4 animate-in slide-in-from-top-2">
                        <div className="flex items-center gap-2 text-sm font-semibold text-slate-700 pb-2 border-b border-slate-200">
                           <Briefcase className="h-4 w-4" /> Pracovní & Kontaktní údaje
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Email (Login)</Label>
                                <Input type="email" placeholder="jan@salon.cz" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                            </div>
                            <div className="space-y-2">
                                <Label>Telefon</Label>
                                <Input type="tel" placeholder="+420 777..." value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                            </div>
                            <div className="space-y-2">
                                <Label>IČO (Nepovinné)</Label>
                                <Input placeholder="12345678" value={formData.ico} onChange={e => setFormData({...formData, ico: e.target.value})} />
                            </div>
                            <div className="space-y-2">
                                <Label>Provize (%) <Badge variant="secondary" className="ml-1 text-[10px]">PRO</Badge></Label>
                                <Input type="number" placeholder="0" min="0" max="100" value={formData.commission_rate} onChange={e => setFormData({...formData, commission_rate: Number(e.target.value)})} />
                            </div>
                        </div>
                    </div>
                )}

                <div className="space-y-2">
                    <Label>Barva v kalendáři</Label>
                    <div className="flex gap-2 flex-wrap">
                    {PRESET_COLORS.map(c => (
                        <button
                        key={c}
                        onClick={() => setFormData({...formData, color: c})}
                        className={`w-8 h-8 rounded-full border-2 transition-all ${formData.color === c ? 'border-slate-900 scale-110 shadow-md' : 'border-transparent hover:scale-105'}`}
                        style={{ backgroundColor: c }}
                        />
                    ))}
                    </div>
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg bg-white">
                    <div className="space-y-0.5">
                        <Label className="text-base">Aktivní</Label>
                        <p className="text-xs text-slate-500">Zobrazovat v kalendáři a při rezervaci</p>
                    </div>
                    <Switch 
                        checked={formData.is_active}
                        onCheckedChange={(checked: boolean) => setFormData({...formData, is_active: checked})}
                    />
                </div>
            </div>

          </div>

          <DialogFooter>
             <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Zrušit</Button>
             <Button onClick={handleSave} disabled={isSubmitting} className="bg-[#F4C430] text-slate-900 hover:bg-[#E0B120]">
                {isSubmitting ? <span className="flex items-center gap-2"><div className="animate-spin h-4 w-4 border-2 border-slate-900 border-t-transparent rounded-full"/> Ukládám...</span> : 'Uložit změny'}
             </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}