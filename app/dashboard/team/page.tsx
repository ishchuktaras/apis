'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Plus, Trash2, UserCircle, Palette, Save } from 'lucide-react'
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

interface Employee {
  id: string
  name: string
  role: string
  color: string
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
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [newEmployee, setNewEmployee] = useState({ name: '', role: 'Stylista', color: PRESET_COLORS[0] })

  useEffect(() => {
    fetchEmployees()
  }, [])

  const fetchEmployees = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at')

      if (error) throw error
      setEmployees(data || [])
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { error } = await supabase
        .from('employees')
        .insert({ ...newEmployee, user_id: user.id })

      if (error) throw error

      toast.success('Člen týmu přidán')
      setIsDialogOpen(false)
      setNewEmployee({ name: '', role: 'Stylista', color: PRESET_COLORS[0] })
      fetchEmployees()
    } catch (error: any) {
      toast.error('Chyba: ' + error.message)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Opravdu smazat?')) return
    try {
      const { error } = await supabase.from('employees').delete().eq('id', id)
      if (error) throw error
      setEmployees(employees.filter(e => e.id !== id))
      toast.success('Smazáno')
    } catch (error: any) {
      toast.error('Chyba: ' + error.message)
    }
  }

  if (loading) return <div className="p-8">Načítám tým...</div>

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div className="flex justify-between items-center bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Tým & Jednotky</h1>
          <p className="text-slate-500 mt-1">Spravujte stylisty nebo pracovní jednotky (křesla, kabiny) pro kalendář.</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#1A1A1A] hover:bg-black text-white gap-2">
              <Plus className="h-4 w-4" /> Přidat člena
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nový člen týmu</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Jméno</Label>
                <Input 
                  placeholder="Např. Jana Nováková nebo Křeslo 1" 
                  value={newEmployee.name} 
                  onChange={e => setNewEmployee({...newEmployee, name: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label>Role / Popis</Label>
                <Input 
                  placeholder="Senior Stylista" 
                  value={newEmployee.role} 
                  onChange={e => setNewEmployee({...newEmployee, role: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label>Barva v kalendáři</Label>
                <div className="flex gap-2 flex-wrap">
                  {PRESET_COLORS.map(c => (
                    <button
                      key={c}
                      onClick={() => setNewEmployee({...newEmployee, color: c})}
                      className={`w-8 h-8 rounded-full border-2 transition-all ${newEmployee.color === c ? 'border-black scale-110' : 'border-transparent hover:scale-105'}`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>
              <Button onClick={handleAdd} className="w-full bg-[#F4C430] text-[#1A1A1A] hover:bg-yellow-500 font-bold">
                Uložit
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {employees.length === 0 ? (
          <div className="col-span-full py-16 text-center border-2 border-dashed border-slate-200 rounded-xl bg-slate-50">
            <UserCircle className="h-12 w-12 mx-auto text-slate-300 mb-3" />
            <p className="text-slate-500">Zatím nemáte žádné členy týmu.</p>
          </div>
        ) : (
          employees.map(emp => (
            <Card key={emp.id} className="group overflow-hidden hover:shadow-md transition-all border-slate-200">
              <div className="h-2 w-full" style={{ backgroundColor: emp.color }} />
              <CardContent className="p-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-lg">
                    {emp.name[0]}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900">{emp.name}</h3>
                    <p className="text-sm text-slate-500">{emp.role}</p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" className="text-slate-300 hover:text-red-500 hover:bg-red-50" onClick={() => handleDelete(emp.id)}>
                  <Trash2 className="h-5 w-5" />
                </Button>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
