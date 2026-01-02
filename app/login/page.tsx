// app/login/page.tsx

'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Scissors, CheckCircle, Eye, EyeOff, ArrowLeft, Mail } from 'lucide-react'
import { toast } from "sonner"


// Tím zabráníme jejímu neustálému znovuvytváření a ztrátě fokusu.
const PasswordInput = ({ id, value, onChange }: any) => {
  const [showPassword, setShowPassword] = useState(false)

  return (
    <div className="relative">
      <Input 
        id={id} 
        type={showPassword ? "text" : "password"} 
        value={value} 
        onChange={onChange} 
        required 
        minLength={6}
        className="pr-10" 
      />
      <button
        type="button"
        onClick={() => setShowPassword(!showPassword)}
        className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 focus:outline-none"
        tabIndex={-1}
      >
        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  )
}

export default function AuthPage() {
  const router = useRouter()
  
  // Stavy formulářů
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  
  // NOVÉ: Stavy pro registraci
  const [fullName, setFullName] = useState('')
  const [salonName, setSalonName] = useState('')

  const [loading, setLoading] = useState(false)
  
  // UX Stavy
  const [view, setView] = useState<'auth' | 'reset'>('auth') 

  // --- 1. PŘIHLÁŠENÍ ---
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      toast.error(error.message)
    } else {
      toast.success('Vítejte zpět!')
      router.push('/dashboard')
    }
    setLoading(false)
  }

  // --- 2. REGISTRACE ---
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    // Validace jména
    if (!fullName.trim()) {
        toast.error('Prosím vyplňte své jméno.')
        setLoading(false)
        return
    }

    const { error } = await supabase.auth.signUp({
      email,
      password,
      // ZDE SE DĚJE KOUZLO: Posíláme data do SQL triggeru
      options: { 
        data: { 
            full_name: fullName, // Toto se zapíše do Profiles.full_name
            salon_name: salonName || 'Můj Nový Salon',
            role: 'owner'
        } 
      },
    })

    if (error) {
      toast.error(error.message)
    } else {
      toast.success('Účet vytvořen! Nyní se můžete přihlásit.')
      // Volitelně můžeme uživatele rovnou přesměrovat nebo přepnout tab
    }
    setLoading(false)
  }

  // --- 3. RESET HESLA ---
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback?next=/dashboard/settings`,
      })

      if (error) throw error

      toast.success('Odkaz pro obnovu hesla byl odeslán na váš email.')
      setView('auth') 

    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-100 p-4">
      
      {/* Logo */}
      <div className="mb-8 flex items-center gap-2 text-2xl font-bold text-slate-800">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 text-white">
          <Scissors className="h-5 w-5" />
        </div>
        APIS
      </div>

      {/* --- OBRAZOVKA: RESET HESLA --- */}
      {view === 'reset' ? (
        <Card className="w-full max-w-[400px]">
          <CardHeader>
            <CardTitle>Obnova hesla</CardTitle>
            <CardDescription>Zadejte svůj e-mail a my vám pošleme instrukce.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email-reset">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <Input 
                    id="email-reset" 
                    type="email" 
                    placeholder="salon@example.com" 
                    className="pl-9"
                    value={email} 
                    onChange={e => setEmail(e.target.value)} 
                    required 
                  />
                </div>
              </div>
              <Button type="submit" className="w-full bg-slate-900 hover:bg-slate-800" disabled={loading}>
                {loading ? 'Odesílám...' : 'Odeslat odkaz pro obnovu'}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex justify-center">
            <Button variant="link" onClick={() => setView('auth')} className="text-slate-500">
              <ArrowLeft className="mr-2 h-4 w-4" /> Zpět na přihlášení
            </Button>
          </CardFooter>
        </Card>
      ) : (
        
      /* --- OBRAZOVKA: LOGIN / REGISTRACE --- */
      <Tabs defaultValue="login" className="w-full max-w-[400px]">
        
        <TabsList className="grid w-full grid-cols-2 mb-4">
          <TabsTrigger value="login">Přihlášení</TabsTrigger>
          <TabsTrigger value="register">Registrace</TabsTrigger>
        </TabsList>

        {/* LOGIN FORM */}
        <TabsContent value="login">
          <Card>
            <CardHeader>
              <CardTitle>Vítejte zpět</CardTitle>
              <CardDescription>Přihlaste se do svého salonu.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email-login">Email</Label>
                  <Input id="email-login" type="email" placeholder="salon@example.com" value={email} onChange={e => setEmail(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="pass-login">Heslo</Label>
                    <button 
                      type="button"
                      onClick={() => setView('reset')}
                      className="text-xs text-slate-500 hover:text-slate-800 hover:underline"
                    >
                      Zapomněli jste heslo?
                    </button>
                  </div>
                  {/* Použití komponenty */}
                  <PasswordInput 
                    id="pass-login" 
                    value={password} 
                    onChange={(e: any) => setPassword(e.target.value)} 
                  />
                </div>
                <Button type="submit" className="w-full bg-slate-900 hover:bg-slate-800" disabled={loading}>
                  {loading ? 'Pracuji...' : 'Přihlásit se'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* REGISTER FORM */}
        <TabsContent value="register">
          <Card>
            <CardHeader>
              <CardTitle>Nový účet</CardTitle>
              <CardDescription>Začněte používat APIS zdarma.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSignUp} className="space-y-4">
                
                {/* 1. Pole: Jméno (NOVÉ) */}
                <div className="space-y-2">
                  <Label htmlFor="fullname-reg">Jméno a Příjmení</Label>
                  <Input 
                    id="fullname-reg" 
                    placeholder="Jan Novák" 
                    value={fullName} 
                    onChange={e => setFullName(e.target.value)} 
                    required 
                  />
                </div>

                {/* 2. Pole: Název Salonu (NOVÉ) */}
                <div className="space-y-2">
                  <Label htmlFor="salon-reg">Název Salonu</Label>
                  <Input 
                    id="salon-reg" 
                    placeholder="Studio Exclusive" 
                    value={salonName} 
                    onChange={e => setSalonName(e.target.value)} 
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email-reg">Email</Label>
                  <Input id="email-reg" type="email" placeholder="admin@test.cz" value={email} onChange={e => setEmail(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pass-reg">Heslo</Label>
                  <PasswordInput 
                    id="pass-reg" 
                    value={password} 
                    onChange={(e: any) => setPassword(e.target.value)} 
                  />
                  <p className="text-[10px] text-muted-foreground">Minimálně 6 znaků.</p>
                </div>
                <Button type="submit" className="w-full bg-slate-900 hover:bg-slate-800" disabled={loading}>
                  {loading ? 'Vytvářím účet...' : 'Vytvořit účet'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

      </Tabs>
      )}
    </div>
  )
}