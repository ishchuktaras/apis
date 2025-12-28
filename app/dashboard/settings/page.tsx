'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Clock, AlertCircle, Store, Globe, MapPin, Phone, FileText, Save, Upload, Image as ImageIcon } from 'lucide-react'

// --- TYPY ---
const DAYS = ['Neděle', 'Pondělí', 'Úterý', 'Středa', 'Čtvrtek', 'Pátek', 'Sobota']

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
  const [uploadingLogo, setUploadingLogo] = useState(false) // NOVÉ: Stav nahrávání

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

      // 1. Profil (včetně loga)
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
        .order('day_of_week', { ascending: true })
      
      setHours(hoursData || [])
      setLoadingHours(false)

    } catch (error) {
      console.error('Chyba při načítání:', error)
    }
  }

  // --- LOGIKA NAHRÁVÁNÍ LOGA ---
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploadingLogo(true)
      
      if (!e.target.files || e.target.files.length === 0) {
        throw new Error('Nevybrali jste žádný soubor.')
      }

      const file = e.target.files[0]
      const fileExt = file.name.split('.').pop()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Nejste přihlášen.')

      // Cesta k souboru: user_id/logo.jpg (přepíšeme staré logo stejným názvem pro úsporu místa)
      // Přidáme timestamp, aby se obešla cache prohlížeče
      const fileName = `${user.id}/logo-${Date.now()}.${fileExt}`

      // 1. Nahrání do Storage
      const { error: uploadError } = await supabase.storage
        .from('salon-logos')
        .upload(fileName, file, { upsert: true })

      if (uploadError) throw uploadError

      // 2. Získání veřejné URL
      const { data: { publicUrl } } = supabase.storage
        .from('salon-logos')
        .getPublicUrl(fileName)

      // 3. Uložení URL do profilu
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ logo_url: publicUrl })
        .eq('id', user.id)

      if (updateError) throw updateError

      setProfile(prev => ({ ...prev, logo_url: publicUrl }))
      alert('Logo úspěšně nahráno!')

    } catch (error: any) {
      alert('Chyba při nahrávání: ' + error.message)
    } finally {
      setUploadingLogo(false)
    }
  }

  // --- LOGIKA ULOŽENÍ PROFILU (TEXTY) ---
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
        if (error.code === '23505') alert('Tato URL adresa je už zabraná.')
        else throw error
      } else {
        alert('Profil uložen!')
        setProfile(prev => ({ ...prev, slug: formattedSlug }))
      }

    } catch (error: any) {
      alert('Chyba: ' + error.message)
    } finally {
      setSavingProfile(false)
    }
  }

  // --- LOGIKA HODIN ---
  const initializeHours = async () => {
    setLoadingHours(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const defaultHours = Array.from({ length: 7 }, (_, i) => ({
      user_id: user.id,
      day_of_week: i,
      open_time: '09:00',
      close_time: '17:00',
      is_closed: i === 0 || i === 6
    }))

    await supabase.from('business_hours').insert(defaultHours)
    fetchData()
  }

  const handleHoursSave = async (id: string, updates: Partial<BusinessHour>) => {
    setSavingHours(true)
    setHours(prev => prev.map(h => h.id === id ? { ...h, ...updates } : h))
    await supabase.from('business_hours').update(updates).eq('id', id)
    setSavingHours(false)
  }

  if (loadingProfile && loadingHours) return <div className="p-8 text-center">Načítám...</div>

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-10">
      <h1 className="text-3xl font-bold text-slate-800">Nastavení Salonu</h1>

      {/* 1. KARTA: PROFIL & LOGO */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Store className="h-5 w-5" /> Veřejný Profil
          </CardTitle>
          <CardDescription>Tyto informace uvidí vaši zákazníci na webu.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleProfileSave} className="space-y-6">
            
            {/* SEKVENCE PRO LOGO */}
            <div className="flex flex-col sm:flex-row items-center gap-6 p-4 bg-slate-50 rounded-lg border border-dashed">
              <div className="relative h-24 w-24 shrink-0">
                {profile.logo_url ? (
                  <img 
                    src={profile.logo_url} 
                    alt="Logo salonu" 
                    className="h-full w-full rounded-full object-cover border-2 border-white shadow-sm"
                  />
                ) : (
                  <div className="h-full w-full rounded-full bg-slate-200 flex items-center justify-center text-slate-400">
                    <ImageIcon className="h-8 w-8" />
                  </div>
                )}
                {uploadingLogo && (
                  <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center text-white text-xs">
                    ...
                  </div>
                )}
              </div>
              
              <div className="flex-1 text-center sm:text-left space-y-2">
                <h3 className="font-medium text-slate-900">Logo Salonu</h3>
                <p className="text-xs text-slate-500">Doporučujeme čtvercový obrázek (PNG, JPG). Max 2MB.</p>
                
                <div className="flex justify-center sm:justify-start">
                  <Label htmlFor="logo-upload" className="cursor-pointer">
                    <div className="flex items-center gap-2 bg-white border px-3 py-2 rounded-md text-sm hover:bg-slate-50 transition-colors shadow-sm">
                      <Upload className="h-4 w-4" />
                      {uploadingLogo ? 'Nahrávám...' : 'Nahrát nové logo'}
                    </div>
                    <Input 
                      id="logo-upload" 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={handleLogoUpload}
                      disabled={uploadingLogo}
                    />
                  </Label>
                </div>
              </div>
            </div>

            {/* ZBYTEK FORMULÁŘE (STEJNÝ JAKO PŘEDTÍM) */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="salonName">Název Salonu</Label>
                <div className="relative">
                  <Store className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <Input 
                    id="salonName" className="pl-9" placeholder="Např. Kadeřnictví Jana" 
                    value={profile.salon_name} onChange={e => setProfile({...profile, salon_name: e.target.value})} required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="slug">Webová adresa (URL)</Label>
                <div className="relative">
                  <Globe className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <Input 
                    id="slug" className="pl-9" placeholder="např. kadernictvi-jana" 
                    value={profile.slug} onChange={e => setProfile({...profile, slug: e.target.value})} required
                  />
                </div>
                <p className="text-xs text-slate-500">Vaše adresa bude: salonio.cz/<strong>{profile.slug || 'vase-adresa'}</strong></p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Telefon</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <Input 
                    id="phone" className="pl-9" placeholder="+420 123 456 789" 
                    value={profile.phone} onChange={e => setProfile({...profile, phone: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Adresa</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <Input 
                    id="address" className="pl-9" placeholder="Ulice 123, Město" 
                    value={profile.address} onChange={e => setProfile({...profile, address: e.target.value})}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="desc">Popis o nás</Label>
              <div className="relative">
                <FileText className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <Input 
                  id="desc" className="pl-9" placeholder="Krátce o vašem salonu..." 
                  value={profile.description} onChange={e => setProfile({...profile, description: e.target.value})}
                />
              </div>
            </div>

            <Button type="submit" disabled={savingProfile}>
              {savingProfile ? 'Ukládám...' : <><Save className="mr-2 h-4 w-4" /> Uložit profil</>}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* 2. KARTA: OTEVÍRACÍ DOBA (BEZE ZMĚN) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" /> Otevírací doba
          </CardTitle>
          <CardDescription>Nastavte, kdy si mohou klienti rezervovat termíny.</CardDescription>
        </CardHeader>
        <CardContent>
          {hours.length === 0 ? (
            <div className="text-center py-8">
              <AlertCircle className="h-10 w-10 text-yellow-500 mx-auto mb-2" />
              <Button onClick={initializeHours} disabled={loadingHours}>Vygenerovat standardní</Button>
            </div>
          ) : (
            <div className="space-y-4">
              {[...hours.slice(1), hours[0]].map((day) => (
                <div key={day.id} className={`flex items-center justify-between p-3 rounded-lg border ${day.is_closed ? 'bg-slate-50 border-slate-100' : 'bg-white border-slate-200'}`}>
                  <div className="w-24 font-medium text-slate-700">{DAYS[day.day_of_week]}</div>
                  <div className="flex items-center gap-2">
                    <Label htmlFor={`closed-${day.id}`} className="text-xs text-slate-500 md:hidden">{day.is_closed ? 'Zavřeno' : 'Otevřeno'}</Label>
                    <Switch id={`closed-${day.id}`} checked={!day.is_closed} onCheckedChange={(checked: boolean) => handleHoursSave(day.id, { is_closed: !checked })} />
                  </div>
                  <div className={`flex items-center gap-2 transition-opacity ${day.is_closed ? 'opacity-20 pointer-events-none' : 'opacity-100'}`}>
                    <Input type="time" className="w-24" value={day.open_time?.slice(0,5)} onChange={(e) => handleHoursSave(day.id, { open_time: e.target.value })} />
                    <span className="hidden md:inline text-slate-400">-</span>
                    <Input type="time" className="w-24" value={day.close_time?.slice(0,5)} onChange={(e) => handleHoursSave(day.id, { close_time: e.target.value })} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}