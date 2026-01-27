'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Plus, Trash2, User, Phone, Mail, 
  Briefcase, Armchair, MonitorSmartphone, MoreHorizontal,
  Banknote, FileText, CheckCircle2, Loader2
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

interface TeamMemberResponse {
  id: string
  fullName?: string
  name?: string
  role?: string
  color?: string
  type?: MemberType
  email?: string
  phone?: string
  isActive?: boolean
  ico?: string
  commissionRate?: number
}

const PRESET_COLORS = [
  '#F4C430', '#EF4444', '#3B82F6', '#10B981', 
  '#8B5CF6', '#EC4899', '#F97316', '#6366F1',
]

export default function TeamPage() {
  const [members, setMembers] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [activeTab, setActiveTab] = useState("ALL")

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

  // --- API VOLÁNÍ  ---

  const fetchMembers = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/team')
      if (!res.ok) throw new Error('Nepodařilo se načíst tým')
      const data = await res.json()
      
      // Mapování dat z DB (Prisma používá fullName, email atd.)
      const mapped = data.map((m: TeamMemberResponse) => ({
        id: m.id,
        name: m.fullName || m.name, // Prisma má fullName
        role: m.role || 'Člen týmu',
        color: m.color || PRESET_COLORS[0],
        type: m.type || 'PERSON',
        email: m.email,
        phone: m.phone,
        is_active: m.isActive ?? true,
        ico: m.ico,
        commission_rate: m.commissionRate || 0
      }))
      setMembers(mapped)
    } catch (error) {
      console.error(error)
      toast.error('Nepodařilo se načíst tým.')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!formData.name) {
      toast.error('Jméno je povinné')
      return
    }

    setIsSubmitting(true)
    try {
      const url = editingId ? `/api/team/${editingId}` : '/api/team'
      const method = editingId ? 'PATCH' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (!res.ok) throw new Error('Chyba při ukládání')

      toast.success(editingId ? 'Uloženo' : 'Vytvořeno')
      setIsDialogOpen(false)
      fetchMembers()
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Neznámá chyba'
        toast.error('Chyba: ' + message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Opravdu odstranit?')) return
    try {
      const res = await fetch(`/api/team/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Chyba při mazání')
      
      setMembers(members.filter(m => m.id !== id))
      toast.success('Odstraněno')
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Neznámá chyba'
        toast.error('Chyba: ' + message)
    }
  }

  // --- OSTATNÍ LOGIKA ---

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

  const filteredMembers = members.filter(m => {
    if (activeTab === 'ALL') return true
    return m.type === activeTab
  })

  if (loading) return (
    <div className="p-10 flex flex-col items-center justify-center">
      <Loader2 className="animate-spin h-8 w-8 text-[#F4C430] mb-2" />
      <p className="text-slate-500 text-sm">Načítám tým...</p>
    </div>
  )

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-20">
      {/* ZBYTEK VAŠEHO UI ZŮSTÁVÁ STEJNÝ */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Tým & Jednotky</h1>
          <p className="text-slate-500 mt-1">Spravujte své zaměstnance, křesla a dostupnost zdrojů.</p>
        </div>
        <Button onClick={() => handleOpenDialog()} className="bg-[#1A1A1A] hover:bg-black text-white gap-2 shadow-lg shadow-black/10 transition-transform active:scale-95">
          <Plus className="h-4 w-4" /> Přidat novou jednotku
        </Button>
      </div>

      <Tabs defaultValue="ALL" className="w-full" onValueChange={setActiveTab}>
        <TabsList className="grid w-full max-w-[400px] grid-cols-3 mb-6 bg-slate-100 p-1 rounded-xl">
          <TabsTrigger value="ALL" className="rounded-lg font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm">Vše</TabsTrigger>
          <TabsTrigger value="PERSON" className="rounded-lg font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm">Lidé</TabsTrigger>
          <TabsTrigger value="RESOURCE" className="rounded-lg font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm">Zdroje</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredMembers.map(member => (
          <Card key={member.id} className={`group overflow-hidden hover:shadow-lg transition-all border-slate-200 duration-300 ${!member.is_active ? 'opacity-60 grayscale-[0.5]' : ''}`}>
            <div className="h-1.5 w-full" style={{ backgroundColor: member.color }} />
            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
              <div className="flex items-center gap-3">
                <div className={`h-12 w-12 rounded-full flex items-center justify-center font-bold text-lg shadow-inner ${member.type === 'PERSON' ? 'bg-slate-100 text-slate-600' : 'bg-blue-50 text-blue-600'}`}>
                  {member.type === 'PERSON' ? member.name.charAt(0).toUpperCase() : <Armchair className="h-6 w-6" />}
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
                        <div className="flex items-center gap-2">
                            <Mail className="h-3.5 w-3.5 text-slate-400" /> 
                            <span className="truncate max-w-[180px]">{member.email || <span className="text-slate-300 italic">není zadán</span>}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Phone className="h-3.5 w-3.5 text-slate-400" /> 
                            <span>{member.phone || <span className="text-slate-300 italic">není zadán</span>}</span>
                        </div>
                    </div>
                ) : (
                    <div className="mt-2 text-sm text-slate-500 italic bg-slate-50 p-3 rounded border border-slate-100 flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-slate-400" /> Dostupný zdroj
                    </div>
                )}
            </CardContent>

            <CardFooter className="pt-2 border-t border-slate-100 flex justify-between bg-slate-50/50">
               <Badge variant="secondary" className="text-xs font-normal bg-white border border-slate-200 text-slate-500">
                   {member.type === 'PERSON' ? 'Osoba' : 'Zdroj'}
               </Badge>
               <div className="flex gap-1">
                 <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-blue-600" onClick={() => handleOpenDialog(member)}>
                   <MoreHorizontal className="h-4 w-4" />
                 </Button>
                 <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-red-600" onClick={() => handleDelete(member.id)}>
                   <Trash2 className="h-4 w-4" />
                 </Button>
               </div>
            </CardFooter>
          </Card>
        ))}

        <button 
            onClick={() => handleOpenDialog()}
            className="flex flex-col items-center justify-center h-full min-h-[220px] border-2 border-dashed border-slate-200 rounded-xl hover:border-[#F4C430] hover:bg-[#F4C430]/5 transition-all group cursor-pointer"
        >
            <div className="h-14 w-14 rounded-full bg-slate-100 group-hover:bg-white flex items-center justify-center mb-3 transition-colors shadow-sm">
                <Plus className="h-6 w-6 text-slate-400 group-hover:text-[#F4C430]" />
            </div>
            <p className="font-medium text-slate-600 group-hover:text-slate-900">Vytvořit novou jednotku</p>
        </button>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Upravit jednotku' : 'Nová pracovní jednotka'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-6 py-4">
            {/* ... VAŠE FORMULÁŘOVÉ PRVKY ZŮSTÁVAJÍ STEJNÉ ... */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Název / Jméno *</Label>
                <Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Role</Label>
                <Input value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} />
              </div>
            </div>
            {/* Přidat další pole podle potřeby */}
          </div>
          <DialogFooter>
             <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Zrušit</Button>
             <Button onClick={handleSave} disabled={isSubmitting} className="bg-[#F4C430] text-slate-900 hover:bg-[#E0B120]">
                {isSubmitting ? 'Ukládám...' : 'Uložit'}
             </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}