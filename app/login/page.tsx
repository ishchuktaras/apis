// app/login/page.tsx

'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Eye, EyeOff, ArrowLeft, Mail, Loader2 } from 'lucide-react'
import { toast } from "sonner"
// Importujeme LogoIcon z komponent, přesně jako v LandingHeader
import { LogoIcon } from "@/components/logo" 

// --- KOMPONENTA PRO HESLO ---
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
        className="pr-10 bg-white border-slate-200 focus:border-[#F4C430] focus:ring-[#F4C430]" 
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
  
  // Stavy pro registraci
  const [fullName, setFullName] = useState('')
  const [salonName, setSalonName] = useState('')

  const [loading, setLoading] = useState(false)
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

    if (!fullName.trim()) {
        toast.error('Prosím vyplňte své jméno.')
        setLoading(false)
        return
    }

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { 
        data: { 
            full_name: fullName,
            salon_name: salonName || 'Můj Nový Salon',
            role: 'owner'
        } 
      },
    })

    if (error) {
      toast.error(error.message)
    } else {
      toast.success('Účet vytvořen! Zkontrolujte email nebo se přihlašte.')
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
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#F8F5E6] p-4 font-sans">
      
      {/* Logo Component - Přesně podle LandingHeader */}
      <div className="mb-8">
        <Link className="flex items-center justify-center gap-2" href="/">
           {/* Používáme text-[#F4C430] (medová žlutá) pro ikonu na světlém pozadí */}
           <LogoIcon className="h-12 w-12 text-[#F4C430]" />
           <span className="font-bold text-xl tracking-tight text-slate-900">APIS</span>
        </Link>
      </div>

      {/* --- OBRAZOVKA: RESET HESLA --- */}
      {view === 'reset' ? (
        <Card className="w-full max-w-[400px] border-none shadow-xl shadow-slate-200/50">
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
                    className="pl-9 bg-white border-slate-200 focus:border-[#F4C430] focus:ring-[#F4C430]"
                    value={email} 
                    onChange={e => setEmail(e.target.value)} 
                    required 
                  />
                </div>
              </div>
              <Button type="submit" className="w-full bg-[#1A1A1A] hover:bg-slate-800 text-white font-bold" disabled={loading}>
                {loading ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : null}
                {loading ? 'Odesílám...' : 'Odeslat odkaz pro obnovu'}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex justify-center">
            <Button variant="link" onClick={() => setView('auth')} className="text-slate-500 hover:text-[#1A1A1A]">
              <ArrowLeft className="mr-2 h-4 w-4" /> Zpět na přihlášení
            </Button>
          </CardFooter>
        </Card>
      ) : (
        
      /* --- OBRAZOVKA: LOGIN / REGISTRACE --- */
      <Tabs defaultValue="login" className="w-full max-w-[400px]">
        
        <TabsList className="grid w-full grid-cols-2 mb-4 bg-slate-200/50 p-1 rounded-xl">
          <TabsTrigger value="login" className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-[#1A1A1A] data-[state=active]:shadow-sm">Přihlášení</TabsTrigger>
          <TabsTrigger value="register" className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-[#1A1A1A] data-[state=active]:shadow-sm">Registrace</TabsTrigger>
        </TabsList>

        {/* LOGIN FORM */}
        <TabsContent value="login">
          <Card className="border-none shadow-xl shadow-slate-200/50">
            <CardHeader>
              <CardTitle className="text-xl">Vítejte zpět</CardTitle>
              <CardDescription>Přihlaste se do správy svého salonu.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email-login">Email</Label>
                  <Input 
                    id="email-login" 
                    type="email" 
                    placeholder="salon@example.com" 
                    value={email} 
                    onChange={e => setEmail(e.target.value)} 
                    required 
                    className="bg-white border-slate-200 focus:border-[#F4C430] focus:ring-[#F4C430]"
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="pass-login">Heslo</Label>
                    <button 
                      type="button"
                      onClick={() => setView('reset')}
                      className="text-xs text-slate-500 hover:text-[#F4C430] hover:underline font-medium"
                    >
                      Zapomněli jste heslo?
                    </button>
                  </div>
                  <PasswordInput 
                    id="pass-login" 
                    value={password} 
                    onChange={(e: any) => setPassword(e.target.value)} 
                  />
                </div>
                <Button type="submit" className="w-full bg-[#1A1A1A] hover:bg-slate-800 text-white font-bold h-11" disabled={loading}>
                  {loading ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : null}
                  {loading ? 'Pracuji...' : 'Přihlásit se'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* REGISTER FORM */}
        <TabsContent value="register">
          <Card className="border-none shadow-xl shadow-slate-200/50">
            <CardHeader>
              <CardTitle className="text-xl">Nový účet</CardTitle>
              <CardDescription>Začněte používat APIS zdarma ještě dnes.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSignUp} className="space-y-4">
                
                <div className="space-y-2">
                  <Label htmlFor="fullname-reg">Jméno a Příjmení</Label>
                  <Input 
                    id="fullname-reg" 
                    placeholder="Jan Novák" 
                    value={fullName} 
                    onChange={e => setFullName(e.target.value)} 
                    required 
                    className="bg-white border-slate-200 focus:border-[#F4C430] focus:ring-[#F4C430]"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="salon-reg">Název Salonu</Label>
                  <Input 
                    id="salon-reg" 
                    placeholder="Studio Exclusive" 
                    value={salonName} 
                    onChange={e => setSalonName(e.target.value)} 
                    className="bg-white border-slate-200 focus:border-[#F4C430] focus:ring-[#F4C430]"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email-reg">Email</Label>
                  <Input 
                    id="email-reg" 
                    type="email" 
                    placeholder="admin@test.cz" 
                    value={email} 
                    onChange={e => setEmail(e.target.value)} 
                    required 
                    className="bg-white border-slate-200 focus:border-[#F4C430] focus:ring-[#F4C430]"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pass-reg">Heslo</Label>
                  <PasswordInput 
                    id="pass-reg" 
                    value={password} 
                    onChange={(e: any) => setPassword(e.target.value)} 
                  />
                  <p className="text-[10px] text-slate-500">Minimálně 6 znaků.</p>
                </div>
                <Button type="submit" className="w-full bg-[#1A1A1A] hover:bg-slate-800 text-white font-bold h-11" disabled={loading}>
                  {loading ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : null}
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