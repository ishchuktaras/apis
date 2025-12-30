'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Clock, AlertCircle, Store, Globe, MapPin, Phone, FileText, Save, Upload, Image as ImageIcon, RefreshCw, Lock } from 'lucide-react'
import { toast } from "sonner"

// --- KONFIGURACE ---
// DŮLEŽITÉ: Pro správnou funkčnost kalendáře musí být 0 = Neděle.
const DAYS = ['Neděle', 'Pondělí', 'Úterý', 'Středa', 'Čtvrtek', 'Pátek', 'Sobota']

// Generátor časů po 5 minutách (07:00 - 21:00)
const generateTimeOptions = (step = 5) => {
  const times = []
  for (let h = 7; h < 21; h++) {
    for (let m = 0; m < 60; m += step) {
      const time = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`
      times.push(time)
    }
  }
  return times
}
const TIME_OPTIONS = generateTimeOptions(5)

interface BusinessHour {
  id: string
  day_of_week: number
  open_time: string
  close_time: string
  is_closed: boolean
}

interface Profile {
  salon_name: string
  slug: string
  description: string
  address: string
  phone: string
  logo_url: string | null
}

export default function SettingsPage() {
  const [hours, setHours] = useState<BusinessHour[]>([])
  const [loadingHours, setLoadingHours] = useState(true)
  const [savingHours, setSavingHours] = useState(false)

  const [profile, setProfile] = useState<Profile>({
    salon_name: '',
    slug: '',
    description: '',
    address: '',
    phone: '',
    logo_url: null
  })
  const [loadingProfile, setLoadingProfile] = useState(true)
  const [savingProfile, setSavingProfile] = useState(false)
  const [uploadingLogo, setUploadingLogo] = useState(false)

  // Stavy pro změnu hesla
  const [newPassword, setNewPassword] = useState('')
  const [savingPassword, setSavingPassword] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        window.location.href = '/login'
        return
      }

      // 1. Profil
      const { data: profileData } = await supabase
        .from('profiles')
        .select('salon_name, slug, description, address, phone, logo_url')
        .eq('id', user.id)
        .single()
      
      if (profileData) {
        setProfile({
          salon_name: profileData.salon_name || '',
          slug: profileData.slug || '',
          description: profileData.description || '',
          address: profileData.address || '',
          phone: profileData.phone || '',
          logo_url: profileData.logo_url || null
        })
      }
      setLoadingProfile(false)

      // 2. Otevírací doba
      const { data: hoursData } = await supabase
        .from('business_hours')
        .select('*')
        .eq('user_id', user.id)
        .order('day_of_week', { ascending: true })
      
      setHours(hoursData || [])
      setLoadingHours(false)

    } catch (error) {
      console.error('Chyba při načítání:', error)
      toast.error("Nepodařilo se načíst data.")
    }
  }

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploadingLogo(true)
      const loadingToast = toast.loading("Nahrávám logo...")
      
      if (!e.target.files || e.target.files.length === 0) throw new Error('Nevybrali jste žádný soubor.')

      const file = e.target.files[0]
      const fileExt = file.name.split('.').pop()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Nejste přihlášen.')

      const fileName = `${user.id}/logo-${Date.now()}.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from('salon-logos')
        .upload(fileName, file, { upsert: true })

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('salon-logos')
        .getPublicUrl(fileName)

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ logo_url: publicUrl })
        .eq('id', user.id)

      if (updateError) throw updateError

      setProfile(prev => ({ ...prev, logo_url: publicUrl }))
      toast.dismiss(loadingToast)
      toast.success('Logo bylo úspěšně nahráno!')

    } catch (error: any) {
      toast.dismiss()
      toast.error('Chyba při nahrávání: ' + error.message)
    } finally {
      setUploadingLogo(false)
    }
  }

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSavingProfile(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const formattedSlug = profile.slug.toLowerCase().replace(/[^a-z0-9-]/g, '-')
      
      const { error } = await supabase
        .from('profiles')
        .update({
          salon_name: profile.salon_name,
          slug: formattedSlug,
          description: profile.description,
          address: profile.address,
          phone: profile.phone
        })
        .eq('id', user.id)

      if (error) {
        if (error.code === '23505') toast.error('Tato URL adresa je už zabraná.')
        else throw error
      } else {
        toast.success('Profil byl úspěšně uložen.')
        setProfile(prev => ({ ...prev, slug: formattedSlug }))
      }
    } catch (error: any) {
      toast.error('Chyba: ' + error.message)
    } finally {
      setSavingProfile(false)
    }
  }

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setSavingPassword(true)
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword })
      if (error) throw error
      toast.success('Heslo bylo úspěšně změněno.')
      setNewPassword('')
    } catch (error: any) {
      toast.error('Chyba: ' + error.message)
    } finally {
      setSavingPassword(false)
    }
  }

  const initializeHours = async () => {
    try {
      setLoadingHours(true)
      setHours([]) 
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { error: deleteError } = await supabase.from('business_hours').delete().eq('user_id', user.id)
      if (deleteError) throw deleteError

      const defaultHours = Array.from({ length: 7 }, (_, i) => ({
        user_id: user.id,
        day_of_week: i,
        open_time: '09:00',
        close_time: '17:00',
        is_closed: i === 5 || i === 6 // ZAVŘENO: Sobota (5) a Neděle (6) - pokud DAYS začíná Nedělí (0), tak sobota je 6 a neděle 0. Upravíme logiku níže.
      }))

      // Oprava logiky pro dny, pokud 0=Ne, 1=Po...6=So
      // Chceme zavřít Sobotu (6) a Neděli (0)
      const correctedDefaultHours = Array.from({ length: 7 }, (_, i) => ({
        user_id: user.id,
        day_of_week: i,
        open_time: '09:00',
        close_time: '17:00',
        is_closed: i === 0 || i === 6 
      }))

      const { error: insertError } = await supabase.from('business_hours').insert(correctedDefaultHours)
      if (insertError) throw insertError

      toast.success("Otevírací doba byla resetována.")
      await fetchData()
    } catch (error: any) {
      toast.error('Chyba: ' + error.message)
    } finally {
      setLoadingHours(false)
    }
  }

  const handleHoursSave = async (id: string, updates: Partial<BusinessHour>) => {
    setSavingHours(true)
    setHours(prev => prev.map(h => h.id === id ? { ...h, ...updates } : h))
    const { error } = await supabase.from('business_hours').update(updates).eq('id', id)
    if (error) toast.error("Nepodařilo se uložit otevírací dobu.")
    setSavingHours(false)
  }

  if (loadingProfile && loadingHours) return <div className="p-8 text-center">Načítám...</div>

  // Řazení pro zobrazení: Aby Pondělí (1) bylo první a Neděle (0) poslední
  const sortedHours = [...hours].sort((a, b) => {
    const dayA = a.day_of_week === 0 ? 7 : a.day_of_week
    const dayB = b.day_of_week === 0 ? 7 : b.day_of_week
    return dayA - dayB
  })

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-10">
      <h1 className="text-3xl font-bold text-slate-800">Nastavení Salonu</h1>

      {/* 1. KARTA: PROFIL */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Store className="h-5 w-5" /> Veřejný Profil</CardTitle>
          <CardDescription>Tyto informace uvidí vaši zákazníci na webu.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleProfileSave} className="space-y-6">
            <div className="flex flex-col sm:flex-row items-center gap-6 p-4 bg-slate-50 rounded-lg border border-dashed">
              <div className="relative h-24 w-24 shrink-0">
                {profile.logo_url ? <img src={profile.logo_url} alt="Logo" className="h-full w-full rounded-full object-cover border-2 border-white shadow-sm" /> : <div className="h-full w-full rounded-full bg-slate-200 flex items-center justify-center text-slate-400"><ImageIcon className="h-8 w-8" /></div>}
                {uploadingLogo && <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center text-white text-xs">...</div>}
              </div>
              <div className="flex-1 text-center sm:text-left space-y-2">
                <h3 className="font-medium text-slate-900">Logo Salonu</h3>
                <Label htmlFor="logo-upload" className="cursor-pointer inline-flex items-center gap-2 bg-white border px-3 py-2 rounded-md text-sm hover:bg-slate-50 transition-colors shadow-sm">
                  <Upload className="h-4 w-4" /> {uploadingLogo ? 'Nahrávám...' : 'Nahrát nové logo'}
                  <Input id="logo-upload" type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} disabled={uploadingLogo} />
                </Label>
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Název Salonu</Label><Input className="pl-3" placeholder="Např. Kadeřnictví Jana" value={profile.salon_name} onChange={e => setProfile({...profile, salon_name: e.target.value})} required /></div>
              <div className="space-y-2"><Label>Webová adresa (URL)</Label><Input className="pl-3" placeholder="kadernictvi-jana" value={profile.slug} onChange={e => setProfile({...profile, slug: e.target.value})} required /><p className="text-xs text-slate-500">Adresa: salonio.cz/<strong>{profile.slug}</strong></p></div>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Telefon</Label><Input className="pl-3" placeholder="+420 123 456 789" value={profile.phone} onChange={e => setProfile({...profile, phone: e.target.value})} /></div>
              <div className="space-y-2"><Label>Adresa</Label><Input className="pl-3" placeholder="Ulice 123" value={profile.address} onChange={e => setProfile({...profile, address: e.target.value})} /></div>
            </div>
            <div className="space-y-2"><Label>Popis</Label><Input className="pl-3" placeholder="O nás..." value={profile.description} onChange={e => setProfile({...profile, description: e.target.value})} /></div>
            <Button type="submit" disabled={savingProfile}>{savingProfile ? 'Ukládám...' : 'Uložit profil'}</Button>
          </form>
        </CardContent>
      </Card>

      {/* 2. KARTA: OTEVÍRACÍ DOBA */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div><CardTitle className="flex items-center gap-2"><Clock className="h-5 w-5" /> Otevírací doba</CardTitle></div>
            {hours.length > 0 && <Button variant="outline" size="sm" onClick={initializeHours} disabled={loadingHours}><RefreshCw className="h-4 w-4 mr-2" /> Resetovat</Button>}
          </div>
        </CardHeader>
        <CardContent>
          {hours.length === 0 ? <div className="text-center py-8"><AlertCircle className="h-10 w-10 text-yellow-500 mx-auto mb-2" /><Button onClick={initializeHours} disabled={loadingHours}>Vygenerovat standardní</Button></div> : 
            <div className="space-y-4">
              {/* Používáme sortedHours, aby Pondělí bylo první */}
              {sortedHours.map((day) => (
                <div key={day.id} className={`flex items-center justify-between p-3 rounded-lg border ${day.is_closed ? 'bg-slate-50 border-slate-100' : 'bg-white border-slate-200'}`}>
                  {/* Zde musíme použít správný index pro pole DAYS (0=Ne, ale v sortedHours je první Po=1) */}
                  <div className="w-24 font-medium text-slate-700">
                    {/* Trik: Pokud day.day_of_week je 1 (Po), chceme index 1 v poli DAYS. Pokud je 0 (Ne), chceme index 0 */}
                    {DAYS[day.day_of_week]}
                  </div>
                  <div className="flex items-center gap-2">
                    <Label htmlFor={`closed-${day.id}`} className="text-xs text-slate-500 md:hidden">{day.is_closed ? 'Zavřeno' : 'Otevřeno'}</Label>
                    <Switch 
                      id={`closed-${day.id}`} 
                      checked={!day.is_closed} 
                      // OPRAVA TYPU: Explicitně definujeme typ parametru checked
                      onCheckedChange={(checked: boolean) => handleHoursSave(day.id, { is_closed: !checked })} 
                    />
                  </div>
                  <div className={`flex items-center gap-2 ${day.is_closed ? 'opacity-20 pointer-events-none' : 'opacity-100'}`}>
                    <select className="flex h-10 w-24 rounded-md border bg-background px-3 py-2 text-sm" value={day.open_time?.slice(0,5)} onChange={(e) => handleHoursSave(day.id, { open_time: e.target.value })}>{TIME_OPTIONS.map((time) => <option key={time} value={time}>{time}</option>)}</select>
                    <span>-</span>
                    <select className="flex h-10 w-24 rounded-md border bg-background px-3 py-2 text-sm" value={day.close_time?.slice(0,5)} onChange={(e) => handleHoursSave(day.id, { close_time: e.target.value })}>{TIME_OPTIONS.map((time) => <option key={time} value={time}>{time}</option>)}</select>
                  </div>
                </div>
              ))}
            </div>
          }
        </CardContent>
      </Card>

      {/* 3. KARTA: ZABEZPEČENÍ */}
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Lock className="h-5 w-5" /> Zabezpečení</CardTitle><CardDescription>Změňte si heslo k účtu.</CardDescription></CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordUpdate} className="space-y-4 max-w-sm">
            <div className="space-y-2"><Label>Nové heslo</Label><Input type="password" placeholder="******" value={newPassword} onChange={e => setNewPassword(e.target.value)} required minLength={6} /></div>
            <Button type="submit" disabled={savingPassword}>{savingPassword ? 'Ukládám...' : 'Změnit heslo'}</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}