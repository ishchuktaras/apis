'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Plus, Trash2, User, Phone, Mail, 
  Briefcase, Armchair, MonitorSmartphone, MoreHorizontal,
  Banknote, FileText, CheckCircle2, AlertCircle
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

      toast.success(editingId ? 'Uloženo' : 'Vytvořeno')
      setIsDialogOpen(false)
      fetchMembers()
    } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : 'Neznámá chyba'
        console.error(error)
        toast.error('Chyba: ' + msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Opravdu odstranit? Pro zachování historie doporučujeme spíše deaktivovat.')) return
    try {
      const { error } = await supabase.from('employees').delete().eq('id', id)
      if (error) throw error
      setMembers(members.filter(m => m.id !== id))
      toast.success('Odstraněno')
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
        <Button onClick={() => handleOpenDialog()} className="bg-[#1A1A1A] hover:bg-black text-white gap-2 shadow-lg shadow-black/10 transition-transform active:scale-95">
          <Plus className="h-4 w-4" /> Přidat novou jednotku
        </Button>
      </div>

      {/* Tabs & Filter */}
      <Tabs defaultValue="ALL" className="w-full" onValueChange={setActiveTab}>
        <TabsList className="grid w-full max-w-[400px] grid-cols-3 mb-6 bg-slate-100 p-1 rounded-xl">
          <TabsTrigger value="ALL" className="rounded-lg font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm">Vše</TabsTrigger>
          <TabsTrigger value="PERSON" className="rounded-lg font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm">Lidé</TabsTrigger>
          <TabsTrigger value="RESOURCE" className="rounded-lg font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm">Zdroje</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredMembers.map(member => (
          <Card key={member.id} className={`group overflow-hidden hover:shadow-lg transition-all border-slate-200 duration-300 ${!member.is_active ? 'opacity-60 grayscale-[0.5]' : ''}`}>
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
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-sm text-slate-500 flex items-center gap-1.5">
                      {member.type === 'PERSON' ? <User className="h-3 w-3" /> : <MonitorSmartphone className="h-3 w-3" />}
                      {member.role}
                    </p>
                    {!member.is_active && <Badge variant="destructive" className="text-[10px] h-5 px-1.5">Neaktivní</Badge>}
                  </div>
                </div>
              </div>
              
            </CardHeader>

            <CardContent className="pb-3">
                {member.type === 'PERSON' ? (
                    <div className="space-y-2 mt-2 text-sm text-slate-600">
                        <div className="flex items-center gap-2" title="Email pro přihlášení">
                            <Mail className="h-3.5 w-3.5 text-slate-400" /> 
                            <span className="truncate max-w-[180px]">{member.email || <span className="text-slate-300 italic">není zadán</span>}</span>
                        </div>
                        <div className="flex items-center gap-2" title="Telefon">
                            <Phone className="h-3.5 w-3.5 text-slate-400" /> 
                            <span>{member.phone || <span className="text-slate-300 italic">není zadán</span>}</span>
                        </div>
                        {(member.commission_rate && member.commission_rate > 0) ? (
                           <div className="flex items-center gap-2 text-green-700 font-medium bg-green-50 p-1.5 rounded w-fit text-xs mt-2">
                              <Banknote className="h-3.5 w-3.5" /> 
                              Provize: {member.commission_rate}%
                           </div>
                        ) : null}
                    </div>
                ) : (
                    <div className="mt-2 text-sm text-slate-500 italic bg-slate-50 p-3 rounded border border-slate-100 flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-slate-400" />
                        Dostupné pro rezervace
                    </div>
                )}
            </CardContent>

            <CardFooter className="pt-2 border-t border-slate-100 flex justify-between bg-slate-50/50">
               <Badge variant="secondary" className="text-xs font-normal bg-white border border-slate-200 text-slate-500">
                   {member.type === 'PERSON' ? 'Osoba' : 'Zdroj'}
               </Badge>
               <div className="flex gap-1">
                 <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-blue-600 hover:bg-blue-50" onClick={() => handleOpenDialog(member)}>
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
            className="flex flex-col items-center justify-center h-full min-h-[220px] border-2 border-dashed border-slate-200 rounded-xl hover:border-[#F4C430] hover:bg-[#F4C430]/5 transition-all group cursor-pointer"
        >
            <div className="h-14 w-14 rounded-full bg-slate-100 group-hover:bg-white flex items-center justify-center mb-3 transition-colors shadow-sm">
                <Plus className="h-6 w-6 text-slate-400 group-hover:text-[#F4C430]" />
            </div>
            <p className="font-medium text-slate-600 group-hover:text-slate-900">Vytvořit novou jednotku</p>
            <p className="text-xs text-slate-400 mt-1">Zaměstnanec nebo Místnost</p>
        </button>
      </div>

      {/* --- EDIT / CREATE DIALOG --- */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Upravit jednotku' : 'Nová pracovní jednotka'}</DialogTitle>
            <DialogDescription>Definujte, kdo nebo co bude dostupné v kalendáři pro rezervace.</DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-6 py-4">
            
            {/* Type Selector (Vizualizovaný přepínač) */}
            <div className="grid grid-cols-2 gap-4">
               <div 
                 onClick={() => setFormData({...formData, type: 'PERSON'})}
                 className={`cursor-pointer border-2 rounded-xl p-4 flex flex-col items-center gap-2 transition-all relative ${formData.type === 'PERSON' ? 'border-[#F4C430] bg-yellow-50/30' : 'border-slate-100 hover:border-slate-300'}`}
               >
                  {formData.type === 'PERSON' && <div className="absolute top-2 right-2 text-[#F4C430]"><CheckCircle2 size={16} /></div>}
                  <User className={`h-8 w-8 ${formData.type === 'PERSON' ? 'text-slate-900' : 'text-slate-400'}`} />
                  <span className="font-bold text-sm text-slate-900">Specialista / Osoba</span>
                  <span className="text-[10px] text-center text-slate-500 leading-tight">Má email, telefon, provize a pracovní dobu.</span>
               </div>
               <div 
                 onClick={() => setFormData({...formData, type: 'RESOURCE'})}
                 className={`cursor-pointer border-2 rounded-xl p-4 flex flex-col items-center gap-2 transition-all relative ${formData.type === 'RESOURCE' ? 'border-[#F4C430] bg-yellow-50/30' : 'border-slate-100 hover:border-slate-300'}`}
               >
                  {formData.type === 'RESOURCE' && <div className="absolute top-2 right-2 text-[#F4C430]"><CheckCircle2 size={16} /></div>}
                  <Armchair className={`h-8 w-8 ${formData.type === 'RESOURCE' ? 'text-slate-900' : 'text-slate-400'}`} />
                  <span className="font-bold text-sm text-slate-900">Místnost / Křeslo</span>
                  <span className="text-[10px] text-center text-slate-500 leading-tight">Zdroj pro rezervace bez osobních údajů.</span>
               </div>
            </div>

            <div className="space-y-4">
                {/* Základní údaje */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>Název / Jméno *</Label>
                        <Input 
                        placeholder={formData.type === 'PERSON' ? "Jan Novák" : "Křeslo 1"} 
                        value={formData.name} 
                        onChange={e => setFormData({...formData, name: e.target.value})}
                        className="font-medium"
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

                {/* Sekce pouze pro OSOBY */}
                {formData.type === 'PERSON' && (
                    <div className="p-5 bg-slate-50/80 rounded-xl border border-slate-100 space-y-4 animate-in slide-in-from-top-2">
                        <div className="flex items-center gap-2 text-sm font-bold text-slate-800 pb-2 border-b border-slate-200">
                           <Briefcase className="h-4 w-4 text-[#F4C430]" /> Pracovní & Kontaktní údaje
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Email (Login)</Label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                                    <Input className="pl-9" type="email" placeholder="jan@salon.cz" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>Telefon</Label>
                                <div className="relative">
                                    <Phone className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                                    <Input className="pl-9" type="tel" placeholder="+420 777..." value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                                </div>
                            </div>
                        </div>
                        
                        {/* Finanční údaje (PRO) */}
                        <div className="grid grid-cols-2 gap-4 pt-2">
                             <div className="space-y-2">
                                <Label className="flex items-center justify-between">
                                    IČO <span className="text-[10px] text-slate-400">(Nepovinné)</span>
                                </Label>
                                <div className="relative">
                                    <FileText className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                                    <Input className="pl-9" placeholder="12345678" value={formData.ico} onChange={e => setFormData({...formData, ico: e.target.value})} />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label className="flex items-center gap-2">
                                    Provize (%) <Badge variant="secondary" className="h-4 text-[9px] bg-[#F4C430] text-black hover:bg-[#F4C430] border-none px-1">PRO</Badge>
                                </Label>
                                <div className="relative">
                                    <Banknote className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                                    <Input className="pl-9" type="number" placeholder="0" min="0" max="100" value={formData.commission_rate} onChange={e => setFormData({...formData, commission_rate: Number(e.target.value)})} />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Barva a Aktivita */}
                <div className="space-y-3 pt-2">
                    <Label>Barva v kalendáři</Label>
                    <div className="flex gap-2 flex-wrap p-3 bg-slate-50 rounded-lg border border-slate-100">
                    {PRESET_COLORS.map(c => (
                        <button
                        key={c}
                        onClick={() => setFormData({...formData, color: c})}
                        className={`w-8 h-8 rounded-full transition-all flex items-center justify-center ${formData.color === c ? 'scale-110 shadow-md ring-2 ring-offset-2 ring-slate-900' : 'hover:scale-105 opacity-80 hover:opacity-100'}`}
                        style={{ backgroundColor: c }}
                        >
                            {formData.color === c && <CheckCircle2 className="text-white w-4 h-4 drop-shadow-md" />}
                        </button>
                    ))}
                    </div>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-xl bg-white shadow-sm">
                    <div className="space-y-0.5">
                        <Label className="text-base font-semibold">Aktivní jednotka</Label>
                        <p className="text-xs text-slate-500">Když vypnete, zmizí z kalendáře (ale historie zůstane).</p>
                    </div>
                    <Switch 
                        checked={formData.is_active}
                        onCheckedChange={(checked: boolean) => setFormData({...formData, is_active: checked})}
                    />
                </div>
            </div>

          </div>

          <DialogFooter className="py-4 border-t border-slate-100">
             <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="h-11">Zrušit</Button>
             <Button onClick={handleSave} disabled={isSubmitting} className="bg-[#F4C430] text-slate-900 hover:bg-[#E0B120] font-bold h-11 px-8 shadow-md shadow-yellow-500/10">
                {isSubmitting ? <span className="flex items-center gap-2"><div className="animate-spin h-4 w-4 border-2 border-slate-900 border-t-transparent rounded-full"/> Ukládám...</span> : 'Uložit jednotku'}
             </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}