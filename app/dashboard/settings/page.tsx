"use client"

import { useState, useEffect } from 'react'
import { 
   Save, 
   Store,
   User,
   Loader2
} from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"

export default function SettingsPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  // Formulářová data
  const [formData, setFormData] = useState({
    userName: "",
    email: "",
    salonName: "",
    salonSlug: "",
    primaryColor: "#F4C430"
  })

  // 1. Načtení dat při startu
  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const res = await fetch("/api/settings")
      if (!res.ok) throw new Error("Chyba načítání")
      
      const data = await res.json()
      setFormData({
        userName: data.userName || "",
        email: data.email || "",
        salonName: data.salonName || "",
        salonSlug: data.salonSlug || "",
        primaryColor: data.primaryColor || "#F4C430"
      })
    } catch (error) {
      console.error(error)
      toast.error("Nepodařilo se načíst nastavení")
    } finally {
      setIsLoading(false)
    }
  }

  // 2. Uložení změn
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)

    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userName: formData.userName,
          salonName: formData.salonName,
          primaryColor: formData.primaryColor
        })
      })

      if (!res.ok) throw new Error("Chyba při ukládání")

      toast.success("Nastavení bylo uloženo")
    } catch (error) {
      toast.error("Uložení se nezdařilo")
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return <div className="p-8 text-center flex justify-center"><Loader2 className="animate-spin mr-2"/> Načítám nastavení...</div>
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-20">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Nastavení</h1>
        <p className="text-muted-foreground">Správa vašeho profilu a údajů o salonu.</p>
      </div>

      <Separator />

      <form onSubmit={handleSave} className="space-y-8">
        
        {/* Sekce: Salon */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Store className="w-5 h-5 text-[#F4C430]" />
              <CardTitle>Údaje o salonu</CardTitle>
            </div>
            <CardDescription>
              Tyto informace se budou zobrazovat vašim klientům na webu.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="salonName">Název salonu</Label>
              <Input 
                id="salonName" 
                value={formData.salonName} 
                onChange={e => setFormData({...formData, salonName: e.target.value})}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div className="grid gap-2">
                <Label htmlFor="slug">Webová adresa (Slug)</Label>
                <Input 
                  id="slug" 
                  value={formData.salonSlug} 
                  disabled 
                  className="bg-slate-100 text-slate-500"
                />
                <p className="text-xs text-muted-foreground">Unikátní identifikátor vašeho salonu (nelze snadno změnit).</p>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="color">Hlavní barva webu</Label>
                <div className="flex gap-2">
                    <Input 
                      id="color" 
                      type="color"
                      className="w-12 p-1 h-10 cursor-pointer"
                      value={formData.primaryColor} 
                      onChange={e => setFormData({...formData, primaryColor: e.target.value})}
                    />
                    <Input 
                      value={formData.primaryColor} 
                      onChange={e => setFormData({...formData, primaryColor: e.target.value})}
                      className="uppercase"
                    />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sekce: Osobní údaje */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <User className="w-5 h-5 text-blue-500" />
              <CardTitle>Osobní profil</CardTitle>
            </div>
            <CardDescription>
              Vaše přihlašovací údaje a jméno.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="userName">Vaše jméno</Label>
              <Input 
                id="userName" 
                value={formData.userName} 
                onChange={e => setFormData({...formData, userName: e.target.value})}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email (Login)</Label>
              <Input 
                id="email" 
                value={formData.email} 
                disabled 
                className="bg-slate-100 text-slate-500"
              />
              <p className="text-xs text-muted-foreground">Pro změnu emailu kontaktujte podporu.</p>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" disabled={isSaving} className="bg-[#F4C430] hover:bg-[#d4a010] text-slate-900 min-w-[150px]">
            {isSaving ? (
                <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Ukládám...
                </>
            ) : (
                <>
                    <Save className="mr-2 h-4 w-4" /> Uložit změny
                </>
            )}
          </Button>
        </div>

      </form>
    </div>
  )
}